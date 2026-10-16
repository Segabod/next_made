'use client';
// Office hours: book time with vetted mentors, or apply to mentor and manage requests.
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck, ExternalLink, GraduationCap, Inbox, Send, X } from 'lucide-react';
import { limits } from './plans';
import { Field, Heading, Tabs, timeAgo, values, type Ctx } from './ui';

type Mentor = { user_id: string; name: string; headline: string; bio: string; expertise: string[]; rate: string; booking_url: string; approved: boolean; active: boolean; mine?: boolean };
type Req = { id: string; mentor_id: string; mentor?: string; requester_name: string; topic: string; message: string; status: 'new' | 'accepted' | 'declined' | 'done'; reply: string; created: string };

const statusLabel = { new: 'Waiting', accepted: 'Accepted', declined: 'Declined', done: 'Done' };
const statusColor = { new: 'neutral', accepted: 'sage', declined: 'peach', done: 'lavender' };

export default function Mentors({ ctx }: { ctx: Ctx }) {
  const [tab, setTab] = useState<'find' | 'sent' | 'mentor'>('find');
  const [d, setD] = useState<{ me: Mentor | null; mentors: Mentor[]; sent: Req[]; received: Req[] } | null>(null);
  const [error, setError] = useState('');
  const [asking, setAsking] = useState<Mentor | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch('/api/mentors');
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      setD(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Office hours are unavailable.');
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function post(body: unknown, ok: string) {
    setBusy(true);
    try {
      const r = await fetch('/api/mentors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      ctx.notify(ok);
      await load();
      return true;
    } catch (e) {
      ctx.notify(e instanceof Error ? e.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  const shown = (d?.mentors || []).filter((m) => !q || `${m.name} ${m.headline} ${m.expertise.join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  const pending = (d?.received || []).filter((r) => r.status === 'new').length;
  const used = (d?.sent || []).filter((r) => Date.now() - Date.parse(r.created) < 30 * 86400000).length;
  const lim = limits[ctx.plan.tier].mentorRequests;

  return (
    <>
      <Heading eyebrow="TALK TO SOMEONE WHO HAS DONE IT" title="Office hours" text="Book time with vetted founders and operators. Ask for a focused session, then bring the advice back to your project." />
      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'find', label: 'Find a mentor', count: d?.mentors.length },
            { id: 'sent', label: 'My requests', count: d?.sent.length },
            { id: 'mentor', label: d?.me?.approved ? 'Mentor inbox' : 'Become a mentor', count: pending },
          ]}
        />
        {tab === 'find' && <input aria-label="Search mentors" placeholder="Search skills, e.g. pricing" value={q} onChange={(e) => setQ(e.target.value)} />}
      </div>
      {error && <p className="nm-hint">{error}</p>}

      {asking && (
        <section className="card">
          <form
            onSubmit={async (e) => {
              const v = values(e);
              if (await post({ action: 'request', mentor: asking.user_id, topic: v.topic, message: v.message }, 'Request sent. You’ll see the reply under My requests.')) {
                setAsking(null);
                setTab('sent');
              }
            }}
          >
            <div className="card-heading">
              <h3>Ask {asking.name} for a session</h3>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setAsking(null)}>
                <X size={16} />
              </button>
            </div>
            <Field label="What do you want help with?">
              <input name="topic" required maxLength={140} placeholder="e.g. Pricing my first B2B offer" />
            </Field>
            <Field label="Context" hint="Where you are, what you tried, and what a great session would give you.">
              <textarea name="message" rows={4} maxLength={2000} />
            </Field>
            <div className="nm-actions">
              <button className="btn primary" disabled={busy || used >= lim}>
                <Send size={15} /> Send request
              </button>
              <small className="nb-quota">
                {Math.max(0, lim - used)} of {lim} requests left this month
                {ctx.plan.tier === 'free' && (
                  <>
                    {' · '}
                    <button type="button" className="text-btn" onClick={() => ctx.go('upgrade')}>
                      More with Pro
                    </button>
                  </>
                )}
              </small>
            </div>
          </form>
        </section>
      )}

      {tab === 'find' && d && (
        <>
          <div className="nm-grid">
            {shown.map((m) => (
              <section className="card nb-mentor" key={m.user_id}>
                <span className="avatar">{m.name.slice(0, 1).toUpperCase()}</span>
                <strong>{m.name}</strong>
                <small>{m.headline}</small>
                {m.bio && <p>{m.bio.length > 260 ? m.bio.slice(0, 260) + '…' : m.bio}</p>}
                <div className="nm-chips">
                  {m.expertise.map((x) => (
                    <span key={x} className="nm-chip">
                      {x}
                    </span>
                  ))}
                </div>
                {m.rate && <p className="nb-amount">{m.rate}</p>}
                <div className="nm-actions">
                  {!m.mine && (
                    <button className="btn primary small" onClick={() => setAsking(m)}>
                      Request a session <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </section>
            ))}
          </div>
          {!shown.length && (
            <section className="card">
              <div className="empty">
                <GraduationCap size={30} />
                <h3>{d.mentors.length ? 'No mentors match that search.' : 'Mentors are being vetted.'}</h3>
                <p>{d.mentors.length ? 'Try a broader skill.' : 'The first approved mentors will appear here. Know someone great? Ask them to apply under Become a mentor.'}</p>
              </div>
            </section>
          )}
          <p className="nm-hint">Mentors set their own rates and are paid directly for now. NextMade vets profiles but does not guarantee advice; keep payment details and sensitive data out of messages.</p>
        </>
      )}

      {tab === 'sent' && d && (
        <div className="nb-list">
          {d.sent.map((r) => (
            <section className="card" key={r.id}>
              <div className="card-heading">
                <div>
                  <span className={'badge ' + statusColor[r.status]}>{statusLabel[r.status].toUpperCase()}</span>
                  <h3>{r.topic}</h3>
                  <small>
                    To {r.mentor} · {timeAgo(r.created)}
                  </small>
                </div>
              </div>
              {r.reply && (
                <p className="nb-reply">
                  <b>{r.mentor}:</b> {r.reply}
                </p>
              )}
              {r.status === 'accepted' && (() => {
                const m = d.mentors.find((x) => x.user_id === r.mentor_id);
                return m?.booking_url ? (
                  <a className="btn primary small" href={m.booking_url} target="_blank" rel="noreferrer noopener">
                    <CalendarCheck size={13} /> Book a time <ExternalLink size={12} />
                  </a>
                ) : null;
              })()}
            </section>
          ))}
          {!d.sent.length && <p className="nm-hint">No requests yet.</p>}
        </div>
      )}

      {tab === 'mentor' && d && (
        <>
          {d.me && !d.me.approved && <p className="nb-count">Thanks for applying. The NextMade team reviews new mentors and will switch your profile on once approved.</p>}
          {d.me?.approved && (
            <section className="card">
              <h3>
                <Inbox size={15} /> Requests for you
              </h3>
              {d.received.map((r) => (
                <form
                  className="nb-request"
                  key={r.id}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const status = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') || 'accepted';
                    await post({ action: 'answer', id: r.id, status, reply: String(f.get('reply') || '') }, 'Reply sent.');
                  }}
                >
                  <div>
                    <span className={'badge ' + statusColor[r.status]}>{statusLabel[r.status].toUpperCase()}</span>
                    <strong>{r.topic}</strong>
                    <small>
                      From {r.requester_name} · {timeAgo(r.created)}
                    </small>
                    {r.message && <p>{r.message}</p>}
                  </div>
                  <textarea name="reply" rows={2} maxLength={2000} defaultValue={r.reply} placeholder="Reply, e.g. Happy to help. Book any slot on my calendar." />
                  <div className="nm-actions">
                    <button className="btn primary small" value="accepted" disabled={busy}>
                      Accept
                    </button>
                    <button className="btn small" value="declined" disabled={busy}>
                      Decline
                    </button>
                    <button className="btn small" value="done" disabled={busy}>
                      Mark done
                    </button>
                  </div>
                </form>
              ))}
              {!d.received.length && <p className="nm-hint">No requests yet.</p>}
            </section>
          )}
          <section className="card">
            <form
              onSubmit={async (e) => {
                const v = values(e);
                await post(
                  {
                    action: 'profile',
                    name: v.name,
                    headline: v.headline,
                    bio: v.bio,
                    expertise: v.expertise.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 8),
                    rate: v.rate,
                    booking_url: v.booking_url.trim(),
                    active: v.active === 'on',
                  },
                  d.me ? 'Profile saved.' : 'Application sent for review.',
                );
              }}
            >
              <h3>{d.me ? 'Your mentor profile' : 'Apply to mentor'}</h3>
              <div className="nm-two">
                <Field label="Name">
                  <input name="name" required maxLength={80} defaultValue={d.me?.name || ctx.firstName} />
                </Field>
                <Field label="Headline">
                  <input name="headline" required maxLength={140} defaultValue={d.me?.headline} placeholder="Ex-CTO; helped 3 startups ship their first product" />
                </Field>
              </div>
              <Field label="About you">
                <textarea name="bio" rows={4} maxLength={2000} defaultValue={d.me?.bio} />
              </Field>
              <Field label="Expertise (comma separated, up to 8)">
                <input name="expertise" maxLength={400} defaultValue={d.me?.expertise.join(', ')} placeholder="Pricing, B2B sales, fintech, product" />
              </Field>
              <div className="nm-two">
                <Field label="Rate (optional)" hint="e.g. Free 20-minute intro, then $120 per hour">
                  <input name="rate" maxLength={80} defaultValue={d.me?.rate} />
                </Field>
                <Field label="Booking link (optional)" hint="Calendly, Cal.com or similar. Shown after you accept.">
                  <input name="booking_url" maxLength={300} defaultValue={d.me?.booking_url} placeholder="https://" />
                </Field>
              </div>
              <label className="nb-check">
                <input type="checkbox" name="active" defaultChecked={d.me ? d.me.active : true} /> Accepting new requests
              </label>
              <button className="btn primary" disabled={busy}>
                {d.me ? 'Save profile' : 'Apply'}
              </button>
            </form>
          </section>
        </>
      )}
    </>
  );
}
