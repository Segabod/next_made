'use client';
// Shared helpers for the idea-to-business features (ideas, agents, projects, sprint, library).
import { Fragment, useState, type FormEvent, type ReactNode } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { fitWorkspace, localDay, type Idea, type Run, type Source, type Workspace } from './domain';
import { agentById } from './catalog';
import type { PlanInfo } from './plans';

export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();

export type Focus = { ideaId?: string; goalId?: string; agent?: string; tab?: string };
export type AiResult = { text: string; sources: Source[]; researched?: boolean };
export type Ctx = {
  data: Workspace;
  save: (next: Workspace) => Promise<boolean>;
  saving: boolean;
  thinking: boolean;
  aiReady: boolean;
  notify: (text: string) => void;
  formatDate: (d: string) => string;
  go: (page: string, focus?: Focus) => void;
  focus: Focus;
  call: (body: Record<string, unknown>) => Promise<AiResult | null>;
  firstName: string;
  plan: PlanInfo & { requested?: boolean; ready?: boolean };
  refreshPlan: () => void;
};

export const values = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
};

export function parseJson<T = any>(text: string, kind: 'object' | 'array' = 'object'): T | null {
  const m = kind === 'array' ? text.match(/\[[\s\S]*\]/) : text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
);

export function Heading({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="tabs nm-tabs" role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'selected' : ''} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count ? <span className="nm-count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Very small Markdown renderer for Nova output: headings, bullets, numbered lists, tables, bold and links. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else {
      const [, label, href] = t.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
      out.push(
        <a key={k++} href={href} target="_blank" rel="noreferrer noopener">
          {label}
        </a>,
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const level = h[1].length;
      blocks.push(level <= 2 ? <h3 key={i}>{inline(h[2])}</h3> : <h4 key={i}>{inline(h[2])}</h4>);
      i++;
      continue;
    }
    if (/^\s*\|/.test(l)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        i++;
      }
      blocks.push(
        <div className="nm-table-wrap" key={'t' + i}>
          <table className="nm-table">
            <thead>
              <tr>{rows[0]?.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(l)) {
      const ordered = /^\s*\d+[.)]/.test(l);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, ''));
        i++;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List key={'l' + i}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </List>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*([-*•]|\d+[.)])\s+)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={'p' + i}>{inline(para.join(' '))}</p>);
  }
  return <div className="nm-md">{blocks.map((b, j) => <Fragment key={j}>{b}</Fragment>)}</div>;
}

export function Sources({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="nm-sources">
      <small>SOURCES</small>
      <ul>
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer noopener">
              {s.title} <ExternalLink size={11} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {done ? 'Copied' : label}
    </button>
  );
}

/** Run a Nova agent and save its output to the member's files. Returns the saved run, or null. */
export async function runAgent(ctx: Ctx, opts: { agent: string; input: string; ideaId?: string; goalId?: string }): Promise<Run | null> {
  const a = agentById(opts.agent);
  if (!a) return null;
  const r = await ctx.call({ mode: 'agent', agent: a.id, text: opts.input, ideaId: opts.ideaId || undefined });
  if (!r) return null;
  const idea = ctx.data.ideas.find((i) => i.id === opts.ideaId);
  const run: Run = {
    id: uid(),
    agent: a.id,
    title: `${a.title}${idea ? ': ' + idea.title : ''}`.slice(0, 500),
    ideaId: opts.ideaId || '',
    goalId: opts.goalId || idea?.goalId || '',
    input: opts.input.slice(0, 4000),
    output: r.text.slice(0, 20000),
    sources: r.sources.slice(0, 30),
    created: now(),
  };
  const ok = await ctx.save(fitWorkspace({ ...ctx.data, runs: [run, ...ctx.data.runs].slice(0, 150) }));
  return ok ? run : null;
}

/** Bullet items under a "## Commitments" heading, for turning a plan into tasks. */
export function commitmentsFrom(text: string) {
  const m = text.match(/#{1,4}\s*Commitments\s*\n([\s\S]*?)(\n#{1,4}\s|$)/i);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s+/, '').replace(/\*\*/g, '').trim())
    .filter((l) => l && l.length < 400)
    .slice(0, 8);
}

/** Create a quest (project) for an idea, with first steps as dated commitments. */
export function questForIdea(data: Workspace, idea: Idea, steps: string[]): { next: Workspace; goalId: string } {
  const goalId = uid();
  const due = new Date();
  due.setDate(due.getDate() + 30);
  const tasks = steps.slice(0, 6).map((title, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { id: uid(), goalId, title: title.slice(0, 500), due: localDay(d), status: 'planned' as const, created: now() };
  });
  return {
    goalId,
    next: {
      ...data,
      goals: [...data.goals, { id: goalId, title: idea.title, category: 'Start a business', due: localDay(due), why: idea.oneLiner.slice(0, 2000), created: now(), paused: false }],
      tasks: [...data.tasks, ...tasks],
      ideas: data.ideas.map((i) => (i.id === idea.id ? { ...i, status: 'committed' as const, goalId, updated: now() } : i)),
    },
  };
}

export const timeAgo = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (Number.isNaN(s)) return '';
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.round(s / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
