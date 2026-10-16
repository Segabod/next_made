// Offer pages for members: list pages with sign-ups, save, delete, and mark sign-ups imported into First customers.
import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
import { body, db, json, rpc, sameOrigin } from '../../../lib/backend';
import { slugProblem } from '../../pages-logic';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  try {
    const pages = await db('offer_pages?select=id,slug,offer_ref,headline,subhead,bullets,price,cta,question,founder_name,published,blocked,views,created,updated&order=created.desc');
    const ids = pages.map((p: any) => p.id);
    const signups = ids.length ? await db(`offer_signups?select=id,page_id,name,email,answer,imported,created&page_id=in.(${ids.join(',')})&order=created.desc&limit=2000`) : [];
    return json({ pages, signups });
  } catch {
    return json({ error: 'Offer pages are not set up yet. Run supabase/005_discover_pro_growth.sql.' }, 503);
  }
}

const page = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().toLowerCase(),
  offer_ref: z.string().max(100).default(''),
  headline: z.string().trim().min(1).max(120),
  subhead: z.string().max(400).default(''),
  bullets: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  price: z.string().max(80).default(''),
  cta: z.string().trim().min(1).max(40).default('Join the waitlist'),
  question: z.string().max(200).default(''),
  founder_name: z.string().max(80).default(''),
  published: z.boolean().default(false),
});
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), page }),
  z.object({ action: z.literal('delete'), id: z.string().uuid() }),
  z.object({ action: z.literal('imported'), ids: z.array(z.string().uuid()).min(1).max(500) }),
]);

const plain = (s: string) => s.replace(/<[^>]*>/g, '');

export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin.' }, 403);
  let b: z.infer<typeof schema>;
  try {
    b = schema.parse(await body(req, 12000));
  } catch {
    return json({ error: 'Add a headline and check the field lengths.' }, 400);
  }
  try {
    if (b.action === 'delete') {
      await db('offer_pages?id=eq.' + b.id + '&user_id=eq.' + u.userId, 'DELETE');
      return json({ ok: true });
    }
    if (b.action === 'imported') {
      await rpc('mark_signups_imported', { ids: b.ids });
      return json({ ok: true });
    }
    const problem = slugProblem(b.page.slug);
    if (problem) return json({ error: problem }, 400);
    const p = b.page;
    const id = await rpc('save_offer_page', {
      page: { ...p, headline: plain(p.headline), subhead: plain(p.subhead), bullets: p.bullets.map(plain), price: plain(p.price), cta: plain(p.cta), question: plain(p.question), founder_name: plain(p.founder_name) },
    });
    return json({ id });
  } catch (e: any) {
    if (e?.status === 409) return json({ error: 'That address is taken. Try another.' }, 409);
    return json({ error: b.action === 'save' && b.page.published ? 'Could not publish. Free includes 1 live page and Pro includes 10.' : 'Could not save this page.' }, 400);
  }
}
