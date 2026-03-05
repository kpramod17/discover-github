import { parseGithubUrl } from './hn';
import type { SourcePost } from './sources';

const FEEDS = ['newest', 't/programming', 't/tools', 't/rust', 't/javascript'];

export async function fetchRecentLobstersPosts(): Promise<SourcePost[]> {
  const seen = new Set<string>();
  const results: SourcePost[] = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(`https://lobste.rs/${feed}.json`, {
        headers: { 'User-Agent': 'discover-gh-scraper/1.0' },
      });
      if (!res.ok) continue;

      const stories = await res.json();
      if (!Array.isArray(stories)) continue;

      for (const story of stories) {
        const url: string = story.url ?? '';
        if (!url || !parseGithubUrl(url)) continue;
        if (seen.has(story.short_id)) continue;
        seen.add(story.short_id);

        results.push({
          sourceId: `lobsters:${story.short_id}`,
          source: 'lobsters',
          title: story.title ?? '',
          postUrl: `https://lobste.rs/s/${story.short_id}`,
          githubUrl: url,
          score: story.score ?? 0,
          author: story.submitter_username ?? null,
          createdAt: story.created_at ?? new Date().toISOString(),
        });
      }
    } catch {
      // skip failed feed, continue with others
    }
  }

  return results;
}
