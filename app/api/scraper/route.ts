import { NextRequest, NextResponse } from 'next/server';
import sql, { initDb } from '@/lib/db';
import { fetchRecentGithubPosts, parseGithubUrl } from '@/lib/hn';
import { fetchRecentLobstersPosts } from '@/lib/lobsters';
import { fetchGithubTrending } from '@/lib/github-trending';
import { getRepoData, getOwnerData, getReadmePreview } from '@/lib/github';
import type { SourcePost } from '@/lib/sources';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.SCRAPER_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initDb();

  // Fetch from all sources in parallel
  const [hnHits, lobstersPosts, trendingPosts] = await Promise.all([
    fetchRecentGithubPosts(1).catch((err) => { console.error('HN fetch failed:', err); return []; }),
    fetchRecentLobstersPosts().catch((err) => { console.error('Lobsters fetch failed:', err); return []; }),
    fetchGithubTrending().catch((err) => { console.error('Trending fetch failed:', err); return []; }),
  ]);

  // Convert HN hits to SourcePost format
  const hnPosts: SourcePost[] = hnHits.map((post) => ({
    sourceId: post.objectID,
    source: 'hackernews',
    title: post.title,
    postUrl: `https://news.ycombinator.com/item?id=${post.objectID}`,
    githubUrl: post.url,
    score: post.points ?? 0,
    author: post.author,
    createdAt: post.created_at,
  }));

  const allPosts = [...hnPosts, ...lobstersPosts, ...trendingPosts];

  const counts: Record<string, { found: number; upserted: number; skipped: number }> = {};

  for (const post of allPosts) {
    const src = post.source;
    if (!counts[src]) counts[src] = { found: 0, upserted: 0, skipped: 0 };
    counts[src].found++;

    const parsed = parseGithubUrl(post.githubUrl);
    if (!parsed) { counts[src].skipped++; continue; }

    const { owner, repo } = parsed;

    try {
      const [repoData, ownerData, readme] = await Promise.all([
        getRepoData(owner, repo),
        getOwnerData(owner),
        getReadmePreview(owner, repo),
      ]);

      if (!repoData || !ownerData) { counts[src].skipped++; continue; }

      await sql`
        INSERT INTO projects (
          hn_post_id, hn_title, hn_url, hn_score, hn_author, hn_created_at,
          github_url, github_owner, github_repo,
          description, readme_preview,
          stars, forks, language, topics,
          owner_avatar, owner_bio, owner_repos, owner_stars,
          source
        ) VALUES (
          ${post.sourceId}, ${post.title}, ${post.postUrl},
          ${post.score}, ${post.author}, ${post.createdAt},
          ${post.githubUrl}, ${owner}, ${repo},
          ${repoData.description}, ${readme},
          ${repoData.stars}, ${repoData.forks}, ${repoData.language}, ${repoData.topics},
          ${ownerData.avatar}, ${ownerData.bio}, ${ownerData.public_repos}, ${ownerData.owner_stars},
          ${post.source}
        )
        ON CONFLICT (hn_post_id) DO UPDATE SET
          hn_score = EXCLUDED.hn_score,
          stars = EXCLUDED.stars,
          forks = EXCLUDED.forks
      `;
      counts[src].upserted++;
    } catch (err) {
      console.error(`Failed to process ${owner}/${repo} (${src}):`, err);
      counts[src].skipped++;
    }
  }

  return NextResponse.json({ ok: true, sources: counts });
}
