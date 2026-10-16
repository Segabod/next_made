import { z } from 'zod';
export const stages = ['contacted', 'replied', 'call', 'offered', 'paid', 'lost'] as const;
export const stageLabels: Record<(typeof stages)[number], string> = {
  contacted: 'Contacted',
  replied: 'Replied',
  call: 'Call booked',
  offered: 'Offer made',
  paid: 'Paid',
  lost: 'Not now',
};
const short = z.string().max(500),
  id = z.string().min(1).max(100);
const long = z.string().max(20000);
const source = z.object({ title: z.string().max(300), url: z.string().max(2000) });
export const founderStages = ['exploring', 'have-idea', 'building', 'selling'] as const;
export const founderStageLabels: Record<(typeof founderStages)[number], string> = {
  exploring: 'Looking for an idea',
  'have-idea': 'I have an idea',
  building: 'Already building',
  selling: 'Already selling',
};
const founderSchema = z.object({
  edge: z.string().max(2000),
  skills: z.string().max(2000),
  market: z.string().max(1000),
  audience: z.string().max(1000),
  problem: z.string().max(1000),
  stage: z.enum(founderStages),
  hours: z.string().max(60),
  budget: z.string().max(60),
  goal: z.string().max(1000),
  links: z.string().max(1000),
  archetype: z.string().max(40),
  quiz: z.record(z.string().max(40), z.number().min(-5).max(5)).default({}),
});
export const blankFounder: z.infer<typeof founderSchema> = {
  edge: '', skills: '', market: '', audience: '', problem: '', stage: 'exploring', hours: '', budget: '', goal: '', links: '', archetype: '', quiz: {},
};
const ideaSchema = z.object({
  id,
  title: short,
  oneLiner: z.string().max(2000),
  origin: z.enum(['mine', 'feed']),
  status: z.enum(['saved', 'exploring', 'committed', 'dropped']),
  rating: z.enum(['', 'love', 'interesting', 'meh']).default(''),
  report: long.default(''),
  sources: z.array(source).max(30).default([]),
  goalId: z.string().max(100).default(''),
  created: z.string().max(40),
  updated: z.string().max(40),
});
const runSchema = z.object({
  id,
  agent: z.string().max(60),
  title: short,
  ideaId: z.string().max(100),
  goalId: z.string().max(100),
  input: z.string().max(4000),
  output: long,
  sources: z.array(source).max(30).default([]),
  created: z.string().max(40),
});
const feedItemSchema = z.object({
  title: short,
  oneLiner: z.string().max(2000),
  model: z.string().max(120),
  whyYou: z.string().max(1000),
  firstStep: z.string().max(1000),
  score: z.number().min(0).max(10),
});
const sprintSchema = z.object({ started: z.string().max(30), ideaId: z.string().max(100), goalId: z.string().max(100), done: z.array(z.string().max(40)).max(20) });
export type Idea = z.infer<typeof ideaSchema>;
export type Run = z.infer<typeof runSchema>;
export type FeedItem = z.infer<typeof feedItemSchema>;
export type Founder = z.infer<typeof founderSchema>;
export type Source = z.infer<typeof source>;
export const stateSchema = z
  .object({
    profile: z.object({
      name: z.string().max(80),
      path: z.string().max(80),
      style: z.enum(['Supportive', 'Direct', 'Structured']),
      timezone: z.string().max(80),
      reminders: z.boolean(),
      weeklyLetter: z.boolean().default(true),
    }),
    goals: z
      .array(
        z.object({
          id,
          title: short,
          category: short,
          due: z.string().max(30),
          why: z.string().max(2000),
          created: z.string().max(40),
          paused: z.boolean(),
        }),
      )
      .max(100),
    tasks: z
      .array(
        z.object({
          id,
          goalId: id,
          title: short,
          due: z.string().max(30),
          status: z.enum(['planned', 'completed', 'blocked']),
          created: z.string().max(40),
        }),
      )
      .max(1000),
    logs: z
      .array(
        z.object({
          id,
          goalId: z.string().max(100),
          activity: z.string().max(3000),
          learning: z.string().max(3000),
          blocker: z.string().max(2000),
          next: short,
          created: z.string().max(40),
          evidence: z.string().max(2000),
        }),
      )
      .max(1000),
    messages: z
      .array(z.object({ id, role: z.enum(['user', 'assistant']), text: z.string().max(10000), created: z.string().max(40) }))
      .max(200),
    decisions: z
      .array(
        z.object({
          id,
          title: short,
          context: z.string().max(12000),
          advisers: z.array(short).max(8),
          analysis: z.string().max(20000),
          decision: z.string().max(3000),
          action: short,
          due: z.string().max(30),
          approved: z.boolean(),
          created: z.string().max(40),
        }),
      )
      .max(200),
    meetings: z
      .array(
        z.object({
          id,
          title: short,
          notes: z.string().max(20000),
          summary: z.string().max(20000),
          created: z.string().max(40),
          consent: z.boolean(),
        }),
      )
      .max(100),
    offers: z
      .array(
        z.object({
          id,
          title: short,
          audience: z.string().max(2000),
          problem: z.string().max(2000),
          promise: z.string().max(2000),
          price: short,
          proof: z.string().max(2000),
          status: z.enum(['draft', 'testing', 'validated']),
          created: z.string().max(40),
          updated: z.string().max(40),
        }),
      )
      .max(20)
      .default([]),
    contacts: z
      .array(
        z.object({
          id,
          name: z.string().max(120),
          channel: short,
          offerId: z.string().max(100),
          stage: z.enum(stages),
          notes: z.string().max(5000),
          nextStep: short,
          nextDate: z.string().max(30),
          value: z.number().nonnegative().max(10000000),
          created: z.string().max(40),
          updated: z.string().max(40),
        }),
      )
      .max(500)
      .default([]),
    experiments: z
      .array(
        z.object({
          id,
          belief: z.string().max(2000),
          test: z.string().max(2000),
          success: z.string().max(2000),
          due: z.string().max(30),
          status: z.enum(['running', 'validated', 'invalidated', 'inconclusive']),
          result: z.string().max(5000),
          created: z.string().max(40),
          updated: z.string().max(40).default(''),
        }),
      )
      .max(200)
      .default([]),
    challenges: z.array(id).max(100),
    founder: founderSchema.default(blankFounder),
    ideas: z.array(ideaSchema).max(150).default([]),
    runs: z.array(runSchema).max(150).default([]),
    feed: z.object({ day: z.string().max(30), items: z.array(feedItemSchema).max(12) }).default({ day: '', items: [] }),
    sprint: sprintSchema.nullable().default(null),
    bookmarks: z.array(z.string().max(100)).max(300).default([]),
    files: z.array(z.object({ id, name: short, size: z.number().nonnegative(), created: z.string().max(40) })).max(100),
  })
  .strict();
