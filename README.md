# discover.gh

Browse interesting GitHub projects surfaced from Hacker News — one at a time.

## What it does

- Daily scraper pulls HN posts that link directly to GitHub repos
- Enriches each project with GitHub API data (stars, forks, language, topics, README preview, owner stats)
- Single-project UI with keyboard-driven navigation

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `→` `↓` `j` `Space` | Next project |
| `←` `↑` `k` | Previous project |
| `g` | Open on GitHub |
| `h` | Open HN thread |
| `?` | Toggle keyboard help |

## Setup

### 1. Clone and install
```bash
git clone https://github.com/kpramod17/discover-github
cd discover-github
npm install
```

### 2. Environment variables
Copy `.env.local.example` to `.env.local` and fill in:
```
DATABASE_URL=       # Neon Postgres connection string
GITHUB_TOKEN=       # GitHub personal access token (read:public_repo)
SCRAPER_SECRET=     # Random secret to protect the scraper endpoint
```

### 3. Seed the database
The schema is auto-created on first scraper run:
```bash
curl -X POST http://localhost:3000/api/scraper \
  -H "Authorization: Bearer YOUR_SCRAPER_SECRET"
```

### 4. Run locally
```bash
npm run dev
```

## Deployment (Vercel)

1. Connect this GitHub repo to Vercel
2. Add environment variables in Vercel project settings
3. The `vercel.json` cron runs the scraper daily at 06:00 UTC

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Neon Postgres** via `postgres.js`
- **Tailwind CSS** with custom dark design system
- **HN Algolia API** for discovering posts
- **GitHub REST API** for enrichment
