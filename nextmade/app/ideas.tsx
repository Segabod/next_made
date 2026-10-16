'use client';
// Ideas: today's matched ideas, the member's own ideas, and the validation report for each.
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Clock,
  Flame,
  Hammer,
  Lightbulb,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsUp,
  Trash2,
  Wand2,
} from 'lucide-react';
import { fitWorkspace, localDay, type FeedItem, type Idea } from './domain';
import { agents } from './catalog';
import { Field, Heading, Markdown, Sources, Tabs, now, parseJson, questForIdea, timeAgo, uid, values, type Ctx } from './ui';

type Report = {
  title?: string;
  oneLiner?: string;
  score?: number;
  model?: string;
  whoFor?: string;
  problem?: string;
  gap?: string;
  whyNow?: string;
  pain?: { quote: string; where: string }[];
  competitors?: { name: string; note: string; price?: string }[];
  reasonsBuild?: string[];
  reasonsNot?: string[];
  bestFounder?: string;
  demands?: Record<string, number>;
  reality?: { firstRevenue?: string; capital?: string; difficulty?: string };
  valueLadder?: { tier: string; name: string; price: string; desc: string }[];
  napkin?: { label: string; value: string; kind: string }[];
  ceiling?: string;
  biggestRisk?: string;
  plan?: string[];
};

function useCountdown() {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const m = new Date(n);
      m.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((m.getTime() - n.getTime()) / 1000));
      setLeft([Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, '0')).join(':'));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return left;
}

const statusLabel: Record<Idea['status'], string> = { saved: 'Saved', exploring: 'Validating', committed: 'Building', dropped: 'Dropped' };
const statusColor: Record<Idea['status'], string> = { saved: 'neutral', exploring: 'lavender', committed: 'sage', dropped: 'neutral' };

function Meter({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(10, Number(value) || 0));
  return (
    <div className="nm-meter">
      <span>{label}</span>
      <div>
        <i style={{ width: v * 10 + '%' }} />
      </div>
      <b>{v}</b>
    </div>
  );
}

