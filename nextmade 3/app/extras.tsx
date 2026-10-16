'use client';
// Small extras: the feedback widget, the Build Gallery (shared showcase) and the builder toolkit.
import { useEffect, useState } from 'react';
import { ExternalLink, MessageSquareHeart, Plus, Trash2, X } from 'lucide-react';
import { toolkit } from './catalog';
import { Field, Heading, values, type Ctx } from './ui';

const kinds = [
  ['win', 'Share a win'],
  ['love', 'Something I love'],
  ['feature', 'Feature request'],
  ['problem', 'Problem'],
  ['reply', 'I’d like a reply'],
] as const;

export function FeedbackWidget({ page, notify }: { page: string; notify: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem('nm-hide-feedback') === '1');
    } catch {
      /* storage unavailable */
    }
  }, []);
  if (hidden) return null;
  return (
    <div className="nm-feedback">
      {open && (
        <form
          className="card nm-feedback-panel"
          onSubmit={async (e) => {
            const v = values(e);
            if (!kind) return notify('Choose what kind of feedback this is.');
            setBusy(true);
            try {
              const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, text: v.text, page }) });
              const b: any = await r.json();
              if (!r.ok) throw new Error(b.error);
              notify('Thank you. Your feedback was sent to the NextMade team.');
              setOpen(false);
              setKind('');
            } catch (err) {
              notify(err instanceof Error ? err.message : 'Could not send feedback.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="card-heading">
            <h3>Send us feedback</h3>
            <button type="button" className="icon-btn" aria-label="Close feedback" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <small>WHAT KIND OF FEEDBACK?</small>
          <div className="nm-chips">
            {kinds.map(([k, label]) => (
              <button type="button" key={k} className={'nm-chip ' + (kind === k ? 'on' : '')} onClick={() => setKind(k)}>
                {label}
              </button>
            ))}
          </div>
          <textarea name="text" required rows={4} maxLength={3000} placeholder="Tell us more…" />
          <div className="nm-actions">
            <button className="btn primary small" disabled={busy}>
              Send feedback
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                try {
                  localStorage.setItem('nm-hide-feedback', '1');
                } catch {
                  /* storage unavailable */
                }
                setHidden(true);
              }}
            >
              Hide on this device
            </button>
          </div>
        </form>
      )}
      <button className="nm-feedback-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <MessageSquareHeart size={16} /> Feedback
      </button>
    </div>
  );
}

type Item = { id: string; name: string; title: string; description: string; url: string; created: string; mine: boolean };

export function Gallery({ ctx }: { ctx: Ctx }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const r = await fetch('/api/gallery');
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      setItems(b.items);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the gallery.');
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function post(body: unknown) {
    setBusy(true);
    try {
      const r = await fetch('/api/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      await load();
      return true;
    } catch (e) {
      ctx.notify(e instanceof Error ? e.message : 'Could not update the gallery.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="WHAT MEMBERS ARE SHIPPING"
        title="Build gallery"
        text="Projects NextMade members have launched. Share yours when it’s live; only signed-in members can see the gallery."
        action={
          <button className="btn primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Share a project
          </button>
        }
      />
      {adding && (
        <section className="card">
          <form
            onSubmit={async (e) => {
              const v = values(e);
              if (await post({ action: 'add', name: v.name, title: v.title, description: v.description, url: v.url })) {
                setAdding(false);
                ctx.notify('Shared to the gallery.');
              }
            }}
          >
            <div className="form-row">
              <Field label="Project name">
                <input name="title" required maxLength={120} />
              </Field>
              <Field label="Shown as (your name)">
                <input name="name" required maxLength={80} defaultValue={ctx.firstName} />
              </Field>
            </div>
            <Field label="Link" hint="Must start with https://">
              <input name="url" required type="url" pattern="https://.*" maxLength={500} />
            </Field>
            <Field label="What it does">
              <textarea name="description" rows={3} maxLength={1000} />
            </Field>
            <div className="nm-actions">
              <button className="btn primary" disabled={busy}>
                Share
              </button>
              <button type="button" className="btn" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      {error && (
        <section className="card">
          <p>{error}</p>
        </section>
      )}
      <div className="nm-grid">
        {items?.map((it) => (
          <section key={it.id} className="card nm-idea">
            <small>{it.name}</small>
            <h3>{it.title}</h3>
            <p>{it.description}</p>
            <div className="nm-actions">
              <a className="btn small" href={it.url} target="_blank" rel="noreferrer noopener">
                Visit <ExternalLink size={12} />
              </a>
              {it.mine && (
                <button className="icon-btn" aria-label={'Remove ' + it.title} disabled={busy} onClick={() => confirm('Remove from the gallery?') && post({ action: 'remove', id: it.id })}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
      {items && !items.length && !error && (
        <section className="card">
          <div className="empty">
            <h3>No projects shared yet.</h3>
            <p>Be the first to show what you built.</p>
          </div>
        </section>
      )}
    </>
  );
}

export function Toolkit() {
  return (
    <>
      <Heading eyebrow="TOOLS WORTH KNOWING" title="Builder toolkit" text="Tools many first-time founders start with. Check each provider’s current pricing, free tiers and startup programmes on their site." />
      {toolkit.map((g) => (
        <div key={g.group} className="nm-group">
          <h4 className="nm-group-title">{g.group.toUpperCase()}</h4>
          <div className="nm-grid">
            {g.items.map((t) => (
              <a key={t.name} className="card nm-tool" href={t.url} target="_blank" rel="noreferrer noopener">
                <strong>{t.name}</strong>
                <p>{t.what}</p>
                <ExternalLink size={13} />
              </a>
            ))}
          </div>
        </div>
      ))}
      <p className="nm-hint">Links only. NextMade has no partnership with these providers.</p>
    </>
  );
}
