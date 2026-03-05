const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers: HeadersInit = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

async function ghFetch(path: string) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${path}`);
  return res.json();
}

export interface RepoData {
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
}

export interface OwnerData {
  avatar: string;
  bio: string | null;
  public_repos: number;
  owner_stars: number;
}

export interface EnrichedRepo extends RepoData, OwnerData {}

export async function getRepoData(owner: string, repo: string): Promise<RepoData | null> {
  const data = await ghFetch(`/repos/${owner}/${repo}`);
  if (!data) return null;

  return {
    description: data.description ?? null,
    stars: data.stargazers_count ?? 0,
    forks: data.forks_count ?? 0,
    language: data.language ?? null,
    topics: data.topics ?? [],
  };
}

export async function getOwnerData(owner: string): Promise<OwnerData | null> {
  const [userData, reposData] = await Promise.all([
    ghFetch(`/users/${owner}`),
    ghFetch(`/users/${owner}/repos?per_page=100&sort=updated`),
  ]);

  if (!userData) return null;

  const repos = Array.isArray(reposData) ? reposData : [];
  const owner_stars = repos.reduce(
    (sum: number, r: { stargazers_count?: number }) => sum + (r.stargazers_count ?? 0),
    0
  );

  return {
    avatar: userData.avatar_url ?? '',
    bio: userData.bio ?? null,
    public_repos: userData.public_repos ?? 0,
    owner_stars,
  };
}

export async function getReadmePreview(owner: string, repo: string): Promise<string | null> {
  const data = await ghFetch(`/repos/${owner}/${repo}/readme`);
  if (!data?.content) return null;

  try {
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    // Strip markdown headers, badges, and HTML tags for clean preview
    const clean = decoded
      .replace(/!\[.*?\]\(.*?\)/g, '') // images
      .replace(/\[.*?\]\(.*?\)/g, (m) => m.replace(/\[|\]|\(.*?\)/g, '')) // links → text
      .replace(/<[^>]+>/g, '') // HTML tags
      .replace(/^#+\s+/gm, '') // headings
      .replace(/^\s*[-*]\s+/gm, '') // list markers
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline code
      .replace(/\n{3,}/g, '\n\n') // excess newlines
      .trim();

    // Drop short lines (< 30 chars) — likely TOC/nav entries stripped of their links
    const filtered = clean
      .split('\n')
      .filter((line) => line.trim().length === 0 || line.trim().length >= 30)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return filtered.slice(0, 600);
  } catch {
    return null;
  }
}
