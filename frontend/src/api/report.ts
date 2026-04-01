import { BASE_URL } from './config';

export async function createReport(reportedId: number, reason: string, body: string): Promise<{ error?: string }> {
  const res = await fetch(`${BASE_URL}/report/create.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reported_id: reportedId, reason, body }),
  });
  return res.json();
}
