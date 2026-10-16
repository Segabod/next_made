'use client';
// Project hub: one quest seen as a project, with where you left off, next tasks, activity, files, context and an AI briefing.
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FileText, Flame, Lightbulb, Plus, Wand2 } from 'lucide-react';
import { activityDays, localDay, progress, streak, type Workspace } from './domain';
import { agentById, archetypes } from './catalog';
import { RunView } from './agents';
import { CopyButton, Heading, Tabs, timeAgo, type Ctx } from './ui';

export function Heatmap({ data, weeks = 26 }: { data: Workspace; weeks?: number }) {
  const days = activityDays(data);
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1) - start.getDay());
  const cells: { day: string; n: number }[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = localDay(d);
    cells.push({ day: k, n: days[k] || 0 });
  }
  const level = (n: number) => (n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4);
  const s = streak(days);
  return (
    <div className="nm-heat-wrap">
      <div className="nm-heat-head">
        <span>
          <Flame size={14} /> {s ? `${s}-day streak` : 'Start a streak today'}
        </span>
        <small>Last {Math.round(weeks / 4.3)} months</small>
      </div>
      <div className="nm-heat" style={{ gridTemplateColumns: `repeat(${Math.ceil(cells.length / 7)}, 1fr)` }} role="img" aria-label={`Activity over the last ${weeks} weeks`}>
        {cells.map((c) => (
          <i key={c.day} className={'l' + level(c.n)} title={`${c.day}: ${c.n} action${c.n === 1 ? '' : 's'}`} />
        ))}
      </div>
      <div className="nm-heat-legend">
        <small>Less</small>
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} className={'l' + l} />
        ))}
        <small>More</small>
      </div>
    </div>
  );
}

/** Markdown briefing the member can paste into ChatGPT, Claude or another AI tool. */
export function briefing(data: Workspace, goalId: string) {
  const g = data.goals.find((x) => x.id === goalId);
  if (!g) return '';
  const idea = data.ideas.find((i) => i.goalId === goalId);
  const f = data.founder;
  const arch = archetypes.find((a) => a.id === f.archetype);
  const tasks = data.tasks.filter((t) => t.goalId === goalId);
  const runs = data.runs.filter((r) => r.goalId === goalId || (idea && r.ideaId === idea.id)).slice(0, 6);
  const lastLog = data.logs.find((l) => l.goalId === goalId);
  const lines = [
    `# Project briefing: ${g.title}`,
    `You are helping me build this project. Use this briefing as context. Ask before assuming anything it does not say.`,
    '',
    '## About me',
    f.edge && `- Edge: ${f.edge}`,
    f.skills && `- Strengths: ${f.skills}`,
    arch && `- Builder style: ${arch.name} (${arch.line})`,
    f.hours && `- Time: ${f.hours} hours a week`,
    f.budget && `- Budget: ${f.budget}`,
    f.goal && `- Going for: ${f.goal}`,
    '',
    '## The project',
    `- Goal: ${g.title} (target ${g.due || 'not set'})`,
    g.why && `- Why: ${g.why}`,
    idea?.oneLiner && `- Idea: ${idea.oneLiner}`,
    '',
    '## Where I left off',
    lastLog ? `- ${lastLog.activity}${lastLog.learning ? ` Learned: ${lastLog.learning}` : ''}${lastLog.blocker ? ` Blocked by: ${lastLog.blocker}` : ''}` : '- No check-ins yet.',
    '',
    '## Next tasks',
    ...tasks.filter((t) => t.status !== 'completed').slice(0, 8).map((t) => `- [ ] ${t.title} (due ${t.due || 'n/a'})${t.status === 'blocked' ? ' BLOCKED' : ''}`),
    '',
    '## Done',
    ...tasks.filter((t) => t.status === 'completed').slice(-8).map((t) => `- [x] ${t.title}`),
    '',
    '## Customers so far',
    `- ${data.contacts.length} contacted, ${data.contacts.filter((c) => c.stage === 'paid').length} paid.`,
    ...data.experiments.filter((x) => x.status !== 'running').slice(0, 4).map((x) => `- Experiment: ${x.belief} → ${x.status}`),
    '',
    runs.length ? '## Work so far (summaries)' : '',
    ...runs.map((r) => `### ${r.title}\n${r.output.slice(0, 900)}${r.output.length > 900 ? '…' : ''}`),
  ];
  return lines.filter((l): l is string => typeof l === 'string').join('\n').replace(/\n{3,}/g, '\n\n');
}

