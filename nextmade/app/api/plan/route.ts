// The member's plan and usage, and the founding-member Pro request.
import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
import { body, db, json, rpc, sameOrigin } from '../../../lib/backend';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  try {
    const [tier, used, usage, req] = await Promise.all([
      rpc('my_plan'),
      rpc('research_used'),
      db('ai_usage?select=day,count&user_id=eq.' + u.userId),
      db('upgrade_requests?select=created&user_id=eq.' + u.userId),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    return json({
      tier: tier === 'pro' ? 'pro' : 'free',
      researchUsed: Number(used) || 0,
      aiToday: usage[0]?.day === today ? usage[0].count : 0,
      requested: !!req.length,
      ready: true,
    });
  } catch {
    // Before migration 005 runs, everyone is treated as Free and plan features explain the setup step.
    return json({ tier: 'free', researchUsed: 0, aiToday: 0, requested: false, ready: false });
  }
}

export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin.' }, 403);
  let b;
  try {
    b = z.object({ reason: z.string().max(1000).default('') }).parse(await body(req, 4000));
  } catch {
    return json({ error: 'Keep your note under 1,000 characters.' }, 400);
  }
  try {
    await db('upgrade_requests', 'POST', { user_id: u.userId, name: (u.fullName || '').slice(0, 80), reason: b.reason });
    return json({ ok: true });
  } catch (e: any) {
    if (e?.status === 409) return json({ ok: true });
    return json({ error: 'Could not send your request. Try again later.' }, 503);
  }
}
