import { NextRequest, NextResponse } from 'next/server';
import sql, { initDb } from '@/lib/db';
import { fetchRecentGithubPosts, parseGithubUrl } from '@/lib/hn';
import { getRepoData, getOwnerData, getReadmePreview } from '@/lib/github';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.SCRAPER_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initDb();

  const daysBack = 1;
  const posts = await fetchRecentGithubPosts(daysBack);

  let upserted = 0;
  let skipped = 0;

  for (const post of posts) {
    const parsed = parseGithubUrl(post.url);
    if (!parsed) { skipped++; continue; }

    const { owner, repo } = parsed;

    try {
      const [repoData, ownerData, readme] = await Promise.all([
        getRepoData(owner, repo),
        getOwnerData(owner),
        getReadmePreview(owner, repo),
      ]);

      if (!repoData || !ownerData) { skipped++; continue; }

      await sql`
        INSERT INTO projects (
          hn_post_id, hn_title, hn_url, hn_score, hn_author, hn_created_at,
          github_url, github_owner, github_repo,
          description, readme_preview,
          stars, forks, language, topics,
          owner_avatar, owner_bio, owner_repos, owner_stars
        ) VALUES (
          ${post.objectID}, ${post.title}, ${'https://news.ycombinator.com/item?id=' + post.objectID},
          ${post.points ?? 0}, ${post.author}, ${post.created_at},
          ${post.url}, ${owner}, ${repo},
          ${repoData.description}, ${readme},
          ${repoData.stars}, ${repoData.forks}, ${repoData.language}, ${repoData.topics},
          ${ownerData.avatar}, ${ownerData.bio}, ${ownerData.public_repos}, ${ownerData.owner_stars}
        )
        ON CONFLICT (hn_post_id) DO UPDATE SET
          hn_score = EXCLUDED.hn_score,
          stars = EXCLUDED.stars,
          forks = EXCLUDED.forks
      `;
      upserted++;
    } catch (err) {
      console.error(`Failed to process ${owner}/${repo}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    found: posts.length,
    upserted,
    skipped,
  });
}
