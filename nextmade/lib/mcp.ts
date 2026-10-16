// Minimal MCP server (Streamable HTTP, JSON responses) for Connect your AI.
// Authenticated by a member's personal key; all data access goes through key-checked database functions.
import { createHash, randomUUID } from 'node:crypto';
import { db } from './backend';
import { normalize, stateSchema, localDay, type Workspace } from '../app/domain';
import { archetypes } from '../app/catalog';

type Json = Record<string, any>;
const VERSION = '2025-06-18';

export const tools = [
  { name: 'get_profile', description: 'The member’s founder profile on NextMade: skills, edge, market, audience, stage, time, budget, goals and builder style.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'browse_catalog',
    description: 'Search NextMade’s researched catalog of startup ideas, rising trends and customer niches. Returns summaries with scores.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['idea', 'trend', 'niche'], description: 'Optional: only this kind' },
        query: { type: 'string', description: 'Optional keywords' },
        limit: { type: 'number', description: '1-25, default 10' },
      },
    },
  },
  { name: 'get_catalog_entry', description: 'The full research for one catalog entry (report, scores, sources).', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'list_my_ideas', description: 'The member’s saved ideas with status and whether a validation report exists.', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_my_idea', description: 'One of the member’s ideas, including its validation report.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'list_projects', description: 'The member’s projects (quests) with progress and the next open commitments.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'get_project',
    description: 'One project: why it matters, all commitments, recent progress notes and agent work.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'add_idea',
    description: 'Save a new idea to the member’s NextMade ideas. Only do this when the member asks.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title', 'description'] },
  },
  {
    name: 'add_commitment',
    description: 'Add a dated commitment (task) to one of the member’s projects. Only do this when the member asks.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' }, title: { type: 'string' }, due: { type: 'string', description: 'YYYY-MM-DD, default tomorrow' } },
      required: ['project_id', 'title'],
    },
  },
  {
    name: 'log_progress',
    description: 'Record a progress note in the member’s journal. Only do this when the member asks.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' }, activity: { type: 'string' }, learning: { type: 'string' }, next: { type: 'string' } },
      required: ['activity'],
    },
  },
];

export const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');
const rpc = (name: string, args: Json) => db('rpc/' + name, 'POST', args, '');
const text = (value: unknown) => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const fail = (message: string) => ({ content: [{ type: 'text', text: message }], isError: true });
const s = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

async function workspace(k: string): Promise<{ ws: Workspace; revision: number } | null> {
  const r = await rpc('mcp_workspace', { k });
  if (!r) return null;
  return { ws: normalize(r.data), revision: r.revision };
}

async function write(k: string, change: (ws: Workspace) => Workspace | string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = await workspace(k);
    if (!cur) return fail('This key is no longer valid.');
    if (cur.revision < 0) return fail('Open NextMade once in the browser to create the workspace first.');
    const next = change(cur.ws);
    if (typeof next === 'string') return fail(next);
    const parsed = stateSchema.safeParse(next);
    if (!parsed.success) return fail('That change would make the workspace invalid (check lengths).');
    const saved = await rpc('mcp_save_workspace', { k, payload: parsed.data, expected_revision: cur.revision });
    if (saved !== null) return null;
  }
  return fail('The workspace changed at the same time. Please try again.');
}