export type Workspace = z.infer<typeof stateSchema>;
export function emptyWorkspace(name = ''): Workspace {
  return {
    profile: { name, path: 'Start a business', style: 'Supportive', timezone: 'America/Toronto', reminders: false, weeklyLetter: true },
    goals: [],
    tasks: [],
    logs: [],
    messages: [],
    decisions: [],
    meetings: [],
    offers: [],
    contacts: [],
    experiments: [],
    challenges: [],
    founder: { ...blankFounder, quiz: {} },
    ideas: [],
    runs: [],
    feed: { day: '', items: [] },
    sprint: null,
    bookmarks: [],
    files: [],
  };
}
/** Fill in fields added after a workspace was first saved, so older saved data keeps working. */
export function normalize(raw: unknown, name = ''): Workspace {
  const base = emptyWorkspace(name);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as any;
  const merged = { ...base, ...r, profile: { ...base.profile, ...(r.profile || {}) }, founder: { ...base.founder, ...(r.founder || {}) } };
  const parsed = stateSchema.safeParse(merged);
  return parsed.success ? parsed.data : (merged as Workspace);
}
export const advisers = [
  {
    id: 'strategy',
    name: 'The Strategist',
    role: 'Strategy & positioning',
    initial: 'S',
    color: '#567c69',
    question: 'Which customer problem is urgent enough to pay for?',
    lens: 'Challenge buyer, positioning, alternatives, demand and assumptions.',
  },
  {
    id: 'innovation',
    name: 'The Architect',
    role: 'Innovation & product',
    initial: 'A',
    color: '#8071a8',
    question: 'What is the simplest way to test this?',
    lens: 'Use first principles, simplify constraints and propose bounded experiments.',
  },
  {
    id: 'finance',
    name: 'The Analyst',
    role: 'Finance & investment',
    initial: 'F',
    color: '#b8874f',
    question: 'What has to be true for the numbers to work?',
    lens: 'Examine transparent unit economics, cash needs and capital milestones; avoid personal investment recommendations.',
  },
  {
    id: 'operations',
    name: 'The Operator',
    role: 'Execution & scale',
    initial: 'O',
    color: '#5c83a2',
    question: 'Can you deliver this consistently?',
    lens: 'Review capacity, dependencies, supply chain, quality and execution.',
  },
  {
    id: 'governance',
    name: 'The Steward',
    role: 'Governance & leadership',
    initial: 'G',
    color: '#aa7477',
    question: 'Who is affected by this decision?',
    lens: 'Examine stakeholder responsibility, access, governance and team alignment.',
  },
  {
    id: 'growth',
    name: 'The Connector',
    role: 'Growth & partnerships',
    initial: 'C',
    color: '#899458',
    question: 'How will your first customers find you?',
    lens: 'Review distribution, partnerships, customer acquisition and retention.',
  },
];
export function progress(s: Workspace, goalId?: string) {
  const ts = s.tasks.filter((t) => !goalId || t.goalId === goalId);
  return { done: ts.filter((t) => t.status === 'completed').length, total: ts.length };
}
export function points(s: Workspace) {
  return (
    s.goals.length * 10 +
    s.tasks.filter((t) => t.status === 'completed').length * 5 +
    s.logs.length * 5 +
    s.decisions.filter((d) => d.approved).length * 10 +
    s.contacts.length * 3 +
    s.contacts.filter((c) => c.stage === 'paid').length * 50 +
    s.experiments.filter((x) => x.status !== 'running').length * 10 +
    (s.runs || []).length * 5 +
    (s.ideas || []).filter((i) => i.report).length * 10
  );
}
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function review(s: Workspace) {
  const cut = Date.now() - 7 * 86400000;
  const logs = s.logs.filter((l) => Date.parse(l.created) >= cut);
  return {
    logs,
    completed: s.tasks.filter((t) => t.status === 'completed'),
    blocked: s.tasks.filter((t) => t.status === 'blocked'),
    next: s.tasks.filter((t) => t.status === 'planned').sort((a, b) => a.due.localeCompare(b.due)),
    learnings: logs.map((l) => l.learning).filter(Boolean),
  };
}

