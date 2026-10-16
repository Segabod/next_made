// Public sign-up for an offer page. No account needed; the details go only to the page's founder.
import { z } from 'zod';
import { db, json, sameOrigin } from '../../../../lib/backend';
import { emailOk, slugPattern } from '../../../pages-logic';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin.' }, 403);
  let b;
  try {
    b = z
      .object({
        slug: z.string().regex(slugPattern),
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().toLowerCase().max(254),
        answer: z.string().max(1000).default(''),
        website: z.string().max(200).default(''), // honeypot: people never fill this in
        elapsed: z.number().default(0),
      })
      .parse(JSON.parse((await req.text()).slice(0, 4000)));
  } catch {
    return json({ error: 'Add your name and email.' }, 400);
  }
  if (!emailOk(b.email)) return json({ error: 'Check your email address.' }, 400);
  if (b.website || b.elapsed < 2500) return json({ ok: true }); // likely automated; accept silently, store nothing
  try {
    await db('rpc/submit_offer_signup', 'POST', { page_slug: b.slug, signup_name: b.name, signup_email: b.email, signup_answer: b.answer }, '');
    return json({ ok: true });
  } catch {
    return json({ error: 'This page is not accepting sign-ups right now.' }, 400);
  }
}
