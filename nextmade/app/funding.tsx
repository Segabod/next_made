'use client';
// Funding & perks: Canadian funding and supports with a Nova fit check, and startup credit programmes with a Pro perk planner.
import { useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Lock, MapPin, Sparkles } from 'lucide-react';
import { perks, programs, reviewed, type Program } from './funding-data';
import { CopyButton, Field, Heading, Markdown, Tabs, type Ctx } from './ui';

const tagLabels: Record<string, string> = {
  newcomer: 'Newcomers',
  youth: 'Under 40',
  student: 'Students',
  women: 'Women founders',
  black: 'Black founders',
  tech: 'Tech and R&D',
  export: 'Exporting',
};
const types: Program['type'][] = ['Grant', 'Loan', 'Tax credit', 'Wage support', 'Advice and network'];

export default function Funding({ ctx }: { ctx: Ctx }) {
  const [tab, setTab] = useState<'funding' | 'perks'>(ctx.focus.tab === 'perks' ? 'perks' : 'funding');
  const [tags, setTags] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [place, setPlace] = useState('');
  const [fit, setFit] = useState('');
  const [plan, setPlan] = useState('');
  const pro = ctx.plan.tier === 'pro';

  const places = Array.from(new Set(programs.map((p) => p.where)));
  const shown = useMemo(
    () =>
      programs.filter(
        (p) => p.type === 'Directory' || ((!type || p.type === type) && (!place || p.where === place) && (!tags.length || tags.some((t) => p.tags.includes(t as any)))),
      ),
    [tags, type, place],
  );

  async function checkFit(note: string) {
    const list = programs.map(({ name, type, where, amount, who, tags }) => ({ name, type, where, amount, who, tags }));
    const r = await ctx.call({ mode: 'funding', text: JSON.stringify({ programmes: list, note }) });
    if (r) setFit(r.text);
  }
  async function planPerks(note: string) {
    const list = perks.map(({ name, what, offer, who }) => ({ name, what, offer, who }));
    const r = await ctx.call({ mode: 'perks', text: JSON.stringify({ programmes: list, building: note }) });
    if (r) setPlan(r.text);
  }

  return (
    <>
      <Heading eyebrow="MONEY AND TOOLS YOU DON’T HAVE TO RAISE" title="Funding & perks" text="Canadian grants, loans and supports, and startup credit programmes, with Nova to tell you which fit." />
      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'funding', label: 'Funding in Canada', count: programs.length },
            { id: 'perks', label: 'Startup perks', count: perks.length },
          ]}
        />
      </div>

      {tab === 'funding' && (
        <>
          <section className="card nb-fit">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                checkFit(String(new FormData(e.currentTarget).get('note') || ''));
              }}
            >
              <h3>
                <Sparkles size={15} /> Which of these fit me?
              </h3>
              <p className="nm-hint">Nova reads your founder profile and projects, then shortlists programmes and what to confirm before you apply.</p>
              <Field label="Anything Nova should know? (optional)" hint="e.g. incorporated in Ontario last month, permanent resident, pre-revenue">
                <input name="note" maxLength={600} />
              </Field>
              <button className="btn primary" disabled={ctx.thinking || !ctx.aiReady}>
                {ctx.thinking ? 'Checking…' : 'Check my fit'} <ArrowRight size={15} />
              </button>
            </form>
            {fit && (
              <div className="nb-ai">
                <Markdown text={fit} />
                <CopyButton text={fit} />
              </div>
            )}
          </section>
          <section className="card nb-filters">
            <div>
              <small>FOR</small>
              <div className="nm-chips">
                {Object.entries(tagLabels).map(([k, l]) => (
                  <button key={k} className={'nm-chip ' + (tags.includes(k) ? 'on' : '')} onClick={() => setTags(tags.includes(k) ? tags.filter((x) => x !== k) : [...tags, k])}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <small>TYPE</small>
              <div className="nm-chips">
                {['', ...types].map((t) => (
                  <button key={t || 'any'} className={'nm-chip ' + (type === t ? 'on' : '')} onClick={() => setType(t)}>
                    {t || 'Any'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <small>WHERE</small>
              <div className="nm-chips">
                {['', ...places].map((p) => (
                  <button key={p || 'any'} className={'nm-chip ' + (place === p ? 'on' : '')} onClick={() => setPlace(p)}>
                    {p || 'Anywhere'}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <div className="nm-grid">
            {shown.map((p) => (
              <a key={p.id} className="card nb-program" href={p.url} target="_blank" rel="noreferrer noopener">
                <div className="nb-meta">
                  <span className="badge sage">{p.type.toUpperCase()}</span>
                  <span className="nb-demand">
                    <MapPin size={10} /> {p.where}
                  </span>
                </div>
                <strong>{p.name}</strong>
                <small>{p.by}</small>
                <p className="nb-amount">{p.amount}</p>
                <p>{p.who}</p>
                <span className="nb-open">
                  Official page <ExternalLink size={12} />
                </span>
              </a>
            ))}
          </div>
          <p className="nm-hint">
            Reviewed {reviewed}. Amounts are published maximums and eligibility changes; always confirm on the official page. NextMade is not affiliated with these programmes and this is not financial advice.
          </p>
        </>
      )}

      {tab === 'perks' && (
        <>
          <section className="card nb-fit">
            {pro ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  planPerks(String(new FormData(e.currentTarget).get('note') || ''));
                }}
              >
                <h3>
                  <Sparkles size={15} /> Perk planner
                </h3>
                <Field label="What are you building, and on what stack?" hint="e.g. a Next.js SaaS on Vercel and Supabase, using Claude, pre-revenue, no investors">
                  <input name="note" required maxLength={600} />
                </Field>
                <button className="btn primary" disabled={ctx.thinking || !ctx.aiReady}>
                  {ctx.thinking ? 'Planning…' : 'Plan my perks'} <ArrowRight size={15} />
                </button>
                {plan && (
                  <div className="nb-ai">
                    <Markdown text={plan} />
                    <CopyButton text={plan} />
                  </div>
                )}
              </form>
            ) : (
              <div className="nb-locked flat">
                <Lock size={20} />
                <div>
                  <h3>Perk planner is part of Pro</h3>
                  <p>Nova picks which programmes to apply for first, based on your project, stack and stage.</p>
                </div>
                <button className="btn primary" onClick={() => ctx.go('upgrade')}>
                  See Pro <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
          {(['Cloud and hosting', 'AI', 'Product and growth', 'Run the business'] as const).map((g) => (
            <div key={g} className="nm-group">
              <h4 className="nm-group-title">{g.toUpperCase()}</h4>
              <div className="nm-grid">
                {perks
                  .filter((p) => p.group === g)
                  .map((p) => (
                    <a key={p.name} className="card nb-program" href={p.url} target="_blank" rel="noreferrer noopener">
                      <strong>{p.name}</strong>
                      <small>{p.what}</small>
                      <p className="nb-amount">{p.offer}</p>
                      <p>{p.who}</p>
                      <span className="nb-open">
                        Apply on their site <ExternalLink size={12} />
                      </span>
                    </a>
                  ))}
              </div>
            </div>
          ))}
          <p className="nm-hint">Reviewed {reviewed}. You apply directly with each provider; their terms decide eligibility. NextMade has no partnership with these providers yet.</p>
        </>
      )}
    </>
  );
}
