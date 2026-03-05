export interface SourcePost {
  sourceId: string;       // namespaced unique ID, e.g. "lobsters:abc123"
  source: string;         // "hackernews" | "lobsters" | "github-trending" | "reddit"
  title: string;
  postUrl: string | null; // URL of the social post (null for github-trending)
  githubUrl: string;      // direct GitHub repo URL
  score: number;          // upvotes / stars gained this period
  author: string | null;
  createdAt: string;      // ISO timestamp
}
