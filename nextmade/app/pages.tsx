'use client';
// Offer pages: publish a simple public page for an offer, collect sign-ups, and move them into First customers.
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, Globe, Inbox, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { limits } from './plans';
import { slugify, slugProblem } from './pages-logic';
import { CopyButton, Field, Heading, now, timeAgo, uid, type Ctx } from './ui';
import { localDay } from './domain';

type Page = {
  id: string;
  slug: string;
  offer_ref: string;
  headline: string;
  subhead: string;
  bullets: string[];
  price: string;
  cta: string;
  question: string;
  founder_name: string;
  published: boolean;
  blocked: boolean;
  views: number;
  created: string;
};
type Signup = { id: string; page_id: string; name: string; email: string; answer: string; imported: boolean; created: string };

export default function Pages({ ctx }: { ctx: Ctx }) {
  const { data, save } = ctx;
  const [pages, setPages] = useState<Page[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<Page> | null>(null);
  const [busy, setBusy] = useState(false);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const lim = limits[ctx.plan.tier].livePages;

  async function load() {
    try {
      const r = await fetch('/api/pages');
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      setPages(b.pages);
      setSignups(b.signups);
      setState('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Offer pages are unavailable.');
      setState('error');
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function post(body: unknown) {
    setBusy(true);
    try {
      const r = await fetch('/api/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      return b;
    } catch (e) {
      ctx.notify(e instanceof Error ? e.message : 'Something went wrong.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function importSignups(page: Page) {
    const fresh = signups.filter((s) => s.page_id === page.id && !s.imported);
    if (!fresh.length) return;
    const known = new Set(data.contacts.map((c) => c.notes.match(/[^\s]+@[^\s]+/)?.[0]?.toLowerCase()).filter(Boolean));
    const tomorrow = new Date(Date.now() + 86400000);
    const adds = fresh
      .filter((s) => !known.has(s.email.toLowerCase()))
      .map((s) => ({
        id: uid(),
        name: s.name.slice(0, 120),
        channel: `Offer page /p/${page.slug}`,
        offerId: page.offer_ref,
        stage: 'replied' as const,
        notes: `${s.email}${s.answer ? '\n' + s.answer : ''}`.slice(0, 5000),
        nextStep: 'Thank them and invite them to a short call',
        nextDate: localDay(tomorrow),
        value: 0,
        created: now(),
        updated: now(),
      }));
    if (data.contacts.length + adds.length > 500) return ctx.notify('First customers holds up to 500 people. Archive some first.');
    if (adds.length && !(await save({ ...data, contacts: [...data.contacts, ...adds] }))) return;
    if (await post({ action: 'imported', ids: fresh.map((s) => s.id) })) {
      ctx.notify(`${adds.length} ${adds.length === 1 ? 'person' : 'people'} added to First customers.`);
      load();
    }
  }

  if (editing) return <Editor ctx={ctx} page={editing} busy={busy} close={() => setEditing(null)} saved={() => { setEditing(null); load(); }} post={post} />;

  const live = pages.filter((p) => p.published).length;
  return (
    <>
      <Heading
        eyebrow="TEST DEMAND BEFORE YOU BUILD"
        title="Offer pages"
        text="Publish a simple page for your offer, share the link, and see who raises their hand. Every sign-up can go straight into First customers."
        action={
          <button className="btn primary" onClick={() => setEditing({})}>
            <Plus size={16} /> New page
          </button>
        }
      />
      <p className="nb-count">
        {live} of {lim} live {lim === 1 ? 'page' : 'pages'} on your plan
        {ctx.plan.tier === 'free' && (
          <>
            {' · '}
            <button className="text-btn" onClick={() => ctx.go('upgrade')}>
              Run more tests with Pro
            </button>
          </>
        )}
      </p>
      {state === 'loading' && <p className="nm-hint">Loading…</p>}
      {state === 'error' && <p className="nm-hint">{error}</p>}
      {state === 'ready' && !pages.length && (
        <section className="card">
          <div className="empty">
            <Globe size={30} />
            <h3>No pages yet.</h3>
            <p>{data.offers.length ? 'Start from one of your offers in First customers.' : 'Write an offer, publish it, and send the link to ten people who have the problem.'}</p>
          </div>
        </section>
      )}
      <div className="nb-list">
        {pages.map((p) => {
          const mine = signups.filter((s) => s.page_id === p.id);
          const fresh = mine.filter((s) => !s.imported).length;
          const conv = p.views ? Math.round((mine.length / p.views) * 1000) / 10 : 0;
          const link = `${origin}/p/${p.slug}`;
          return (
            <section className="card nb-page" key={p.id}>
              <div className="card-heading">
                <div>
                  <span className={'badge ' + (p.blocked ? 'peach' : p.published ? 'sage' : 'neutral')}>{p.blocked ? 'PAUSED BY NEXTMADE' : p.published ? 'LIVE' : 'DRAFT'}</span>
                  <h3>{p.headline}</h3>
                  <small>/p/{p.slug} · created {timeAgo(p.created)}</small>
                </div>
                <div className="nm-actions">
                  {p.published && <CopyButton text={link} label="Copy link" />}
                  {p.published && (
                    <a className="btn small" href={link} target="_blank" rel="noreferrer">
                      <Eye size={13} /> View
                    </a>
                  )}
                  <button className="btn small" onClick={() => setEditing({ ...p })}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={'Delete ' + p.headline}
                    disabled={busy}
                    onClick={async () => {
                      if (confirm('Delete this page and its sign-ups?') && (await post({ action: 'delete', id: p.id }))) load();
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="nb-stats">
                <div>
                  <b>{p.views}</b>
                  <small>views</small>
                </div>
                <div>
                  <b>{mine.length}</b>
                  <small>sign-ups</small>
                </div>
                <div>
                  <b>{conv}%</b>
                  <small>conversion</small>
                </div>
              </div>
              {mine.length > 0 && (
                <details className="nb-signups">
                  <summary>
                    <Inbox size={13} /> Sign-ups{fresh ? ` · ${fresh} new` : ''}
                  </summary>
                  {mine.slice(0, 50).map((s) => (
                    <div className="nb-key" key={s.id}>
                      <div>
                        <strong>{s.name}</strong>
                        <small>
                          {s.email} · {timeAgo(s.created)}
                          {s.imported ? ' · in First customers' : ''}
                        </small>
                        {s.answer && <p>{s.answer}</p>}
                      </div>
                    </div>
                  ))}
                </details>
              )}
              {fresh > 0 && (
                <button className="btn primary" disabled={busy || ctx.saving} onClick={() => importSignups(p)}>
                  <UserPlus size={15} /> Add {fresh} to First customers
                </button>
              )}
            </section>
          );
        })}
      </div>
      <p className="nm-hint">Pages are public and not indexed by search engines. Don’t collect payment details or sensitive information, and only contact people about the offer they signed up for.</p>
    </>
  );
}

function Editor({ ctx, page, busy, close, saved, post }: { ctx: Ctx; page: Partial<Page>; busy: boolean; close: () => void; saved: () => void; post: (b: unknown) => Promise<any> }) {
  const [p, setP] = useState<Partial<Page>>({ cta: 'Join the waitlist', bullets: [], founder_name: ctx.firstName, ...page });
  const [slugTouched, setSlugTouched] = useState(!!page.id);
  const problem = p.slug ? slugProblem(p.slug) : '';
  const set = (k: keyof Page, v: unknown) => setP((x) => ({ ...x, [k]: v }));
  function fromOffer(id: string) {
    const o = ctx.data.offers.find((x) => x.id === id);
    if (!o) return set('offer_ref', '');
    setP((x) => ({
      ...x,
      offer_ref: o.id,
      headline: (o.promise || o.title).slice(0, 120),
      subhead: [o.audience && `For ${o.audience.replace(/^for\s+/i, '')}.`, o.problem].filter(Boolean).join(' ').slice(0, 400),
      price: o.price.replace(/\(.*hypothesis.*\)/i, '').trim().slice(0, 80),
      slug: slugTouched ? x.slug : slugify(o.title).slice(0, 40),
    }));
  }
  return (
    <>
      <button className="text-btn nm-back" onClick={close}>
        <ArrowLeft size={14} /> Offer pages
      </button>
      <div className="nb-editor">
        <form
          className="card"
          onSubmit={async (e) => {
            e.preventDefault();
            const publish = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'publish';
            const b = await post({
              action: 'save',
              page: {
                id: p.id,
                slug: p.slug || '',
                offer_ref: p.offer_ref || '',
                headline: p.headline || '',
                subhead: p.subhead || '',
                bullets: (p.bullets || []).filter((x) => x.trim()),
                price: p.price || '',
                cta: p.cta || 'Join the waitlist',
                question: p.question || '',
                founder_name: p.founder_name || '',
                published: publish,
              },
            });
            if (b) {
              ctx.notify(publish ? 'Your page is live. Share the link.' : 'Saved as a draft.');
              saved();
            }
          }}
        >
          <h3>{p.id ? 'Edit page' : 'New offer page'}</h3>
          {ctx.data.offers.length > 0 && (
            <Field label="Start from an offer">
              <select value={p.offer_ref || ''} onChange={(e) => fromOffer(e.target.value)}>
                <option value="">Not linked</option>
                {ctx.data.offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Headline" hint="The outcome, in your customer’s words.">
            <input required maxLength={120} value={p.headline || ''} onChange={(e) => set('headline', e.target.value)} placeholder="Get your restaurant’s books done in 2 hours a month" />
          </Field>
          <Field label="Who it’s for and the problem">
            <textarea rows={3} maxLength={400} value={p.subhead || ''} onChange={(e) => set('subhead', e.target.value)} />
          </Field>
          <Field label="What they get (one per line, up to 6)">
            <textarea rows={4} value={(p.bullets || []).join('\n')} onChange={(e) => set('bullets', e.target.value.split('\n').slice(0, 6).map((x) => x.slice(0, 200)))} />
          </Field>
          <div className="nm-two">
            <Field label="Price or offer (optional)">
              <input maxLength={80} value={p.price || ''} onChange={(e) => set('price', e.target.value)} placeholder="From $149/month, first month free" />
            </Field>
            <Field label="Button">
              <input required maxLength={40} value={p.cta || ''} onChange={(e) => set('cta', e.target.value)} />
            </Field>
          </div>
          <Field label="One question to ask (optional)" hint="e.g. What do you use today?">
            <input maxLength={200} value={p.question || ''} onChange={(e) => set('question', e.target.value)} />
          </Field>
          <div className="nm-two">
            <Field label="Shown as from">
              <input maxLength={80} value={p.founder_name || ''} onChange={(e) => set('founder_name', e.target.value)} />
            </Field>
            <Field label="Page address" hint={problem || `${typeof window === 'undefined' ? '' : window.location.origin}/p/${p.slug || 'your-offer'}`}>
              <input
                required
                maxLength={48}
                value={p.slug || ''}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }}
                onFocus={() => !p.slug && p.headline && set('slug', slugify(p.headline))}
              />
            </Field>
          </div>
          <div className="nm-actions">
            <button className="btn primary" name="intent" value="publish" disabled={busy || !!problem}>
              <Globe size={15} /> {p.published ? 'Save and keep live' : 'Publish'}
            </button>
            <button className="btn" name="intent" value="draft" disabled={busy || !!problem}>
              {p.published ? 'Unpublish (save as draft)' : 'Save draft'}
            </button>
          </div>
        </form>
        <div className="nb-preview">
          <small className="nb-label">PREVIEW</small>
          <div className="op-card mini">
            {p.founder_name && <p className="op-by">From {p.founder_name}</p>}
            <h1>{p.headline || 'Your headline'}</h1>
            {p.subhead && <p className="op-sub">{p.subhead}</p>}
            {(p.bullets || []).some((b) => b.trim()) && (
              <ul className="op-list">
                {(p.bullets || []).filter((b) => b.trim()).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {p.price && <p className="op-price">{p.price}</p>}
            <div className="op-form">
              <label>
                <span>Name</span>
                <input disabled />
              </label>
              <label>
                <span>Email</span>
                <input disabled />
              </label>
              {p.question && (
                <label>
                  <span>{p.question}</span>
                  <input disabled />
                </label>
              )}
              <button type="button" disabled>
                {p.cta || 'Join the waitlist'} <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
