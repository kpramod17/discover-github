import type { SourcePost } from './sources';

interface TrendingRepo {
  author: string;
  name: string;
  url: string;
  description: string;
  language: string | null;
  stars: number;
  forks: number;
  currentPeriodStars: number;
}

export async function fetchGithubTrending(): Promise<SourcePost[]> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let repos: TrendingRepo[] = [];
  try {
    const res = await fetch('https://ghapi.huchen.dev/repositories?since=daily', {
      headers: { 'User-Agent': 'discover-gh-scraper/1.0' },
    });
    if (!res.ok) throw new Error(`Trending API error: ${res.status}`);
    repos = await res.json();
    if (!Array.isArray(repos)) throw new Error('Unexpected response shape');
  } catch (err) {
    console.error('GitHub Trending fetch failed:', err);
    return [];
  }

  return repos
    .filter((r) => r.author && r.name && r.url)
    .map((r) => ({
      sourceId: `trending:${today}:${r.author}/${r.name}`,
      source: 'github-trending',
      title: r.name,
      postUrl: null,
      githubUrl: r.url.startsWith('http') ? r.url : `https://github.com/${r.author}/${r.name}`,
      score: r.currentPeriodStars ?? 0,
      author: null,
      createdAt: new Date().toISOString(),
    }));
}