export function IdeaReport({ ctx, idea, back }: { ctx: Ctx; idea: Idea; back: () => void }) {
  const { data, save, saving, thinking } = ctx;
  const busy = saving || thinking;
  const r = idea.report ? parseJson<Report>(idea.report) : null;
  async function validate() {
    const res = await ctx.call({ mode: 'report', ideaId: idea.id, text: '' });
    if (!res) return;
    const parsed = parseJson<Report>(res.text);
    const next = {
      ...idea,
      report: (parsed ? JSON.stringify(parsed) : res.text).slice(0, 20000),
      sources: res.sources.slice(0, 30),
      title: parsed?.title?.slice(0, 500) || idea.title,
      oneLiner: (parsed?.oneLiner || idea.oneLiner).slice(0, 2000),
      status: idea.status === 'saved' ? ('exploring' as const) : idea.status,
      updated: now(),
    };
    if (await save(fitWorkspace({ ...data, ideas: data.ideas.map((i) => (i.id === idea.id ? next : i)) })))
      ctx.notify(res.researched ? 'Report ready, with live sources.' : 'Report ready. Live search is off, so check market facts yourself.');
  }
  async function build() {
    if (idea.goalId && data.goals.some((g) => g.id === idea.goalId)) {
      ctx.go('project', { goalId: idea.goalId });
      return;
    }
    const steps = r?.plan?.length ? r.plan : ['Write down who this is for and the problem in their words', 'Talk to three potential customers', 'Run the 7-day build plan agent'];
    const { next, goalId } = questForIdea(data, idea, steps);
    if (await save(next)) {
      ctx.notify('Project created with your first commitments.');
      ctx.go('project', { goalId });
    }
  }
  const rate = (rating: Idea['rating']) => save({ ...data, ideas: data.ideas.map((i) => (i.id === idea.id ? { ...i, rating, updated: now() } : i)) });
  return (
    <>
      <button className="text-btn nm-back" onClick={back}>
        <ArrowLeft size={14} /> All ideas
      </button>
      <section className="card nm-report-hero">
        <div className="nm-report-tags">
          <span className={'badge ' + statusColor[idea.status]}>{statusLabel[idea.status].toUpperCase()}</span>
          {r?.model && <span className="badge peach">{r.model}</span>}
          {typeof r?.score === 'number' && <span className="badge sage">NOVA SCORE {r.score}/10</span>}
        </div>
        <h2>{idea.title}</h2>
        <p>{idea.oneLiner}</p>
        <div className="nm-actions">
          <button className="btn primary" disabled={busy || !ctx.aiReady} onClick={validate}>
            {idea.report ? <RefreshCw size={15} /> : <Search size={15} />}
            {thinking ? 'Researching…' : idea.report ? 'Refresh report' : 'Validate this idea'}
          </button>
          <button className="btn" disabled={busy} onClick={build}>
            <Hammer size={15} /> {idea.goalId ? 'Open project' : 'Build this idea'}
          </button>
          <button className="btn" onClick={() => ctx.go('agents', { ideaId: idea.id })}>
            <Wand2 size={15} /> Run an agent on it
          </button>
        </div>
        {thinking && <p className="nm-hint">Nova is researching. This can take up to a minute.</p>}
      </section>

      {!idea.report && (
        <section className="card">
          <p>
            No report yet. Validating builds a full brief: who it is for, the gap, why now, real pain quotes, competitors, reasons to build and not
            to build, founder fit, a value ladder and napkin math.
          </p>
        </section>
      )}

      {idea.report && !r && (
        <section className="card">
          <Markdown text={idea.report} />
        </section>
      )}

      {r && (
        <div className="nm-report">
          <section className="card">
            <h3>The pitch</h3>
            <dl className="nm-dl">
              {r.whoFor && (
                <>
                  <dt>Who it’s for</dt>
                  <dd>{r.whoFor}</dd>
                </>
              )}
              {r.problem && (
                <>
                  <dt>The problem</dt>
                  <dd>{r.problem}</dd>
                </>
              )}
              {r.gap && (
                <>
                  <dt>The gap</dt>
                  <dd>{r.gap}</dd>
                </>
              )}
              {r.whyNow && (
                <>
                  <dt>Why now</dt>
                  <dd>{r.whyNow}</dd>
                </>
              )}
              {r.biggestRisk && (
                <>
                  <dt>Biggest risk</dt>
                  <dd>{r.biggestRisk}</dd>
                </>
              )}
            </dl>
          </section>
          <div className="nm-two">
            <section className="card">
              <h3>What it demands</h3>
              {r.demands &&
                (['distribution', 'domain', 'sales', 'content', 'capital'] as const).map((k) => (
                  <Meter key={k} label={k === 'domain' ? 'Domain depth' : k[0].toUpperCase() + k.slice(1)} value={r.demands?.[k] ?? 0} />
                ))}
              {r.reality && (
                <div className="nm-reality">
                  <div>
                    <small>FIRST REVENUE</small>
                    <strong>{r.reality.firstRevenue || '?'}</strong>
                  </div>
                  <div>
                    <small>CAPITAL IN</small>
                    <strong>{r.reality.capital || '?'}</strong>
                  </div>
                  <div>
                    <small>DIFFICULTY</small>
                    <strong>{r.reality.difficulty || '?'}</strong>
                  </div>
                </div>
              )}
            </section>
            <section className="card">
              <h3>The receipts</h3>
              {r.pain?.length ? (
                r.pain.map((p, i) => (
                  <blockquote key={i} className="nm-quote">
                    “{p.quote}”<small>{p.where}</small>
                  </blockquote>
                ))
              ) : (
                <p>No verified quotes found. Talk to customers and log what they say in First customers.</p>
              )}
            </section>
          </div>
          {!!r.competitors?.length && (
            <section className="card">
              <h3>Who you’re up against ({r.competitors.length})</h3>
              <div className="nm-comp">
                {r.competitors.map((c) => (
                  <div key={c.name}>
                    <strong>{c.name}</strong>
                    {c.price && <span className="badge neutral">{c.price}</span>}
                    <p>{c.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className="nm-two">
            <section className="card nm-verdict good">
              <h3>Reasons to build</h3>
              <ul>{(r.reasonsBuild || []).map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
            <section className="card nm-verdict bad">
              <h3>Reasons not to</h3>
              <ul>{(r.reasonsNot || []).map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          </div>
          {r.bestFounder && (
            <section className="card">
              <h3>Founder fit</h3>
              <p>{r.bestFounder}</p>
              <button className="text-btn" onClick={() => ctx.go('agents', { ideaId: idea.id, agent: 'founder-fit' })}>
                Check the fit against your profile <ArrowRight size={13} />
              </button>
            </section>
          )}
          {!!r.valueLadder?.length && (
            <section className="card">
              <h3>The value ladder</h3>
              <div className="nm-ladder">
                {r.valueLadder.map((v, i) => (
                  <div key={i}>
                    <small>
                      {i + 1} · {String(v.tier).toUpperCase()}
                    </small>
                    <strong>{v.name}</strong>
                    <span className="badge peach">{v.price}</span>
                    <p>{v.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {!!r.napkin?.length && (
            <section className="card">
              <h3>Year one, on a napkin</h3>
              <table className="nm-table">
                <tbody>
                  {r.napkin.map((n, i) => (
                    <tr key={i}>
                      <td>
                        {n.label} <small>({n.kind})</small>
                      </td>
                      <td>
                        <strong>{n.value}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.ceiling && <p className="nm-hint">Ceiling if it compounds: {r.ceiling}. Estimates are illustrative, not investment advice.</p>}
            </section>
          )}
          {!!r.plan?.length && (
            <section className="card">
              <h3>If you started today</h3>
              <ol>{r.plan.map((p) => <li key={p}>{p}</li>)}</ol>
            </section>
          )}
          <section className="card">
            <h3>Go deeper</h3>
            <div className="nm-chips">
              {['stress-test', 'competitors', 'money-model', 'build-plan', 'first-prospects'].map((id) => {
                const a = agents.find((x) => x.id === id)!;
                return (
                  <button key={id} className="nm-chip" onClick={() => ctx.go('agents', { ideaId: idea.id, agent: id })}>
                    {a.title} <ArrowRight size={12} />
                  </button>
                );
              })}
            </div>
          </section>
          <Sources sources={idea.sources} />
        </div>
      )}
      <section className="card nm-rate">
        <span>What do you think of this idea?</span>
        {(
          [
            ['love', 'Love it'],
            ['interesting', 'Interesting'],
            ['meh', 'Not for me'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={'nm-chip ' + (idea.rating === k ? 'on' : '')} disabled={saving} onClick={() => rate(idea.rating === k ? '' : k)}>
            {label}
          </button>
        ))}
      </section>
    </>
  );
}

export default function Ideas({ ctx }: { ctx: Ctx }) {
  const { data, save, saving, thinking } = ctx;
  const busy = saving || thinking;
  const [tab, setTab] = useState<'today' | 'mine'>(ctx.focus.tab === 'mine' ? 'mine' : 'today');
  const [openId, setOpenId] = useState(ctx.focus.ideaId || '');
  const [adding, setAdding] = useState(false);
  const left = useCountdown();
  const today = localDay();
  const feedFresh = data.feed.day === today;
  const open = data.ideas.find((i) => i.id === openId);
  if (open) return <IdeaReport ctx={ctx} idea={open} back={() => setOpenId('')} />;

  async function refreshFeed() {
    const r = await ctx.call({ mode: 'feed', text: '' });
    if (!r) return;
    const arr = parseJson<FeedItem[]>(r.text, 'array');
    if (!arr?.length) {
      ctx.notify('Nova’s ideas came back in an unexpected format. Please try again.');
      return;
    }
    const items = arr
      .filter((x) => x && x.title)
      .slice(0, 12)
      .map((x) => ({
        title: String(x.title).slice(0, 500),
        oneLiner: String(x.oneLiner || '').slice(0, 2000),
        model: String(x.model || '').slice(0, 120),
        whyYou: String(x.whyYou || '').slice(0, 1000),
        firstStep: String(x.firstStep || '').slice(0, 1000),
        score: Math.max(0, Math.min(10, Number(x.score) || 0)),
      }));
    if (await save({ ...data, feed: { day: today, items } })) ctx.notify('Fresh ideas, matched to your profile.');
  }
  async function keep(item: FeedItem, thenOpen = false) {
    const existing = data.ideas.find((i) => i.title === item.title);
    if (existing) {
      if (thenOpen) setOpenId(existing.id);
      return;
    }
    const idea: Idea = {
      id: uid(),
      title: item.title,
      oneLiner: item.oneLiner,
      origin: 'feed',
      status: 'saved',
      rating: '',
      report: '',
      sources: [],
      goalId: '',
      created: now(),
      updated: now(),
    };
    if (await save({ ...data, ideas: [idea, ...data.ideas].slice(0, 150) })) {
      ctx.notify('Idea saved to My ideas.');
      if (thenOpen) setOpenId(idea.id);
    }
  }
  const daily = data.feed.items[0];
  const profileThin = !data.founder.skills && !data.founder.edge && !data.founder.problem;

  return (
    <>
      <Heading
        eyebrow="FIND AN IDEA WORTH BUILDING"
        title="Ideas"
        text="Ideas matched to you, and a full validation report for any idea you want to pressure-test."
        action={
          <button className="btn primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> I have an idea
          </button>
        }
      />
      {adding && (
        <section className="card">
          <form
            onSubmit={async (e) => {
              const v = values(e);
              const idea: Idea = {
                id: uid(),
                title: v.title.trim(),
                oneLiner: v.oneLiner.trim(),
                origin: 'mine',
                status: 'saved',
                rating: '',
                report: '',
                sources: [],
                goalId: '',
                created: now(),
                updated: now(),
              };
              if (await save({ ...data, ideas: [idea, ...data.ideas].slice(0, 150) })) {
                setAdding(false);
                setOpenId(idea.id);
              }
            }}
          >
            <Field label="Working title">
              <input name="title" required maxLength={200} placeholder="e.g. Bookkeeping for newcomer-owned restaurants" />
            </Field>
            <Field label="Describe it in a few sentences" hint="Who it helps, the problem, and how you would solve it.">
              <textarea name="oneLiner" required rows={4} maxLength={2000} />
            </Field>
            <div className="nm-actions">
              <button className="btn primary" disabled={saving}>
                Save and open <ArrowRight size={15} />
              </button>
              <button type="button" className="btn" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'today', label: 'For you today' },
            { id: 'mine', label: 'My ideas', count: data.ideas.length },
          ]}
        />
      </div>

      {tab === 'today' && (
        <>
          {profileThin && (
            <button className="card fc-banner" onClick={() => ctx.go('about')}>
              <Sparkles size={18} />
              <span>Complete your founder profile so ideas match your skills, time and budget.</span>
              <ArrowRight size={16} />
            </button>
          )}
          <section className="card nm-daily">
            <div className="card-heading">
              <div>
                <small>TODAY’S IDEA · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</small>
              </div>
              <span className="nm-countdown">
                <Clock size={13} /> Next ideas in {left}
              </span>
            </div>
            {daily && feedFresh ? (
              <>
                <h2>{daily.title}</h2>
                <p>{daily.oneLiner}</p>
                <div className="nm-report-tags">
                  {daily.model && <span className="badge peach">{daily.model}</span>}
                  <span className="badge sage">FIT {daily.score}/10</span>
                </div>
                {daily.whyYou && (
                  <p className="nm-hint">
                    <b>Why you:</b> {daily.whyYou}
                  </p>
                )}
                <div className="nm-actions">
                  <button className="btn primary" disabled={busy} onClick={() => keep(daily, true)}>
                    View full report <ArrowRight size={15} />
                  </button>
                  <button className="btn" disabled={busy} onClick={() => keep(daily)}>
                    <Bookmark size={15} /> Save
                  </button>
                </div>
              </>
            ) : (
              <div className="nm-empty-row">
                <Lightbulb size={26} />
                <div>
                  <h3>{data.feed.items.length ? 'New day, new ideas.' : 'Get ideas matched to you.'}</h3>
                  <p>Nova suggests six ideas based on your profile. These are starting points to validate, not researched facts.</p>
                </div>
                <button className="btn primary" disabled={busy || !ctx.aiReady} onClick={refreshFeed}>
                  <Sparkles size={15} /> {thinking ? 'Thinking…' : 'Find today’s ideas'}
                </button>
              </div>
            )}
          </section>
          {feedFresh && (
            <div className="nm-grid">
              {data.feed.items.slice(1).map((it) => {
                const saved = data.ideas.some((i) => i.title === it.title);
                return (
                  <section className="card nm-idea" key={it.title}>
                    <div className="nm-report-tags">
                      {it.model && <span className="badge peach">{it.model}</span>}
                      <span className="badge sage">FIT {it.score}/10</span>
                    </div>
                    <h3>{it.title}</h3>
                    <p>{it.oneLiner}</p>
                    {it.firstStep && (
                      <small>
                        <Flame size={11} /> First step: {it.firstStep}
                      </small>
                    )}
                    <div className="nm-actions">
                      <button className="btn small" disabled={busy} onClick={() => keep(it, true)}>
                        Open <ArrowRight size={13} />
                      </button>
                      <button className="btn small" disabled={busy || saved} onClick={() => keep(it)}>
                        <Bookmark size={13} /> {saved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
          {feedFresh && (
            <button className="text-btn" disabled={busy} onClick={refreshFeed}>
              Suggest a different set <RefreshCw size={13} />
            </button>
          )}
        </>
      )}

      {tab === 'mine' && (
        <div className="nm-list">
          {data.ideas.map((i) => (
            <section className="card nm-row" key={i.id}>
              <button className="nm-row-main" onClick={() => setOpenId(i.id)}>
                <span className={'badge ' + statusColor[i.status]}>{statusLabel[i.status].toUpperCase()}</span>
                <strong>{i.title}</strong>
                <small>
                  {i.origin === 'mine' ? 'Your idea' : 'From Nova'} · {i.report ? 'Report ready' : 'Not validated'} · {timeAgo(i.updated || i.created)}
                  {i.rating === 'love' && (
                    <>
                      {' '}
                      · <ThumbsUp size={10} />
                    </>
                  )}
                </small>
              </button>
              <select
                aria-label="Idea status"
                value={i.status}
                disabled={saving}
                onChange={(e) => save({ ...data, ideas: data.ideas.map((x) => (x.id === i.id ? { ...x, status: e.target.value as Idea['status'], updated: now() } : x)) })}
              >
                {Object.entries(statusLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button
                className="icon-btn"
                aria-label={'Delete ' + i.title}
                disabled={saving}
                onClick={() => {
                  if (confirm('Delete this idea and its report?')) save({ ...data, ideas: data.ideas.filter((x) => x.id !== i.id) });
                }}
              >
                <Trash2 size={15} />
              </button>
            </section>
          ))}
          {!data.ideas.length && (
            <section className="card">
              <div className="empty">
                <Lightbulb size={30} />
                <h3>No saved ideas yet.</h3>
                <p>Save one from today’s ideas, or add your own.</p>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
