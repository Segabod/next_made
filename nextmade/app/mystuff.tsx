'use client';
// My Stuff: one library for everything saved, researched, pressure-tested and chatted through.
import { useState } from 'react';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { agentById, archetypes } from './catalog';
import { RunView } from './agents';
import { Heading, Markdown, Tabs, timeAgo, type Ctx } from './ui';

type Tab = 'recent' | 'projects' | 'saved' | 'mine' | 'chats' | 'research' | 'fits' | 'roasts' | 'outputs';
const fitAgents = ['founder-fit'];
const roastAgents = ['stress-test', 'should-build'];
const researchAgents = ['competitors'];

export default function MyStuff({ ctx }: { ctx: Ctx }) {
  const { data } = ctx;
  const [tab, setTab] = useState<Tab>('recent');
  const [viewing, setViewing] = useState('');
  const run = data.runs.find((r) => r.id === viewing);
  if (run) return <RunView ctx={ctx} run={run} back={() => setViewing('')} />;

  const runsOf = (ids: string[] | null) => data.runs.filter((r) => (ids ? ids.includes(r.agent) : ![...fitAgents, ...roastAgents, ...researchAgents].includes(r.agent)));
  const reports = data.ideas.filter((i) => i.report);
  type Item = { at: string; kind: string; title: string; open: () => void };
  const recent: Item[] = [
    ...data.runs.map((r) => ({ at: r.created, kind: agentById(r.agent)?.name || 'AGENT', title: r.title, open: () => setViewing(r.id) })),
    ...data.ideas.map((i) => ({ at: i.updated || i.created, kind: i.report ? 'IDEA REPORT' : 'IDEA', title: i.title, open: () => ctx.go('ideas', { ideaId: i.id }) })),
    ...data.goals.map((g) => ({ at: g.created, kind: 'PROJECT', title: g.title, open: () => ctx.go('project', { goalId: g.id }) })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 30);

  const rows = (items: Item[]) =>
    items.length ? (
      <div className="nm-list">
        {items.map((it, i) => (
          <button key={i} className="card nm-file" onClick={it.open}>
            <span className="badge neutral">{it.kind}</span>
            <strong>{it.title}</strong>
            <small>{timeAgo(it.at)}</small>
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
    ) : (
      <section className="card">
        <div className="empty">
          <FolderOpen size={30} />
          <h3>Nothing here yet</h3>
          <p>Start researching, saving or running agents and this will fill up.</p>
          <button className="text-btn" onClick={() => ctx.go('ideas')}>
            Browse ideas <ArrowRight size={13} />
          </button>
        </div>
      </section>
    );
  const runItems = (list: typeof data.runs) => list.map((r) => ({ at: r.created, kind: agentById(r.agent)?.name || 'AGENT', title: r.title, open: () => setViewing(r.id) }));
  const ideaItems = (list: typeof data.ideas) => list.map((i) => ({ at: i.updated || i.created, kind: i.report ? 'REPORT READY' : 'NOT VALIDATED', title: i.title, open: () => ctx.go('ideas', { ideaId: i.id }) }));

  return (
    <>
      <Heading eyebrow="YOUR LIBRARY" title="My stuff" text="Everything you’ve saved, researched, pressure-tested and chatted through." />
      <div className="toolbar nm-scroll-x">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'recent', label: 'Recent' },
            { id: 'projects', label: 'Projects', count: data.goals.length },
            { id: 'saved', label: 'Saved ideas', count: data.ideas.filter((i) => i.origin === 'feed').length },
            { id: 'mine', label: 'My ideas', count: data.ideas.filter((i) => i.origin === 'mine').length },
            { id: 'chats', label: 'Chats', count: data.messages.length ? 1 : 0 },
            { id: 'research', label: 'Research', count: reports.length + runsOf(researchAgents).length },
            { id: 'fits', label: 'Founder fits', count: runsOf(fitAgents).length },
            { id: 'roasts', label: 'Stress tests', count: runsOf(roastAgents).length },
            { id: 'outputs', label: 'Agent outputs', count: runsOf(null).length },
          ]}
        />
      </div>
      {tab === 'recent' && rows(recent)}
      {tab === 'projects' && rows(data.goals.map((g) => ({ at: g.created, kind: g.paused ? 'PAUSED' : g.category.toUpperCase(), title: g.title, open: () => ctx.go('project', { goalId: g.id }) })))}
      {tab === 'saved' && rows(ideaItems(data.ideas.filter((i) => i.origin === 'feed')))}
      {tab === 'mine' && rows(ideaItems(data.ideas.filter((i) => i.origin === 'mine')))}
      {tab === 'research' && rows([...ideaItems(reports), ...runItems(runsOf(researchAgents))].sort((a, b) => b.at.localeCompare(a.at)))}
      {tab === 'fits' && (
        <>
          {data.founder.archetype && (
            <section className="card">
              <small>BUILDER STYLE</small>
              <h3>{archetypes.find((a) => a.id === data.founder.archetype)?.name}</h3>
            </section>
          )}
          {rows(runItems(runsOf(fitAgents)))}
        </>
      )}
      {tab === 'roasts' && rows(runItems(runsOf(roastAgents)))}
      {tab === 'outputs' && rows(runItems(runsOf(null)))}
      {tab === 'chats' &&
        (data.messages.length ? (
          <section className="card nm-chatlog">
            <div className="card-heading">
              <h3>Your conversation with Nova</h3>
              <button className="text-btn" onClick={() => ctx.go('nova')}>
                Continue <ArrowRight size={13} />
              </button>
            </div>
            {data.messages
              .slice(-30)
              .reverse()
              .map((m) => (
                <div key={m.id} className={'nm-msg ' + m.role}>
                  <small>
                    {m.role === 'user' ? 'You' : 'Nova'} · {timeAgo(m.created)}
                  </small>
                  {m.role === 'assistant' ? <Markdown text={m.text} /> : <p>{m.text}</p>}
                </div>
              ))}
          </section>
        ) : (
          rows([])
        ))}
    </>
  );
}
