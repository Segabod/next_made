// Public offer page (smoke test). Anyone can view a published page and join its waitlist.
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { configured, db } from '../../../lib/backend';
import { slugPattern } from '../../pages-logic';
import SignupForm from './signup-form';
export const dynamic = 'force-dynamic';

type Page = { slug: string; headline: string; subhead: string; bullets: string[]; price: string; cta: string; question: string; founder_name: string };
type P = { params: Promise<{ slug: string }> };

// cache() keeps metadata and page to one database read (and one view) per request.
const load = cache(async (slug: string): Promise<Page | null> => {
  if (!configured() || !slugPattern.test(slug)) return null;
  try {
    return (await db('rpc/public_offer_page', 'POST', { page_slug: slug }, '')) as Page | null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const p = slugPattern.test(slug) ? await load(slug) : null;
  return p ? { title: p.headline, description: p.subhead || undefined, robots: { index: false } } : { title: 'Page not found' };
}

export default async function OfferPage({ params }: P) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  return (
    <main className="op-wrap">
      <article className="op-card">
        {p.founder_name && <p className="op-by">From {p.founder_name}</p>}
        <h1>{p.headline}</h1>
        {p.subhead && <p className="op-sub">{p.subhead}</p>}
        {Array.isArray(p.bullets) && p.bullets.length > 0 && (
          <ul className="op-list">
            {p.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
        {p.price && <p className="op-price">{p.price}</p>}
        <SignupForm slug={p.slug} cta={p.cta} question={p.question} />
        <p className="op-privacy">
          Your name and email go only to the person behind this page, so they can follow up about this offer. This is an early test of interest; nothing is charged.
        </p>
      </article>
      <p className="op-made">
        Made with <a href="/">nextmade.</a>
      </p>
    </main>
  );
}
