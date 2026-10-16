import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
import { body, db, json, sameOrigin } from '../../../lib/backend';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  try {
    const rows = await db('showcase?select=id,user_id,name,title,description,url,created&order=created.desc&limit=100');
    return json({ items: rows.map((r: any) => ({ ...r, mine: r.user_id === u.userId, user_id: undefined })) });
  } catch {
    return json({ error: 'The gallery is not available yet.' }, 503);
  }
}

export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin.' }, 403);
  let b;
  try {
    b = z
      .discriminatedUnion('action', [
        z.object({
          action: z.literal('add'),
          name: z.string().trim().min(1).max(80),
          title: z.string().trim().min(1).max(120),
          description: z.string().max(1000),
          url: z.string().trim().max(500).regex(/^https:\/\/[^\s]+$/),
        }),
        z.object({ action: z.literal('remove'), id: z.string().uuid() }),
      ])
      .parse(await body(req, 8000));
  } catch {
    return json({ error: 'Add a title and a link that starts with https://' }, 400);
  }
  try {
    if (b.action === 'add') await db('showcase', 'POST', { user_id: u.userId, name: b.name, title: b.title, description: b.description, url: b.url });
    else await db('showcase?id=eq.' + b.id + '&user_id=eq.' + u.userId, 'DELETE');
    return json({ ok: true });
  } catch {
    return json({ error: 'Could not update the gallery. You can share up to 10 projects.' }, 503);
  }
}
