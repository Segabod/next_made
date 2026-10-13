// Daily scheduled job (Vercel Cron, see vercel.json): sends due-today reminders and, on Mondays, the weekly progress letter.
import { dayIn, hasDigest, dailyDigest, normalize } from '../../../domain';
import { membersWithWorkspaces, adminReady } from '../../../../lib/admin';
import { dailyEmail, emailReady, sendEmail, weeklyEmail } from '../../../../lib/email';
import { aiReady, generate } from '../../../../lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}

async function novaNote(firstName: string, stats: unknown) {
  if (!aiReady()) return undefined;
  try {
    return await generate({
      system:
        'You are Nova, NextMade’s AI accountability partner. Write 2 to 3 warm, direct sentences for a weekly progress email. Use only the numbers given; never invent results. Acknowledge effort honestly, name one pattern, and suggest one concrete next step. No greeting, no sign-off, no lists.',
      input: JSON.stringify({ member: firstName, week: stats }),
      maxTokens: 220,
      timeoutMs: 15000,
    });
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!emailReady() || !adminReady()) return Response.json({ skipped: 'Email or scheduled-job keys are not configured.' });
  const started = Date.now();
  const result = { members: 0, daily: 0, weekly: 0, failed: 0 };
  const members = await membersWithWorkspaces();
  result.members = members.length;
  for (const m of members) {
    if (Date.now() - started > 50000) break; // stay inside the function time limit; the rest get tomorrow's run
    const ws = normalize(m.data, m.name.split(' ')[0]);
    const firstName = ws.profile.name || m.name.split(' ')[0] || 'there';
    const today = dayIn(ws.profile.timezone);
    const monday = new Date(today + 'T12:00:00Z').getUTCDay() === 1;
    try {
      if (ws.profile.reminders && hasDigest(dailyDigest(ws, today))) {
        const e = dailyEmail(ws, today, firstName);
        await sendEmail({ to: m.email, ...e, idempotencyKey: `daily-${m.userId}-${today}` });
        result.daily++;
      }
      if (ws.profile.weeklyLetter && monday && ws.goals.length) {
        const draft = weeklyEmail(ws, firstName);
        const e = weeklyEmail(ws, firstName, await novaNote(firstName, draft.stats));
        await sendEmail({ to: m.email, subject: e.subject, html: e.html, text: e.text, idempotencyKey: `weekly-${m.userId}-${today}` });
        result.weekly++;
      }
    } catch (err) {
      result.failed++;
      console.error('reminder failed for member', m.userId, err instanceof Error ? err.message : err);
    }
  }
  return Response.json(result);
}
