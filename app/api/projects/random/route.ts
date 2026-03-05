import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const excludeParam = searchParams.get('exclude') ?? '';

  const excludeIds = excludeParam
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

  let project;

  if (excludeIds.length > 0) {
    const rows = await sql`
      SELECT * FROM projects
      WHERE id NOT IN ${sql(excludeIds)}
      ORDER BY RANDOM()
      LIMIT 1
    `;
    project = rows[0] ?? null;
  }

  // Fallback: no exclusions or all seen — pick any random project
  if (!project) {
    const rows = await sql`SELECT * FROM projects ORDER BY RANDOM() LIMIT 1`;
    project = rows[0] ?? null;
  }

  if (!project) {
    return NextResponse.json({ error: 'No projects available' }, { status: 404 });
  }

  return NextResponse.json(project);
}
