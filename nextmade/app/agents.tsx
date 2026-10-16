'use client';
// Agents: a library of focused Nova runs (decide, offer, build, sell). Every result is saved to the member's files.
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Globe, ListPlus, Wand2 } from 'lucide-react';
import { localDay, type Run } from './domain';
import { agentById, agentGroups, agents, type AgentGroup } from './catalog';
import { CopyButton, Field, Heading, Markdown, Sources, Tabs, commitmentsFrom, now, runAgent, timeAgo, uid, values, type Ctx } from './ui';

export function RunView({ ctx, run, back }: { ctx: Ctx; run: Run; back?: () => void }) {
  const { data, save, saving } = ctx;
  const items = commitmentsFrom(run.output);
  const goalId = run.goalId || data.ideas.find((i) => i.id === run.ideaId)?.goalId || '';
  const goal = data.goals.find((g) => g.id === goalId);
  async function addCommitments() {
    const target = goal || data.goals.find((g) => !g.paused);
    if (!target) {
      ctx.notify('Create a quest or build the idea first, then add these commitments.');
      return;
    }
    const tasks = items.map((title, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return { id: uid(), goalId: target.id, title, due: localDay(d), status: 'planned' as const, created: now() };
    });
    if (await save({ ...data, tasks: [...data.tasks, ...tasks] })) ctx.notify(`${tasks.length} commitments added to “${target.title}”.`);
  }
  return (
    <section className="card nm-run">
      {back && (
        <button className="text-btn nm-back" onClick={back}>
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <div className="card-heading">
        <div>
          <small>
            {agentById(run.agent)?.name || 'AGENT'} · {timeAgo(run.created)}
          </small>
          <h3>{run.title}</h3>
        </div>
        <div className="nm-actions">
          <CopyButton text={run.output} />
          {items.length > 0 && (
            <button className="btn small" disabled={saving} onClick={addCommitments}>
              <ListPlus size={14} /> Add {items.length} commitments
            </button>
          )}
        </div>
      </div>
      <Markdown text={run.output} />
      <Sources sources={run.sources} />
      <p className="nm-hint">Drafted by Nova. Check facts and numbers before you rely on them.</p>
    </section>
  );
}

export default function Agents({ ctx }: { ctx: Ctx }) {
  const { data, thinking, saving } = ctx;
  const [group, setGroup] = useState<AgentGroup | 'all' | 'mine'>('all');
  const [active, setActive] = useState(ctx.focus.agent || '');
  const [ideaId, setIdeaId] = useState(ctx.focus.ideaId || '');
  const [result, setResult] = useState<Run | null>(null);
  const [viewing, setViewing] = useState<Run | null>(null);
  const a = agentById(active);

  if (viewing) return <RunView ctx={ctx} run={viewing} back={() => setViewing(null)} />;

  if (a) {
    const pastRuns = data.runs.filter((r) => r.agent === a.id).slice(0, 5);
    return (
      <>
        <button
          className="text-btn nm-back"
          onClick={() => {
            setActive('');
            setResult(null);
          }}
        >
          <ArrowLeft size={14} /> All agents
        </button>
        <Heading eyebrow={a.name} title={a.title} text={a.desc} />
        <section className="card">
          <form
            onSubmit={async (e) => {
              const v = values(e);
              if (!v.input.trim() && !ideaId) {
                ctx.notify('Describe what you are working on, or pick one of your ideas.');
                return;
              }
              const run = await runAgent(ctx, { agent: a.id, input: v.input.trim(), ideaId, goalId: ctx.focus.goalId });
              if (run) {
                setResult(run);
                ctx.notify('Saved to your files.');
              }
            }}
          >
            <Field label="Work on one of your ideas (optional)">
              <select value={ideaId} onChange={(e) => setIdeaId(e.target.value)}>
                <option value="">None, I’ll describe it</option>
                {data.ideas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tell Nova" hint="Nova also reads your profile, quests, customers and past agent work.">
              <textarea name="input" rows={4} maxLength={4000} placeholder={a.ask} />
            </Field>
            <div className="nm-actions">
              <button className="btn primary" disabled={thinking || saving || !ctx.aiReady}>
                <Wand2 size={15} /> {thinking ? 'Working… this can take a minute' : 'Run agent'}
              </button>
              <span className="nm-hint">
                <Clock size={12} /> {a.minutes}
                {a.research && (
                  <>
                    {' '}
                    · <Globe size={12} /> uses live web sources when available
                  </>
                )}
              </span>
            </div>
            {!ctx.aiReady && <p className="nm-hint">Nova is not connected yet. Add an AI provider key to run agents.</p>}
          </form>
        </section>
        {result && <RunView ctx={ctx} run={result} />}
        {!result && pastRuns.length > 0 && (
          <section className="card">
            <h3>Your earlier runs</h3>
            <div className="nm-list">
              {pastRuns.map((r) => (
                <button key={r.id} className="nm-file" onClick={() => setViewing(r)}>
                  <strong>{r.title}</strong>
                  <small>{timeAgo(r.created)}</small>
                </button>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  const shown = group === 'all' ? agents : group === 'mine' ? [] : agents.filter((x) => x.group === group);
  return (
    <>
      <Heading
        eyebrow="PICK WHAT YOU WANT TO GET DONE"
        title="Agents"
        text="Nova runs a focused job on your idea or project. Each result is saved to your files, so nothing gets lost in a chat."
      />
      <div className="toolbar">
        <Tabs
          value={group}
          onChange={setGroup}
          items={[{ id: 'all' as const, label: 'All' }, ...agentGroups.map((g) => ({ id: g.id, label: g.label })), { id: 'mine' as const, label: 'My runs', count: data.runs.length }]}
        />
      </div>
      {group === 'mine' ? (
        <div className="nm-list">
          {data.runs.map((r) => (
            <button key={r.id} className="card nm-file" onClick={() => setViewing(r)}>
              <span className="badge lavender">{agentById(r.agent)?.name || 'AGENT'}</span>
              <strong>{r.title}</strong>
              <small>{timeAgo(r.created)}</small>
            </button>
          ))}
          {!data.runs.length && (
            <section className="card">
              <div className="empty">
                <Wand2 size={30} />
                <h3>No runs yet.</h3>
                <p>Pick an agent to start. Results land here and in your project files.</p>
              </div>
            </section>
          )}
        </div>
      ) : (
        agentGroups
          .filter((g) => group === 'all' || g.id === group)
          .map((g) => (
            <div key={g.id} className="nm-group">
              <h4 className="nm-group-title">
                0{agentGroups.findIndex((x) => x.id === g.id) + 1} · {g.title.toUpperCase()}
                <small>{shown.filter((x) => x.group === g.id).length} agents</small>
              </h4>
              <div className="nm-grid">
                {shown
                  .filter((x) => x.group === g.id)
                  .map((x) => (
                    <button key={x.id} className="card nm-agent" onClick={() => setActive(x.id)}>
                      <small>{x.name}</small>
                      <h3>{x.title}</h3>
                      <p>{x.desc}</p>
                      <span className="nm-hint">
                        <Clock size={11} /> {x.minutes} {x.research ? '· web sources' : ''} <ArrowRight size={12} />
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))
      )}
    </>
  );
}