/** Calendar day (YYYY-MM-DD) in a member's timezone; falls back to UTC for unknown zones. */
export function dayIn(timezone: string, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
/** What a member should hear about today: due and overdue commitments, follow-ups and experiment deadlines. */
export function dailyDigest(s: Workspace, today: string) {
  const live = new Set(s.goals.filter((g) => !g.paused).map((g) => g.id));
  const planned = s.tasks.filter((t) => t.status === 'planned' && live.has(t.goalId) && t.due);
  const lastLog = s.logs.reduce((m, l) => (l.created > m ? l.created : m), '');
  const quietDays = lastLog ? Math.floor((Date.parse(today + 'T12:00:00Z') - Date.parse(lastLog)) / 86400000) : null;
  return {
    overdue: planned.filter((t) => t.due < today).sort((a, b) => a.due.localeCompare(b.due)),
    dueToday: planned.filter((t) => t.due === today),
    followUps: s.contacts.filter((c) => c.nextDate && c.nextDate <= today && c.stage !== 'paid' && c.stage !== 'lost'),
    experiments: s.experiments.filter((x) => x.status === 'running' && x.due && x.due <= today),
    quietDays: s.goals.length && quietDays !== null && quietDays >= 3 ? quietDays : null,
  };
}
export function hasDigest(d: ReturnType<typeof dailyDigest>) {
  return d.overdue.length + d.dueToday.length + d.followUps.length + d.experiments.length > 0 || d.quietDays !== null;
}
/** Numbers for the weekly progress letter, covering the 7 days before `now`. */
export function weeklyStats(s: Workspace, now = new Date()) {
  const cut = now.getTime() - 7 * 86400000;
  const inWeek = (iso: string) => {
    const t = Date.parse(iso);
    return !Number.isNaN(t) && t >= cut && t <= now.getTime();
  };
  const r = review(s);
  return {
    checkIns: r.logs.filter((l) => inWeek(l.created)).length,
    learnings: r.learnings.slice(0, 3),
    completed: s.tasks.filter((t) => t.status === 'completed' && t.due && inWeek(t.due + 'T12:00:00Z')).length,
    blocked: r.blocked.slice(0, 3).map((t) => t.title),
    next: r.next.slice(0, 3).map((t) => t.title),
    newContacts: s.contacts.filter((c) => inWeek(c.created)).length,
    conversationsMoved: s.contacts.filter((c) => inWeek(c.updated) && c.stage !== 'contacted').length,
    paid: s.contacts.filter((c) => c.stage === 'paid' && inWeek(c.updated)).length,
    experimentsClosed: s.experiments.filter((x) => x.status !== 'running' && inWeek(x.updated || x.created)).length,
  };
}

/** Days (YYYY-MM-DD, local) on which the member did something, with a count per day. */
export function activityDays(s: Workspace) {
  const map: Record<string, number> = {};
  const add = (iso: string) => {
    if (!iso) return;
    const t = Date.parse(iso.length === 10 ? iso + 'T12:00:00' : iso);
    if (Number.isNaN(t)) return;
    const k = localDay(new Date(t));
    map[k] = (map[k] || 0) + 1;
  };
  s.logs.forEach((l) => add(l.created));
  (s.runs || []).forEach((r) => add(r.created));
  (s.ideas || []).forEach((i) => add(i.updated || i.created));
  s.contacts.forEach((c) => add(c.updated || c.created));
  s.experiments.forEach((x) => add(x.updated || x.created));
  s.decisions.forEach((d) => add(d.created));
  s.goals.forEach((g) => add(g.created));
  return map;
}
/** Consecutive active days ending today (or yesterday, so a streak survives until the day is over). */
export function streak(days: Record<string, number>, today = new Date()) {
  const d = new Date(today);
  if (!days[localDay(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[localDay(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Keep a workspace under the 1 MB storage limit by dropping the oldest agent outputs first. */
export function fitWorkspace(s: Workspace, budget = 900000): Workspace {
  let next = s;
  while (JSON.stringify(next).length > budget && next.runs.length) next = { ...next, runs: next.runs.slice(0, -1) };
  return next;
}
