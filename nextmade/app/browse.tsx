'use client';
// Browse: a shared catalog of researched ideas, rising trends and reachable niches, with filters and "For you" matching.
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Clock,
  Hammer,
  Lightbulb,
  Lock,
  MapPin,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { applyFilters, facets, matchScore, noFilters, scoreLabels, sortItems, untilNextDrop, type CatalogItem, type Filters, type Sort } from './browse-logic';
import { fitWorkspace, type Idea } from './domain';
import { limits } from './plans';
import { Field, Heading, Sources, Tabs, now, questForIdea, timeAgo, uid, type Ctx } from './ui';

type Tab = 'idea' | 'trend' | 'niche' | 'foryou' | 'saved';
type Full = CatalogItem & { body: any; sources: { title: string; url: string }[]; locked: boolean };

const kindIcon = { idea: Lightbulb, trend: TrendingUp, niche: Users } as const;
const kindLabel = { idea: 'Idea', trend: 'Trend', niche: 'Niche' } as const;
const n = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

function Score({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(10, value));
  const tone = v >= 8 ? 'hi' : v >= 6 ? 'mid' : 'lo';
  return (
    <span className={'nb-score ' + tone} title={`${label}: ${v}/10`}>
      <small>{label}</small>
      <b>{v}</b>
    </span>
  );
}

function scoreKeys(kind: CatalogItem['kind']) {
  return kind === 'idea' ? ['opportunity', 'pain', 'timing'] : kind === 'trend' ? ['momentum', 'opportunity'] : ['pain', 'opportunity', 'revenue'];
}

function useTicker() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => setT(untilNextDrop());
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

