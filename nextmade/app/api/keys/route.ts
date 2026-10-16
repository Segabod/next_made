// Personal keys for Connect your AI (Pro). The key is shown once; only its SHA-256 hash is stored.
import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { body, db, json, rpc, sameOrigin } from '../../../lib/backend';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  try {
    return json({ keys: await db('api_keys?select=id,name,prefix,created,last_used&order=created.desc') });
  } catch {
    return json({ error: 'Connect your AI is not set up yet. Run supabase/005_discover_pro_growth.sql.' }, 503);
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
        z.object({ action: z.literal('create'), name: z.string().trim().min(1).max(60) }),
        z.object({ action: z.literal('revoke'), id: z.string().uuid() }),
      ])
      .parse(await body(req, 2000));
  } catch {
    return json({ error: 'Name the key, for example “Claude on my laptop”.' }, 400);
  }
  try {
    if (b.action === 'revoke') {
      await db('api_keys?id=eq.' + b.id + '&user_id=eq.' + u.userId, 'DELETE');
      return json({ ok: true });
    }
    const key = 'nm_' + randomBytes(32).toString('base64url');
    const hash = createHash('sha256').update(key).digest('hex');
    await rpc('create_api_key', { key_name: b.name, new_hash: hash, new_prefix: key.slice(0, 10) });
    return json({ key });
  } catch {
    return json({ error: 'Could not create a key. Connect your AI is part of Pro, with up to 5 keys.' }, 403);
  }
}
