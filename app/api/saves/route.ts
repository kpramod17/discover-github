import { NextRequest, NextResponse } from 'next/server';
import sql, { initDb } from '@/lib/db';
import { appendSaveRow } from '@/lib/sheets';
import { sendSaveLimitEmail } from '@/lib/email';

const SAVE_LIMIT = 500;

export async function POST(req: NextRequest) {
  await initDb();

  const { project_id, github_owner, github_repo, description, stars, language, github_url, hn_url } =
    await req.json();

  if (!project_id) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  // Check current count before inserting
  const [{ count: currentCount }] = await sql<[{ count: string }]>`
    SELECT COUNT(*)::text AS count FROM saves
  `;

  if (Number(currentCount) >= SAVE_LIMIT) {
    return NextResponse.json({ error: 'limit_reached' }, { status: 400 });
  }

  // Insert (ignore duplicates)
  await sql`
    INSERT INTO saves (project_id) VALUES (${project_id})
    ON CONFLICT (project_id) DO NOTHING
  `;

  // Get updated count
  const [{ count: newCount }] = await sql<[{ count: string }]>`
    SELECT COUNT(*)::text AS count FROM saves
  `;

  const count = Number(newCount);

  // Fire-and-forget: append to Google Sheet
  appendSaveRow({
    saved_at: new Date().toISOString(),
    owner: github_owner,
    repo: github_repo,
    description,
    stars,
    language,
    github_url,
    hn_url,
  }).catch((err) => console.error('Sheet append failed:', err));

  // Fire-and-forget: send limit email exactly at 500
  if (count === SAVE_LIMIT) {
    sendSaveLimitEmail().catch((err) => console.error('Limit email failed:', err));
  }

  return NextResponse.json({ ok: true, count });
}
