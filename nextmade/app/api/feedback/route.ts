import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
import { body, db, json, sameOrigin } from '../../../lib/backend';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin.' }, 403);
  let b;
  try {
    b = z
      .object({ kind: z.enum(['win', 'love', 'feature', 'problem', 'reply']), text: z.string().trim().min(1).max(3000), page: z.string().max(60).default('') })
      .parse(await body(req, 8000));
  } catch {
    return json({ error: 'Choose a type and write a short message.' }, 400);
  }
  try {
    await db('feedback', 'POST', { user_id: u.userId, kind: b.kind, text: b.text, page: b.page });
    return json({ ok: true });
  } catch {
    return json({ error: 'Feedback could not be sent. If this keeps happening, the feedback table may not be set up yet.' }, 503);
  }
}