async function call(k: string, name: string, a: Json) {
  const ts = new Date().toISOString();
  switch (name) {
    case 'get_profile': {
      const cur = await workspace(k);
      if (!cur) return fail('This key is no longer valid.');
      const f = cur.ws.founder;
      const arch = archetypes.find((x) => x.id === f.archetype);
      return text({ name: cur.ws.profile.name, path: cur.ws.profile.path, founder: { ...f, quiz: undefined, archetype: arch ? `${arch.name}: ${arch.line}` : '' } });
    }
    case 'browse_catalog': {
      const rows = await rpc('mcp_catalog', { k, want_kind: s(a.kind, 10), q: s(a.query, 100), lim: Number(a.limit) || 10 });
      return rows === null ? fail('This key is no longer valid.') : text(rows);
    }
    case 'get_catalog_entry': {
      if (!/^[0-9a-f-]{36}$/i.test(String(a.id))) return fail('Unknown id.');
      const row = await rpc('mcp_catalog_entry', { k, entry_id: a.id });
      return row ? text(row) : fail('Not found.');
    }
    case 'list_my_ideas': {
      const cur = await workspace(k);
      if (!cur) return fail('This key is no longer valid.');
      return text(cur.ws.ideas.map((i) => ({ id: i.id, title: i.title, oneLiner: i.oneLiner, status: i.status, hasReport: !!i.report, projectId: i.goalId || undefined })));
    }
    case 'get_my_idea': {
      const cur = await workspace(k);
      const i = cur?.ws.ideas.find((x) => x.id === a.id);
      return i ? text({ ...i, report: (() => { try { return JSON.parse(i.report); } catch { return i.report; } })() }) : fail('Idea not found.');
    }
    case 'list_projects': {
      const cur = await workspace(k);
      if (!cur) return fail('This key is no longer valid.');
      return text(
        cur.ws.goals.map((g) => {
          const t = cur.ws.tasks.filter((x) => x.goalId === g.id);
          return {
            id: g.id,
            title: g.title,
            due: g.due,
            paused: g.paused,
            done: t.filter((x) => x.status === 'completed').length,
            total: t.length,
            next: t.filter((x) => x.status === 'planned').sort((x, y) => x.due.localeCompare(y.due)).slice(0, 3).map((x) => ({ title: x.title, due: x.due })),
          };
        }),
      );
    }
    case 'get_project': {
      const cur = await workspace(k);
      const g = cur?.ws.goals.find((x) => x.id === a.id);
      if (!cur || !g) return fail('Project not found.');
      return text({
        ...g,
        commitments: cur.ws.tasks.filter((x) => x.goalId === g.id).map((x) => ({ title: x.title, due: x.due, status: x.status })),
        recentProgress: cur.ws.logs.filter((l) => l.goalId === g.id).slice(0, 10).map((l) => ({ when: l.created, activity: l.activity, learning: l.learning, blocker: l.blocker, next: l.next })),
        agentWork: cur.ws.runs.filter((r) => r.goalId === g.id).slice(0, 8).map((r) => ({ title: r.title, when: r.created, excerpt: r.output.slice(0, 800) })),
      });
    }
    case 'add_idea': {
      const title = s(a.title, 200);
      const oneLiner = s(a.description, 2000);
      if (!title || !oneLiner) return fail('Give the idea a title and a description.');
      const id = randomUUID();
      const err = await write(k, (ws) => ({ ...ws, ideas: [{ id, title, oneLiner, origin: 'mine' as const, status: 'saved' as const, rating: '' as const, report: '', sources: [], goalId: '', created: ts, updated: ts }, ...ws.ideas].slice(0, 150) }));
      return err || text({ saved: true, id, note: 'Saved to My ideas in NextMade. Open it there to run a validation report.' });
    }
    case 'add_commitment': {
      const title = s(a.title, 500);
      const tomorrow = new Date(Date.now() + 86400000);
      const due = /^\d{4}-\d{2}-\d{2}$/.test(String(a.due)) ? String(a.due) : localDay(tomorrow);
      if (!title) return fail('Describe the commitment.');
      const err = await write(k, (ws) =>
        ws.goals.some((g) => g.id === a.project_id)
          ? ws.tasks.length >= 1000
            ? 'Too many commitments already.'
            : { ...ws, tasks: [...ws.tasks, { id: randomUUID(), goalId: String(a.project_id), title, due, status: 'planned' as const, created: ts }] }
          : 'Project not found.',
      );
      return err || text({ saved: true, title, due });
    }
    case 'log_progress': {
      const activity = s(a.activity, 3000);
      if (!activity) return fail('Describe what was done.');
      const err = await write(k, (ws) => ({
        ...ws,
        logs: [
          { id: randomUUID(), goalId: ws.goals.some((g) => g.id === a.project_id) ? String(a.project_id) : '', activity, learning: s(a.learning, 3000), blocker: '', next: s(a.next, 500), created: ts, evidence: '' },
          ...ws.logs,
        ].slice(0, 1000),
      }));
      return err || text({ saved: true });
    }
    default:
      return fail('Unknown tool: ' + name);
  }
}

async function one(k: string, msg: Json): Promise<Json | null> {
  const id = msg?.id;
  const isNote = id === undefined || id === null;
  const reply = (result: Json) => ({ jsonrpc: '2.0', id, result });
  const error = (code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return error(-32600, 'Invalid request');
  if (isNote) return null;
  switch (msg.method) {
    case 'initialize':
      return reply({
        protocolVersion: typeof msg.params?.protocolVersion === 'string' ? msg.params.protocolVersion : VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'nextmade', version: '1.0.0' },
        instructions:
          'NextMade is the member’s idea-to-first-customer workspace. Use get_profile to tailor advice. Read freely; only write (add_idea, add_commitment, log_progress) when the member asks. Catalog research is AI-generated: treat scores as judgements and cite sources.',
      });
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools });
    case 'tools/call':
      try {
        return reply(await call(k, String(msg.params?.name || ''), msg.params?.arguments || {}));
      } catch {
        return reply(fail('NextMade could not complete this request. Try again shortly.'));
      }
    default:
      return error(-32601, 'Method not found');
  }
}

export async function handleMcp(req: Request, key: string | null) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version', 'Cache-Control': 'no-store' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  if (req.method !== 'POST') return new Response('Use POST for MCP requests.', { status: 405, headers: { ...cors, Allow: 'POST, OPTIONS' } });
  if (!key || !/^nm_[A-Za-z0-9_-]{30,60}$/.test(key))
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Add your NextMade key as a Bearer token.' } }, { status: 401, headers: { ...cors, 'WWW-Authenticate': 'Bearer' } });
  const k = hashKey(key);
  let ws: unknown;
  try {
    ws = await rpc('mcp_workspace', { k });
  } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32603, message: 'NextMade is unavailable.' } }, { status: 503, headers: cors });
  }
  if (!ws) return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'This key is invalid, revoked, or the account is not on Pro.' } }, { status: 401, headers: cors });
  let msg: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 100000) throw new Error();
    msg = JSON.parse(raw);
  } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers: cors });
  }
  const batch = Array.isArray(msg) ? msg.slice(0, 20) : [msg];
  const out = (await Promise.all(batch.map((m) => one(k, m as Json)))).filter(Boolean);
  if (!out.length) return new Response(null, { status: 202, headers: cors });
  return Response.json(Array.isArray(msg) ? out : out[0], { headers: cors });
}
