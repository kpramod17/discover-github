import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
});

export default sql;

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id              SERIAL PRIMARY KEY,
      hn_post_id      TEXT UNIQUE NOT NULL,
      hn_title        TEXT,
      hn_url          TEXT,
      hn_score        INTEGER,
      hn_author       TEXT,
      hn_created_at   TIMESTAMPTZ,
      github_url      TEXT,
      github_owner    TEXT,
      github_repo     TEXT,
      description     TEXT,
      readme_preview  TEXT,
      stars           INTEGER,
      forks           INTEGER,
      language        TEXT,
      topics          TEXT[],
      owner_avatar    TEXT,
      owner_bio       TEXT,
      owner_repos     INTEGER,
      owner_stars     INTEGER,
      scraped_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