export default function Project({ ctx }: { ctx: Ctx }) {
  const { data, save, saving, formatDate } = ctx;
  const g = data.goals.find((x) => x.id === ctx.focus.goalId);
  const [tab, setTab] = useState<'overview' | 'files' | 'context' | 'brief'>((ctx.focus.tab as any) || 'overview');
  const [viewing, setViewing] = useState('');
  if (!g)
    return (
      <section className="card">
        <p>This project no longer exists.</p>
        <button className="text-btn" onClick={() => ctx.go('quests')}>
          Back to quests
        </button>
      </section>
    );
  const idea = data.ideas.find((i) => i.goalId === g.id);
  const tasks = data.tasks.filter((t) => t.goalId === g.id);
  const open = tasks.filter((t) => t.status !== 'completed').sort((a, b) => a.due.localeCompare(b.due));
  const files = data.runs.filter((r) => r.goalId === g.id || (idea && r.ideaId === idea.id));
  const logs = data.logs.filter((l) => l.goalId === g.id);
  const pr = progress(data, g.id);
  const last = logs[0];
  const lastRun = files[0];
  const run = files.find((r) => r.id === viewing);
  const brief = briefing(data, g.id);
  const recent = [
    ...logs.map((l) => ({ at: l.created, kind: 'Check-in', text: l.activity })),
    ...files.map((r) => ({ at: r.created, kind: 'Agent', text: r.title })),
    ...tasks.filter((t) => t.status === 'completed').map((t) => ({ at: t.due, kind: 'Done', text: t.title })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <>
      <button className="text-btn nm-back" onClick={() => ctx.go('quests')}>
        <ArrowLeft size={14} /> All quests
      </button>
      <Heading
        eyebrow={(idea ? 'PROJECT · FROM AN IDEA' : 'PROJECT') + (g.paused ? ' · PAUSED' : '')}
        title={g.title}
        text={g.why || 'Your project space: plan, work and keep context in one place.'}
      />
      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'overview', label: 'Overview' },
            { id: 'files', label: 'Files', count: files.length },
            { id: 'context', label: 'Context' },
            { id: 'brief', label: 'Briefing for your AI' },
          ]}
        />
      </div>
      {tab === 'overview' && (
        <>
          <div className="nm-two">
            <section className="card">
              <small>WHERE YOU LEFT OFF</small>
              <p className="nm-left-off">
                {last
                  ? `${last.activity}${last.next ? ` Next: ${last.next}` : ''}`
                  : lastRun
                    ? `Last ran “${lastRun.title}” ${timeAgo(lastRun.created)}.`
                    : 'Nothing logged yet. Make a check-in after your next work session.'}
              </p>
              <div className="progress-meta">
                <span>
                  {pr.done} / {pr.total} steps
                </span>
                <span>{pr.total ? Math.round((pr.done / pr.total) * 100) : 0}%</span>
              </div>
              <div className="progress-line">
                <span style={{ width: (pr.total ? (pr.done / pr.total) * 100 : 0) + '%' }} />
              </div>
              <div className="nm-actions">
                <button className="btn small" onClick={() => ctx.go('agents', { agent: 'coach', goalId: g.id, ideaId: idea?.id })}>
                  Plan my next step <ArrowRight size={13} />
                </button>
                <button className="btn small" onClick={() => ctx.go('agents', { agent: 'stress-test', goalId: g.id, ideaId: idea?.id })}>
                  I’m stuck
                </button>
              </div>
            </section>
            <section className="card">
              <Heatmap data={data} />
            </section>
          </div>
          <div className="nm-two">
            <section className="card">
              <h3>What’s up next</h3>
              <ol className="nm-next">
                {open.slice(0, 6).map((t) => (
                  <li key={t.id}>
                    <button
                      className="task-check"
                      aria-label={'Complete ' + t.title}
                      disabled={saving}
                      onClick={() => save({ ...data, tasks: data.tasks.map((x) => (x.id === t.id ? { ...x, status: 'completed' } : x)) })}
                    >
                      <Check size={12} />
                    </button>
                    <span>
                      {t.title}
                      <small>
                        {' '}
                        · {formatDate(t.due)}
                        {t.status === 'blocked' ? ' · Blocked' : ''}
                      </small>
                    </span>
                  </li>
                ))}
              </ol>
              {!open.length && <p>No open commitments. Run the 7-day build plan agent to get some.</p>}
            </section>
            <section className="card">
              <h3>Recent activity</h3>
              <ul className="nm-activity">
                {recent.map((r, i) => (
                  <li key={i}>
                    <span className="badge neutral">{r.kind.toUpperCase()}</span> {r.text}
                    <small> · {timeAgo(r.at.length === 10 ? r.at + 'T12:00:00' : r.at)}</small>
                  </li>
                ))}
              </ul>
              {!recent.length && <p>Your check-ins, agent runs and finished tasks will show here.</p>}
            </section>
          </div>
        </>
      )}
      {tab === 'files' &&
        (run ? (
          <RunView ctx={ctx} run={run} back={() => setViewing('')} />
        ) : (
          <div className="nm-list">
            <button className="card nm-file nm-new" onClick={() => ctx.go('agents', { goalId: g.id, ideaId: idea?.id })}>
              <Plus size={16} /> Run an agent for this project
            </button>
            {files.map((r) => (
              <button key={r.id} className="card nm-file" onClick={() => setViewing(r.id)}>
                <FileText size={16} />
                <strong>{r.title}</strong>
                <span className="badge lavender">{agentById(r.agent)?.name || 'AGENT'}</span>
                <small>{timeAgo(r.created)}</small>
              </button>
            ))}
          </div>
        ))}
      {tab === 'context' && (
        <div className="nm-two">
          <section className="card">
            <h3>
              <Lightbulb size={16} /> The idea
            </h3>
            {idea ? (
              <>
                <p>{idea.oneLiner}</p>
                <button className="text-btn" onClick={() => ctx.go('ideas', { ideaId: idea.id })}>
                  Open the idea report <ArrowRight size={13} />
                </button>
              </>
            ) : (
              <p>This quest isn’t linked to an idea. Use “Build this idea” on an idea report to link one.</p>
            )}
          </section>
          <section className="card">
            <h3>About you</h3>
            <p>Nova uses your founder profile on every run for this project.</p>
            <button className="text-btn" onClick={() => ctx.go('about')}>
              Review your profile <ArrowRight size={13} />
            </button>
          </section>
        </div>
      )}
      {tab === 'brief' && (
        <section className="card">
          <div className="card-heading">
            <div>
              <h3>
                <Wand2 size={16} /> Briefing for your AI tool
              </h3>
              <p>Paste this into ChatGPT, Claude, Cursor or any assistant so it starts with your full context instead of a blank chat.</p>
            </div>
            <CopyButton text={brief} label="Copy briefing" />
          </div>
          <pre className="nm-pre">{brief}</pre>
        </section>
      )}
    </>
  );
}