export default function Browse({ ctx }: { ctx: Ctx }) {
  const { data, save, saving } = ctx;
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>((ctx.focus.tab as Tab) || 'idea');
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<Sort>('newest');
  const [openId, setOpenId] = useState(ctx.focus.ideaId || '');
  const [researching, setResearching] = useState(false);
  const left = useTicker();

  async function load() {
    try {
      const r = await fetch('/api/catalog');
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      setItems(b.items);
      setState('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Browse is unavailable.');
      setState('error');
    }
  }
  useEffect(() => {
    load();
  }, []);

  const bookmarks = new Set(data.bookmarks);
  async function toggleBookmark(id: string) {
    const next = bookmarks.has(id) ? data.bookmarks.filter((x) => x !== id) : [id, ...data.bookmarks].slice(0, 300);
    if (await save({ ...data, bookmarks: next })) ctx.notify(bookmarks.has(id) ? 'Removed from saved.' : 'Saved to your Browse list.');
  }

  const list = useMemo(() => {
    if (tab === 'foryou') {
      return items
        .map((i) => ({ i, m: matchScore(i, data.founder) }))
        .filter((x) => x.m.matched.length || x.m.score > 4)
        .sort((a, b) => b.m.score - a.m.score)
        .slice(0, 40)
        .map((x) => ({ ...x.i, _match: x.m.matched }));
    }
    const base = tab === 'saved' ? items.filter((i) => bookmarks.has(i.id)) : items.filter((i) => i.kind === tab);
    return sortItems(applyFilters(base, filters), sort).map((i) => ({ ...i, _match: [] as string[] }));
  }, [items, tab, filters, sort, data.founder, data.bookmarks]);

  const today = items.find((i) => i.kind === 'idea' && !i.community);
  const active = filters.markets.length + filters.categories.length + filters.high.length + (filters.difficulty ? 1 : 0) + (filters.canada ? 1 : 0) + (filters.source !== 'all' ? 1 : 0);
  const profileThin = !data.founder.skills && !data.founder.audience && !data.founder.market;

  if (openId) return <Detail ctx={ctx} id={openId} back={() => setOpenId('')} bookmarked={bookmarks.has(openId)} toggle={() => toggleBookmark(openId)} onDeleted={load} />;

  const toggleIn = (key: 'markets' | 'categories' | 'high', v: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));
  const scope = tab === 'idea' || tab === 'trend' || tab === 'niche' ? items.filter((i) => i.kind === tab) : items;

  return (
    <>
      <Heading
        eyebrow="RESEARCHED, NOT GUESSED"
        title="Browse"
        text="Researched ideas, rising trends and niches with proven demand. New entries land every day."
        action={
          <button className="btn primary" onClick={() => setResearching(true)}>
            <Sparkles size={16} /> Research your own
          </button>
        }
      />
      {researching && (
        <ResearchForm
          ctx={ctx}
          close={() => setResearching(false)}
          done={async (id) => {
            setResearching(false);
            await load();
            setOpenId(id);
          }}
        />
      )}

      {today && tab === 'idea' && !filters.q && (
        <section className="card nb-today">
          <div className="card-heading">
            <small>TODAY’S IDEA · {new Date(today.created).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</small>
            <span className="nm-countdown">
              <Clock size={13} /> Next drop in {left}
            </span>
          </div>
          <h2>{today.title}</h2>
          <p>{today.summary}</p>
          <div className="nb-meta">
            {today.market && <span className="badge peach">{today.market}</span>}
            {today.category && <span className="badge lavender">{today.category}</span>}
            {scoreKeys('idea').map((k) => (
              <Score key={k} label={scoreLabels[k]} value={n(today.scores[k])} />
            ))}
          </div>
          <div className="nm-actions">
            <button className="btn primary" onClick={() => setOpenId(today.id)}>
              View the research <ArrowRight size={15} />
            </button>
            <button className="btn" disabled={saving} onClick={() => toggleBookmark(today.id)}>
              {bookmarks.has(today.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {bookmarks.has(today.id) ? 'Saved' : 'Save'}
            </button>
          </div>
        </section>
      )}

      <div className="toolbar nb-toolbar">
        <Tabs
          value={tab}
          onChange={(t) => {
            setTab(t);
            setSort('newest');
          }}
          items={[
            { id: 'idea', label: 'Ideas', count: items.filter((i) => i.kind === 'idea').length },
            { id: 'trend', label: 'Trends', count: items.filter((i) => i.kind === 'trend').length },
            { id: 'niche', label: 'Niches', count: items.filter((i) => i.kind === 'niche').length },
            { id: 'foryou', label: 'For you' },
            { id: 'saved', label: 'Saved', count: data.bookmarks.filter((b) => items.some((i) => i.id === b)).length },
          ]}
        />
        {tab !== 'foryou' && (
          <div className="nb-tools">
            <label className="nb-search">
              <Search size={14} />
              <input aria-label="Search the catalog" placeholder="Search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </label>
            <button className={'btn small ' + (showFilters || active ? 'nb-on' : '')} onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={14} /> Filters{active ? ` · ${active}` : ''}
            </button>
            <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="newest">Newest</option>
              <option value="opportunity">Opportunity</option>
              <option value="pain">Pain</option>
              {tab !== 'niche' && <option value="timing">Timing</option>}
            </select>
          </div>
        )}
      </div>

      {showFilters && tab !== 'foryou' && (
        <section className="card nb-filters">
          {tab !== 'niche' && (
            <div>
              <small>MARKET</small>
              <div className="nm-chips">
                {facets(scope, 'market').map(([m, c]) => (
                  <button key={m} className={'nm-chip ' + (filters.markets.includes(m) ? 'on' : '')} onClick={() => toggleIn('markets', m)}>
                    {m} <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <small>TYPE</small>
            <div className="nm-chips">
              {facets(scope, 'category')
                .slice(0, 12)
                .map(([m, c]) => (
                  <button key={m} className={'nm-chip ' + (filters.categories.includes(m) ? 'on' : '')} onClick={() => toggleIn('categories', m)}>
                    {m} <span>{c}</span>
                  </button>
                ))}
            </div>
          </div>
          <div>
            <small>SCORES (8 OR MORE)</small>
            <div className="nm-chips">
              {(tab === 'trend' ? ['momentum', 'opportunity'] : tab === 'niche' ? ['pain', 'opportunity', 'revenue'] : ['opportunity', 'pain', 'timing', 'feasibility']).map((k) => (
                <button key={k} className={'nm-chip ' + (filters.high.includes(k) ? 'on' : '')} onClick={() => toggleIn('high', k)}>
                  High {scoreLabels[k].toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          {(tab === 'idea' || tab === 'saved') && (
            <div>
              <small>BUILD DIFFICULTY</small>
              <div className="nm-chips">
                {['', 'Manageable', 'Moderate', 'Challenging'].map((d) => (
                  <button key={d || 'any'} className={'nm-chip ' + (filters.difficulty === d ? 'on' : '')} onClick={() => setFilters({ ...filters, difficulty: d })}>
                    {d || 'Any'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <small>SOURCE AND PLACE</small>
            <div className="nm-chips">
              {(
                [
                  ['all', 'Everything'],
                  ['nextmade', 'NextMade research'],
                  ['community', 'Community'],
                  ['mine', 'My research'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} className={'nm-chip ' + (filters.source === v ? 'on' : '')} onClick={() => setFilters({ ...filters, source: v })}>
                  {l}
                </button>
              ))}
              <button className={'nm-chip ' + (filters.canada ? 'on' : '')} onClick={() => setFilters({ ...filters, canada: !filters.canada })}>
                <MapPin size={11} /> Relevant in Canada
              </button>
            </div>
          </div>
          {active > 0 && (
            <button className="text-btn" onClick={() => setFilters({ ...noFilters, q: filters.q })}>
              Clear filters <X size={12} />
            </button>
          )}
        </section>
      )}

      {tab === 'foryou' && profileThin && (
        <button className="card fc-banner" onClick={() => ctx.go('about')}>
          <Sparkles size={18} />
          <span>Add your skills, audience and market in About me so these matches get sharper.</span>
          <ArrowRight size={16} />
        </button>
      )}

      {state === 'loading' && <p className="nm-hint">Loading the catalog…</p>}
      {state === 'error' && (
        <section className="card">
          <div className="empty">
            <Lightbulb size={30} />
            <h3>Browse isn’t available yet.</h3>
            <p>{error}</p>
          </div>
        </section>
      )}
      {state === 'ready' && (
        <>
          <p className="nb-count">
            {list.length} {tab === 'foryou' ? 'matches for you' : tab === 'saved' ? 'saved' : kindLabel[tab as 'idea'].toLowerCase() + (list.length === 1 ? '' : 's')}
          </p>
          <div className="nb-list">
            {list.map((i, idx) => {
              const Icon = kindIcon[i.kind];
              return (
                <article key={i.id} className="card nb-row">
                  <span className="nb-rank">{idx + 1}</span>
                  <button className="nb-row-main" onClick={() => setOpenId(i.id)}>
                    <strong>
                      {(tab === 'foryou' || tab === 'saved') && <Icon size={13} />} {i.title}
                    </strong>
                    <p>{i.summary}</p>
                    <span className="nb-meta">
                      {i.market && <span className="badge peach">{i.market}</span>}
                      {i.category && <span className="badge lavender">{i.category}</span>}
                      {i.kind === 'idea' && i.scores.difficulty && <span className="badge neutral">{String(i.scores.difficulty)}</span>}
                      {i.demand.growth && <span className="nb-demand">{i.demand.growth}</span>}
                      {i.demand.label && <span className="nb-demand">{i.demand.label}</span>}
                      {i.canada && (
                        <span className="nb-demand">
                          <MapPin size={10} /> Canada
                        </span>
                      )}
                      {i.mine ? <span className="nb-demand">Your research</span> : i.community ? <span className="nb-demand">Community</span> : null}
                      {i._match.length > 0 && <span className="nb-demand">Matches: {i._match.join(', ')}</span>}
                      <span className="nb-demand">{timeAgo(i.created)}</span>
                    </span>
                  </button>
                  <div className="nb-scores">
                    {scoreKeys(i.kind).map((k) => (
                      <Score key={k} label={scoreLabels[k]} value={n(i.scores[k])} />
                    ))}
                  </div>
                  <button className="icon-btn" aria-label={bookmarks.has(i.id) ? 'Remove from saved' : 'Save'} disabled={saving} onClick={() => toggleBookmark(i.id)}>
                    {bookmarks.has(i.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </article>
              );
            })}
            {!list.length && (
              <section className="card">
                <div className="empty">
                  <Search size={28} />
                  <h3>{items.length ? 'Nothing matches yet.' : 'The catalog is warming up.'}</h3>
                  <p>
                    {items.length
                      ? tab === 'saved'
                        ? 'Save entries with the bookmark and they’ll collect here.'
                        : 'Try fewer filters, or research your own.'
                      : 'New ideas, trends and niches arrive daily once the research job runs. You can research your own now.'}
                  </p>
                </div>
              </section>
            )}
          </div>
          <p className="nm-hint">
            Entries are AI research with cited sources where live search was available. Scores are judgements, not guarantees. Check the sources before you invest.
          </p>
        </>
      )}
    </>
  );
}

function ResearchForm({ ctx, close, done }: { ctx: Ctx; close: () => void; done: (id: string) => void }) {
  const [kind, setKind] = useState<'idea' | 'trend' | 'niche'>('idea');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const lim = limits[ctx.plan.tier].research;
  const leftRuns = Math.max(0, lim - ctx.plan.researchUsed);
  return (
    <section className="card">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setErr('');
          try {
            const r = await fetch('/api/catalog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'research', kind, text: String(f.get('text') || ''), shared: f.get('shared') === 'on' }),
            });
            const b: any = await r.json();
            if (!r.ok) throw new Error(b.error);
            ctx.refreshPlan();
            ctx.notify(b.researched ? 'Research ready, with live sources.' : 'Research ready. Live search is off, so check market facts yourself.');
            done(b.id);
          } catch (x) {
            setErr(x instanceof Error ? x.message : 'Research failed.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="card-heading">
          <h3>Research with Nova</h3>
          <button type="button" className="icon-btn" aria-label="Close" onClick={close}>
            <X size={16} />
          </button>
        </div>
        <div className="nm-chips">
          {(['idea', 'trend', 'niche'] as const).map((k) => (
            <button type="button" key={k} className={'nm-chip ' + (kind === k ? 'on' : '')} onClick={() => setKind(k)}>
              {kindLabel[k]}
            </button>
          ))}
        </div>
        <Field
          label={kind === 'idea' ? 'Describe the idea' : kind === 'trend' ? 'What trend should Nova dig into?' : 'Which audience should Nova study?'}
          hint="Takes up to a minute. Nova searches the web where your AI provider allows it."
        >
          <textarea
            name="text"
            required
            minLength={3}
            maxLength={1500}
            rows={3}
            placeholder={
              kind === 'idea'
                ? 'e.g. Bookkeeping for newcomer-owned restaurants in Ontario'
                : kind === 'trend'
                  ? 'e.g. AI receptionists for clinics'
                  : 'e.g. Independent physiotherapists in Toronto'
            }
          />
        </Field>
        <label className="nb-check">
          <input type="checkbox" name="shared" /> Share it with the NextMade community catalog
        </label>
        {err && <p className="form-error">{err}</p>}
        <div className="nm-actions">
          <button className="btn primary" disabled={busy || !ctx.aiReady || leftRuns === 0}>
            <Sparkles size={15} /> {busy ? 'Researching…' : 'Start research'}
          </button>
          <small className="nb-quota">
            {leftRuns} of {lim} research {lim === 1 ? 'run' : 'runs'} left this month
            {ctx.plan.tier === 'free' && (
              <>
                {' · '}
                <button type="button" className="text-btn" onClick={() => ctx.go('upgrade')}>
                  Get more with Pro
                </button>
              </>
            )}
          </small>
        </div>
      </form>
    </section>
  );
}

function List({ title, items }: { title: string; items?: unknown }) {
  const arr = Array.isArray(items) ? items.filter((x) => typeof x === 'string' && x.trim()) : [];
  if (!arr.length) return null;
  return (
    <section className="card">
      <h3>{title}</h3>
      <ul className="nb-ul">
        {arr.map((x, i) => (
          <li key={i}>{String(x)}</li>
        ))}
      </ul>
    </section>
  );
}
function Text({ title, text }: { title: string; text?: unknown }) {
  if (typeof text !== 'string' || !text.trim()) return null;
  return (
    <section className="card">
      <small className="nb-label">{title.toUpperCase()}</small>
      <p>{text}</p>
    </section>
  );
}

function Detail({ ctx, id, back, bookmarked, toggle, onDeleted }: { ctx: Ctx; id: string; back: () => void; bookmarked: boolean; toggle: () => void; onDeleted: () => void }) {
  const { data, save, saving } = ctx;
  const [e, setE] = useState<Full | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch('/api/catalog?id=' + encodeURIComponent(id))
      .then((r) => r.json().then((b) => (r.ok ? setE(b.entry) : setErr(b.error))))
      .catch(() => setErr('Could not open this entry.'));
  }, [id]);
  if (err)
    return (
      <>
        <button className="text-btn nm-back" onClick={back}>
          <ArrowLeft size={14} /> Browse
        </button>
        <p>{err}</p>
      </>
    );
  if (!e) return <p className="nm-hint">Opening…</p>;
  const b = e.body || {};

  function toIdea(title: string, oneLiner: string, withReport: boolean): Idea {
    const existing = data.ideas.find((i) => i.title === title);
    if (existing) return existing;
    return {
      id: uid(),
      title: title.slice(0, 500),
      oneLiner: oneLiner.slice(0, 2000),
      origin: 'feed',
      status: 'saved',
      rating: '',
      report: withReport ? JSON.stringify({ ...b, title: e!.title, oneLiner: e!.summary, score: n(e!.scores.overall) || undefined, model: [e!.market, e!.category].filter(Boolean).join(' · ') }).slice(0, 20000) : '',
      sources: withReport ? e!.sources.slice(0, 30) : [],
      goalId: '',
      created: now(),
      updated: now(),
    };
  }
  async function saveIdea(title: string, oneLiner: string, withReport: boolean, then: 'report' | 'build' | 'stay') {
    const idea = toIdea(title, oneLiner, withReport);
    const known = data.ideas.some((i) => i.id === idea.id);
    let next = known ? data : fitWorkspace({ ...data, ideas: [idea, ...data.ideas].slice(0, 150) });
    if (then === 'build') {
      if (idea.goalId && data.goals.some((g) => g.id === idea.goalId)) return ctx.go('project', { goalId: idea.goalId });
      const plan = Array.isArray(b.plan) && b.plan.length ? b.plan.map(String) : ['Write down who this is for and the problem in their words', 'Talk to three potential customers', 'Run the 7-day build plan agent'];
      const q = questForIdea(next, { ...idea, status: 'saved' }, plan);
      if (await save(q.next)) {
        ctx.notify('Project created with your first commitments.');
        ctx.go('project', { goalId: q.goalId });
      }
      return;
    }
    if (!known && !(await save(next))) return;
    if (then === 'report') ctx.go('ideas', { ideaId: idea.id });
    else ctx.notify(known ? 'Already in My ideas.' : 'Saved to My ideas.');
  }

  const Icon = kindIcon[e.kind];
  const opportunities: { title: string; oneLiner: string }[] = Array.isArray(b.opportunities) ? b.opportunities.filter((o: any) => o && o.title) : [];
  return (
    <>
      <button className="text-btn nm-back" onClick={back}>
        <ArrowLeft size={14} /> Browse
      </button>
      <section className="card nm-report-hero">
        <div className="nb-meta">
          <span className="badge sage">
            <Icon size={10} /> {kindLabel[e.kind].toUpperCase()}
          </span>
          {e.market && <span className="badge peach">{e.market}</span>}
          {e.category && <span className="badge lavender">{e.category}</span>}
          {e.canada && (
            <span className="nb-demand">
              <MapPin size={10} /> Relevant in Canada
            </span>
          )}
          <span className="nb-demand">{e.community ? (e.mine ? 'Your research' : 'Community research') : 'NextMade research'} · {timeAgo(e.created)}</span>
        </div>
        <h2>{e.title}</h2>
        <p>{e.summary}</p>
        <div className="nb-scores big">
          {scoreKeys(e.kind).map((k) => (
            <Score key={k} label={scoreLabels[k]} value={n(e.scores[k])} />
          ))}
          {e.kind === 'idea' && <Score label="Feasibility" value={n(e.scores.feasibility)} />}
        </div>
        {(e.demand.label || e.demand.growth || e.demand.interest || e.demand.size) && (
          <div className="nb-demandrow">
            {[e.demand.label, e.demand.growth, e.demand.interest, e.demand.size].filter(Boolean).map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        )}
        <div className="nm-actions">
          {e.kind === 'idea' && !e.locked && (
            <>
              <button className="btn primary" disabled={saving} onClick={() => saveIdea(e.title, e.summary, true, 'report')}>
                Open the full report <ArrowRight size={15} />
              </button>
              <button className="btn" disabled={saving} onClick={() => saveIdea(e.title, e.summary, true, 'build')}>
                <Hammer size={15} /> Build this idea
              </button>
            </>
          )}
          <button className="btn" disabled={saving} onClick={toggle}>
            {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {bookmarked ? 'Saved' : 'Save'}
          </button>
          {e.mine && (
            <>
              <button
                className="btn"
                onClick={async () => {
                  const r = await fetch('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'share', id: e.id, shared: !e.shared }) });
                  if (r.ok) {
                    setE({ ...e, shared: !e.shared });
                    ctx.notify(e.shared ? 'Now private to you.' : 'Shared with the community catalog.');
                  }
                }}
              >
                <Share2 size={15} /> {e.shared ? 'Make private' : 'Share with community'}
              </button>
              <button
                className="icon-btn"
                aria-label="Delete this research"
                onClick={async () => {
                  if (!confirm('Delete this research?')) return;
                  const r = await fetch('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: e.id }) });
                  if (r.ok) {
                    onDeleted();
                    back();
                  }
                }}
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </section>

      {e.locked ? (
        <section className="card nb-locked">
          <Lock size={22} />
          <div>
            <h3>This one is in the archive.</h3>
            <p>Free includes the last 7 days of research. Pro opens every idea, trend and niche, with sources.</p>
          </div>
          <button className="btn primary" onClick={() => ctx.go('upgrade')}>
            See Pro <ArrowRight size={15} />
          </button>
        </section>
      ) : (
        <div className="nb-detail">
          {e.kind === 'idea' && (
            <>
              <Text title="Who it’s for" text={b.whoFor} />
              <Text title="The problem" text={b.problem} />
              <Text title="The gap" text={b.gap} />
              <Text title="Why now" text={b.whyNow} />
              <List title="Reasons to build" items={b.reasonsBuild} />
              <List title="Reasons not to" items={b.reasonsNot} />
              <Text title="Biggest risk" text={b.biggestRisk} />
              <List title="First steps" items={b.plan} />
            </>
          )}
          {e.kind === 'trend' && (
            <>
              <Text title="What’s driving it" text={b.driving} />
              <Text title="Who benefits" text={b.whoBenefits} />
              <Text title="How long the window lasts" text={b.window} />
              <List title="Risks" items={b.risks} />
            </>
          )}
          {e.kind === 'niche' && (
            <>
              <Text title="Size" text={b.size} />
              {Array.isArray(b.pains) && b.pains.length > 0 && (
                <section className="card">
                  <h3>Their pains</h3>
                  {b.pains
                    .filter((p: any) => p && p.pain)
                    .map((p: any, i: number) => (
                      <div className="nm-meter" key={i}>
                        <span>{String(p.pain)}</span>
                        <div>
                          <i style={{ width: Math.max(0, Math.min(10, n(p.severity))) * 10 + '%' }} />
                        </div>
                        <b>{n(p.severity)}</b>
                      </div>
                    ))}
                </section>
              )}
              <List title="Where they gather" items={b.gather} />
              <Text title="What they already pay for" text={b.spend} />
            </>
          )}
          {opportunities.length > 0 && (
            <section className="card nb-opps">
              <h3>Opportunities</h3>
              {opportunities.map((o) => (
                <div key={o.title} className="nb-opp">
                  <div>
                    <strong>{o.title}</strong>
                    <p>{o.oneLiner}</p>
                  </div>
                  <button className="btn small" disabled={saving} onClick={() => saveIdea(o.title, o.oneLiner || '', false, 'report')}>
                    Validate this <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </section>
          )}
          <Sources sources={e.sources} />
        </div>
      )}
    </>
  );
}
