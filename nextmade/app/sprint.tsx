'use client';
// Launch Sprint: a guided 7-day path from idea to a business, one step a day, built on ideas, agents and quests.
import { useState } from 'react';
import { ArrowRight, CalendarCheck, Check, Lock, MessageCircle, Rocket, Wand2 } from 'lucide-react';
import { localDay } from './domain';
import { agentById, sprintSteps } from './catalog';
import { briefing } from './project';
import { CopyButton, Field, Heading, now, uid, values, type Ctx } from './ui';

export default function Sprint({ ctx }: { ctx: Ctx }) {
  const { data, save, saving } = ctx;
  const s = data.sprint;
  const [showBrief, setShowBrief] = useState(false);

  if (!s) {
    return (
      <>
        <Heading
          eyebrow="7 STEPS · 1 WEEK"
          title="Launch Sprint"
          text="Turn an idea into a business in seven days. One step a day, about an hour each, and every step ends with something real you keep."
        />
        <div className="nm-two">
          <section className="card">
            <h3>By day 7 you’ll have</h3>
            <ul className="nm-checks">
              <li>One idea you’ve committed to, with evidence behind it</li>
              <li>A business map and the customer you’ll serve first</li>
              <li>An offer, a price and a landing page draft</li>
              <li>Your first prospect list and the message to send</li>
              <li>A project briefing for the AI tool you already use</li>
            </ul>
            <p className="nm-hint">Start wherever you are: no idea, an idea, or already building.</p>
          </section>
          <section className="card">
            <h3>Start your sprint</h3>
            <form
              onSubmit={async (e) => {
                const v = values(e);
                let ideas = data.ideas;
                let ideaId = v.ideaId;
                if (!ideaId) {
                  if (!v.title?.trim()) {
                    ctx.notify('Pick an idea or describe a new one.');
                    return;
                  }
                  ideaId = uid();
                  ideas = [
                    { id: ideaId, title: v.title.trim().slice(0, 500), oneLiner: (v.oneLiner || '').slice(0, 2000), origin: 'mine', status: 'exploring', rating: '', report: '', sources: [], goalId: '', created: now(), updated: now() },
                    ...ideas,
                  ];
                }
                const goalId = uid();
                const idea = ideas.find((i) => i.id === ideaId)!;
                const due = new Date();
                due.setDate(due.getDate() + 6);
                const tasks = sprintSteps.map((st, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  return { id: uid(), goalId, title: `Day ${st.day}: ${st.title}`, due: localDay(d), status: 'planned' as const, created: now() };
                });
                if (
                  await save({
                    ...data,
                    ideas: ideas.map((i) => (i.id === ideaId ? { ...i, goalId, status: 'committed' as const, updated: now() } : i)),
                    goals: [...data.goals, { id: goalId, title: `Launch Sprint: ${idea.title}`.slice(0, 500), category: 'Start a business', due: localDay(due), why: idea.oneLiner.slice(0, 2000), created: now(), paused: false }],
                    tasks: [...data.tasks, ...tasks],
                    sprint: { started: localDay(), ideaId, goalId, done: [] },
                  })
                )
                  ctx.notify('Sprint started. Day 1 is ready.');
              }}
            >
              <Field label="Which idea?">
                <select name="ideaId" defaultValue={data.ideas[0]?.id || ''}>
                  <option value="">A new idea…</option>
                  {data.ideas.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="New idea title (if not picking one)">
                <input name="title" maxLength={200} />
              </Field>
              <Field label="Describe it briefly">
                <textarea name="oneLiner" rows={3} maxLength={2000} />
              </Field>
              <button className="btn primary" disabled={saving}>
                <Rocket size={15} /> Start the 7-day sprint
              </button>
            </form>
            <button className="text-btn" onClick={() => ctx.go('ideas')}>
              No idea yet? Find one first <ArrowRight size={13} />
            </button>
          </section>
        </div>
      </>
    );
  }

  const idea = data.ideas.find((i) => i.id === s.ideaId);
  const dayNumber = Math.min(7, Math.floor((Date.parse(localDay() + 'T12:00:00') - Date.parse(s.started + 'T12:00:00')) / 86400000) + 1);
  const goalTasks = data.tasks.filter((t) => t.goalId === s.goalId);
  async function complete(stepId: string) {
    const st = sprintSteps.find((x) => x.id === stepId)!;
    const done = s!.done.includes(stepId) ? s!.done.filter((x) => x !== stepId) : [...s!.done, stepId];
    const label = `Day ${st.day}: ${st.title}`;
    await save({
      ...data,
      sprint: { ...s!, done },
      tasks: data.tasks.map((t) => (t.goalId === s!.goalId && t.title === label ? { ...t, status: done.includes(stepId) ? 'completed' : 'planned' } : t)),
    });
  }
  function hasOutput(st: (typeof sprintSteps)[number]) {
    if (st.action === 'report') return !!idea?.report;
    if (st.action === 'agent') return data.runs.some((r) => r.agent === st.agent && (r.ideaId === s!.ideaId || r.goalId === s!.goalId));
    return false;
  }
  const brief = briefing(data, s.goalId);
  return (
    <>
      <Heading
        eyebrow={`LAUNCH SPRINT · DAY ${Math.max(1, dayNumber)} OF 7`}
        title={idea?.title || 'Your sprint'}
        text="One step a day. Unlocked steps can be done early, and every output is saved to your project."
        action={
          <button className="btn" onClick={() => ctx.go('project', { goalId: s.goalId })}>
            Open project <ArrowRight size={15} />
          </button>
        }
      />
      <section className="card nm-sprint-bar">
        <div className="progress-meta">
          <span>{s.done.length} of 7 steps done</span>
          <span>{Math.round((s.done.length / 7) * 100)}%</span>
        </div>
        <div className="progress-line">
          <span style={{ width: (s.done.length / 7) * 100 + '%' }} />
        </div>
      </section>
      <div className="nm-steps">
        {sprintSteps.map((st) => {
          const done = s.done.includes(st.id);
          const unlocked = st.day <= dayNumber + 1 || done;
          const agent = agentById(st.agent);
          const output = hasOutput(st);
          return (
            <section key={st.id} className={'card nm-step ' + (done ? 'done' : '') + (st.day === dayNumber ? ' today' : '')}>
              <div className="nm-step-day">
                <small>DAY</small>
                <strong>{st.day}</strong>
              </div>
              <div className="nm-step-body">
                <h3>{st.title}</h3>
                <p>{st.text}</p>
                {unlocked ? (
                  <div className="nm-actions">
                    {st.action === 'report' && (
                      <button className="btn small" onClick={() => ctx.go('ideas', { ideaId: s.ideaId })}>
                        <Wand2 size={13} /> {output ? 'View report' : 'Validate the idea'}
                      </button>
                    )}
                    {st.action === 'agent' && agent && (
                      <button className="btn small" onClick={() => ctx.go('agents', { agent: agent.id, ideaId: s.ideaId, goalId: s.goalId })}>
                        <Wand2 size={13} /> {output ? 'Run again' : agent.title}
                      </button>
                    )}
                    {st.action === 'brief' && (
                      <>
                        <button className="btn small" onClick={() => setShowBrief(!showBrief)}>
                          <Wand2 size={13} /> {showBrief ? 'Hide briefing' : 'Get my AI briefing'}
                        </button>
                        <button className="btn small" onClick={() => ctx.go('circles')}>
                          <MessageCircle size={13} /> Review with my circle
                        </button>
                        <button className="btn small" onClick={() => ctx.go('meetings')}>
                          <CalendarCheck size={13} /> Log the review meeting
                        </button>
                      </>
                    )}
                    {st.agent === 'first-prospects' && (
                      <button className="btn small" onClick={() => ctx.go('customers')}>
                        Log people in First customers
                      </button>
                    )}
                    <button className={'btn small ' + (done ? 'primary' : '')} disabled={saving} onClick={() => complete(st.id)}>
                      <Check size={13} /> {done ? 'Done' : 'Mark done'}
                    </button>
                    {output && !done && <span className="badge sage">OUTPUT SAVED</span>}
                  </div>
                ) : (
                  <span className="nm-hint">
                    <Lock size={12} /> Unlocks on day {st.day - 1}
                  </span>
                )}
                {st.action === 'brief' && showBrief && unlocked && (
                  <div className="nm-brief">
                    <CopyButton text={brief} label="Copy briefing" />
                    <pre className="nm-pre">{brief}</pre>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {s.done.length === 7 && (
        <section className="card nm-cta">
          <Rocket size={22} />
          <div>
            <h3>Sprint complete. Move on, adjust or double down?</h3>
            <p>Record your decision with the advisory board, then keep going in your project.</p>
          </div>
          <button className="btn primary" onClick={() => ctx.go('board')}>
            Decide with the board <ArrowRight size={15} />
          </button>
        </section>
      )}
      <button
        className="text-btn"
        disabled={saving}
        onClick={() => {
          if (confirm('End this sprint? Your project, idea and outputs are kept.')) save({ ...data, sprint: null });
        }}
      >
        End this sprint {goalTasks.length ? '(keeps the project)' : ''}
      </button>
    </>
  );
}
