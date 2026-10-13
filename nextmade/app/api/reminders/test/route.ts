// Lets a signed-in member send today's reminder or this week's letter to their own inbox, to see what it looks like.
import { z } from 'zod';
import { getChatGPTUser } from '../../../chatgpt-auth';
import { dayIn, normalize } from '../../../domain';
import { body, db, json, sameOrigin } from '../../../../lib/backend';
import { dailyEmail, emailReady, sendEmail, weeklyEmail } from '../../../../lib/email';

export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin.' }, 403);
  if (!emailReady()) return json({ error: 'Email is not connected yet.' }, 503);
  let b;
  try {
    b = z.object({ kind: z.enum(['daily', 'weekly']) }).parse(await body(req, 200));
  } catch {
    return json({ error: 'Choose a reminder type.' }, 400);
  }
  try {
    const rows = await db('workspaces?select=data&user_id=eq.' + u.userId);
    const ws = normalize(rows[0]?.data, u.fullName?.split(' ')[0] || '');
    const name = ws.profile.name || u.displayName;
    const e = b.kind === 'daily' ? dailyEmail(ws, dayIn(ws.profile.timezone), name) : weeklyEmail(ws, name);
    await sendEmail({ to: u.email, subject: '[Preview] ' + e.subject, html: e.html, text: e.text });
    return json({ ok: true, to: u.email });
  } catch (err) {
    console.error('test reminder failed', err instanceof Error ? err.message : err);
    return json({ error: 'The email could not be sent. Check that your sending domain is verified in Resend.' }, 502);
  }
}
