const GITHUB_REPO_REGEX = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/;

export interface HnHit {
  objectID: string;
  title: string;
  url: string;
  points: number;
  author: string;
  created_at: string;
}

export async function fetchRecentGithubPosts(daysBack = 1): Promise<HnHit[]> {
  const since = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60;

  const url = new URL('https://hn.algolia.com/api/v1/search');
  url.searchParams.set('query', 'github.com');
  url.searchParams.set('tags', 'story');
  url.searchParams.set('numericFilters', `created_at_i>${since}`);
  url.searchParams.set('hitsPerPage', '100');
  url.searchParams.set('attributesToRetrieve', 'objectID,title,url,points,author,created_at');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HN API error: ${res.status}`);

  const data = await res.json();
  const hits: HnHit[] = data.hits ?? [];

  return hits.filter(
    (h) => h.url && GITHUB_REPO_REGEX.test(h.url)
  );
}

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(GITHUB_REPO_REGEX);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
