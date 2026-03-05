import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export interface SaveRow {
  saved_at: string;
  owner: string;
  repo: string;
  description: string | null;
  stars: number;
  language: string | null;
  github_url: string;
  hn_url: string;
}

export async function appendSaveRow(row: SaveRow): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:H',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        row.saved_at,
        `${row.owner}/${row.repo}`,
        row.description ?? '',
        row.stars,
        row.language ?? '',
        row.github_url,
        row.hn_url,
      ]],
    },
  });
}
