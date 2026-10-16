'use client';
// About me: the founder profile Nova uses to match ideas and advice, plus the builder-style quiz.
import { useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles, UserRound } from 'lucide-react';
import { founderStageLabels, founderStages, type Founder } from './domain';
import { archetypes, quiz, scoreQuiz } from './catalog';
import { Field, Heading, values, type Ctx } from './ui';

export function profileStrength(f: Founder) {
  const keys: (keyof Founder)[] = ['edge', 'skills', 'market', 'audience', 'problem', 'hours', 'budget', 'goal', 'links', 'archetype'];
  const filled = keys.filter((k) => String(f[k] || '').trim()).length;
  return Math.round((filled / keys.length) * 100);
}

export function ArchetypeCard({ id, compact = false }: { id: string; compact?: boolean }) {
  const a = archetypes.find((x) => x.id === id);
  if (!a) return null;
  return (
    <section className={'card nm-arch ' + (compact ? 'compact' : '')}>
      <div className="nm-arch-emoji" aria-hidden="true">
        {a.emoji}
      </div>
      <div>
        <small>YOUR BUILDER STYLE</small>
        <h3>{a.name}</h3>
        <p>{a.line}</p>
        {!compact && (
          <div className="nm-arch-grid">
            <div>
              <small>BUILDS WELL</small>
              <ul>{a.builds.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
            <div>
              <small>WATCH OUT FOR</small>
              <ul>{a.avoid.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
            <div>
              <small>BEST PARTNER</small>
              <p>{a.partner}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Quiz({ ctx, onDone }: { ctx: Ctx; onDone: () => void }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const step = answers.length;
  if (step >= quiz.length) {
    const r = scoreQuiz(answers);
    return (
      <section className="card nm-quiz">
        <small>RESULT</small>
        <ArchetypeCard id={r.primary} />
        {r.secondary && <p>With a streak of {archetypes.find((a) => a.id === r.secondary)?.name}.</p>}
        <div className="nm-actions">
          <button className="btn" onClick={() => setAnswers([])}>
            <RefreshCw size={15} /> Retake
          </button>
          <button
            className="btn primary"
            disabled={ctx.saving}
            onClick={async () => {
              if (await ctx.save({ ...ctx.data, founder: { ...ctx.data.founder, archetype: r.primary, quiz: r.tally } })) {
                ctx.notify('Builder style saved. Nova will use it for ideas and fit checks.');
                onDone();
              }
            }}
          >
            Save to my profile <ArrowRight size={15} />
          </button>
        </div>
      </section>
    );
  }
  const q = quiz[step];
  return (
    <section className="card nm-quiz">
      <div className="nm-quiz-top">
        <small>
          QUESTION {step + 1} OF {quiz.length}
        </small>
        <div className="progress-line">
          <span style={{ width: (step / quiz.length) * 100 + '%' }} />
        </div>
      </div>
      <h3>{q.q}</h3>
      <div className="nm-options">
        {q.options.map((o, i) => (
          <button key={o.text} className="nm-option" onClick={() => setAnswers([...answers, i])}>
            {o.text}
          </button>
        ))}
      </div>
      <div className="nm-actions">
        {step > 0 && (
          <button className="text-btn" onClick={() => setAnswers(answers.slice(0, -1))}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <button className="text-btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </section>
  );
}

export default function AboutMe({ ctx }: { ctx: Ctx }) {
  const f = ctx.data.founder;
  const [quizOpen, setQuizOpen] = useState(ctx.focus.tab === 'quiz');
  const strength = profileStrength(f);
  return (
    <>
      <Heading
        eyebrow="WHAT NOVA KNOWS ABOUT YOU"
        title="About me"
        text="What you add here shapes the ideas, fit checks and plans Nova puts in front of you. Nothing is posted anywhere."
      />
      <div className="nm-two">
        <div>
          {quizOpen ? (
            <Quiz ctx={ctx} onDone={() => setQuizOpen(false)} />
          ) : f.archetype ? (
            <>
              <ArchetypeCard id={f.archetype} />
              <button className="text-btn" onClick={() => setQuizOpen(true)}>
                Retake the builder style quiz <RefreshCw size={13} />
              </button>
            </>
          ) : (
            <section className="card nm-cta">
              <Sparkles size={22} />
              <div>
                <h3>Find your builder style</h3>
                <p>Ten quick scenarios, about two minutes. Unlocks better idea matches and fit checks.</p>
              </div>
              <button className="btn primary" onClick={() => setQuizOpen(true)}>
                Start the quiz <ArrowRight size={15} />
              </button>
            </section>
          )}
          <section className="card nm-strength">
            <div className="card-heading">
              <h3>Profile strength</h3>
              <strong>{strength}%</strong>
            </div>
            <div className="progress-line">
              <span style={{ width: strength + '%' }} />
            </div>
            <p>{strength < 60 ? 'Add your edge, skills and the problem you keep seeing for sharper matches.' : 'Nova has a good picture of you. Keep it current as things change.'}</p>
          </section>
        </div>
        <section className="card">
          <div className="card-heading">
            <h3>
              <UserRound size={17} /> Your founder profile
            </h3>
          </div>
          <form
            onSubmit={async (e) => {
              const v = values(e);
              const next: Founder = {
                ...f,
                stage: (founderStages as readonly string[]).includes(v.stage) ? (v.stage as Founder['stage']) : f.stage,
                edge: v.edge || '',
                skills: v.skills || '',
                market: v.market || '',
                audience: v.audience || '',
                problem: v.problem || '',
                hours: v.hours || '',
                budget: v.budget || '',
                goal: v.goal || '',
                links: v.links || '',
              };
              if (await ctx.save({ ...ctx.data, founder: next })) ctx.notify('Profile saved.');
            }}
          >
            <Field label="Where are you right now?">
              <select name="stage" defaultValue={f.stage}>
                {founderStages.map((s) => (
                  <option key={s} value={s}>
                    {founderStageLabels[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Your edge" hint="Experience, access or insight most people don't have.">
              <textarea name="edge" rows={3} maxLength={2000} defaultValue={f.edge} />
            </Field>
            <Field label="Something you're great at">
              <textarea name="skills" rows={2} maxLength={2000} defaultValue={f.skills} />
            </Field>
            <div className="form-row">
              <Field label="A market you love">
                <input name="market" maxLength={1000} defaultValue={f.market} />
              </Field>
              <Field label="People you can reach">
                <input name="audience" maxLength={1000} defaultValue={f.audience} />
              </Field>
            </div>
            <Field label="A problem you keep seeing">
              <textarea name="problem" rows={2} maxLength={1000} defaultValue={f.problem} />
            </Field>
            <div className="form-row">
              <Field label="Hours per week">
                <select name="hours" defaultValue={f.hours}>
                  <option value="">Not set</option>
                  {['Under 5', '5 to 10', '10 to 20', '20 to 40', 'Full time'].map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </Field>
              <Field label="Starting budget">
                <select name="budget" defaultValue={f.budget}>
                  <option value="">Not set</option>
                  {['Under $500', '$500 to $2,500', '$2,500 to $10,000', '$10,000 to $50,000', 'Over $50,000'].map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="What you're going for">
              <input name="goal" maxLength={1000} defaultValue={f.goal} placeholder="e.g. First $1,000 in revenue by spring" />
            </Field>
            <Field label="Links" hint="LinkedIn, website or portfolio, for your own reference.">
              <input name="links" maxLength={1000} defaultValue={f.links} />
            </Field>
            <button className="btn primary" disabled={ctx.saving}>
              Save profile
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
