'use client';
// Connect your AI: personal keys and setup steps for MCP clients (Pro).
import { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Lock, Plug, Trash2 } from 'lucide-react';
import { CopyButton, Field, Heading, timeAgo, type Ctx } from './ui';

type Key = { id: string; name: string; prefix: string; created: string; last_used: string | null };

const can = [
  ['Know who you are', 'Your founder profile, so answers fit your skills, time and goals.'],
  ['Browse the catalog', 'Ideas, trends and niches, filtered the way you ask.'],
  ['Read full research', 'Scores, competitors, demand and sources for any entry.'],
  ['Work in your projects', 'Read commitments and progress, and add new ones when you ask.'],
  ['Save ideas', 'Capture an idea from any chat straight into My ideas.'],
  ['Log progress', 'Record what you did today without leaving your editor.'],
];
const prompts = [
  'Show me today’s NextMade idea and tell me if it fits me.',
  'Find three B2B ideas with high pain I could start with a small budget.',
  'Open my latest project and tell me what to do next.',
  'Log that I interviewed two customers today and learned pricing is the blocker.',
];

export default function Connect({ ctx }: { ctx: Ctx }) {
  const pro = ctx.plan.tier === 'pro';
  const [keys, setKeys] = useState<Key[]>([]);
  const [fresh, setFresh] = useState('');
  const [busy, setBusy] = useState(false);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const url = origin + '/api/mcp';

  async function load() {
    const r = await fetch('/api/keys');
    const b: any = await r.json().catch(() => ({}));
    if (r.ok) setKeys(b.keys);
  }
  useEffect(() => {
    if (pro) load();
  }, [pro]);
  async function post(body: unknown) {
    setBusy(true);
    try {
      const r = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      return b;
    } catch (e) {
      ctx.notify(e instanceof Error ? e.message : 'Something went wrong.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const k = fresh || 'nm_YOUR_KEY';
  const claudeCode = `claude mcp add --transport http nextmade ${url} --header "Authorization: Bearer ${k}"`;
  const json = JSON.stringify({ mcpServers: { nextmade: { url, headers: { Authorization: `Bearer ${k}` } } } }, null, 2);
  const urlOnly = `${url}/${k}`;

  return (
    <>
      <Heading eyebrow="USE NEXTMADE FROM ANY AI" title="Connect your AI" text="Use NextMade from the assistant you already work in. Your profile, ideas, research and projects come with you." />
      <section className="card nb-connect-steps">
        {[
          ['1', 'Create your key', 'One click. It links your assistant to your account.'],
          ['2', 'Add it to your assistant', 'Copy the setup for Claude, Cursor or any MCP client.'],
          ['3', 'Ask it anything', 'It pulls from NextMade whenever it needs to.'],
        ].map(([nr, t, d]) => (
          <div key={nr}>
            <span className="nb-step">{nr}</span>
            <strong>{t}</strong>
            <p>{d}</p>
          </div>
        ))}
      </section>

      {!pro ? (
        <section className="card nb-locked">
          <Lock size={22} />
          <div>
            <h3>Connecting an AI tool is part of Pro.</h3>
            <p>Works with Claude, Cursor, Windsurf, VS Code and anything else that supports MCP.</p>
          </div>
          <button className="btn primary" onClick={() => ctx.go('upgrade')}>
            See Pro <ArrowRight size={15} />
          </button>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="card-heading">
              <h3>
                <KeyRound size={15} /> Your keys
              </h3>
            </div>
            <form
              className="nb-inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const name = String(new FormData(e.currentTarget).get('name') || '');
                const b = await post({ action: 'create', name });
                if (b?.key) {
                  setFresh(b.key);
                  (e.target as HTMLFormElement).reset();
                  load();
                }
              }}
            >
              <Field label="Key name">
                <input name="name" required maxLength={60} placeholder="e.g. Claude on my laptop" />
              </Field>
              <button className="btn primary" disabled={busy || keys.length >= 5}>
                Create key
              </button>
            </form>
            {fresh && (
              <div className="nb-fresh">
                <p>
                  <b>Copy this key now.</b> It won’t be shown again. Anyone with it can read and add to your workspace, so keep it private.
                </p>
                <code>{fresh}</code>
                <CopyButton text={fresh} label="Copy key" />
              </div>
            )}
            {keys.map((x) => (
              <div className="nb-key" key={x.id}>
                <Plug size={14} />
                <div>
                  <strong>{x.name}</strong>
                  <small>
                    {x.prefix}… · created {timeAgo(x.created)} · {x.last_used ? 'last used ' + timeAgo(x.last_used) : 'never used'}
                  </small>
                </div>
                <button
                  className="icon-btn"
                  aria-label={'Revoke ' + x.name}
                  disabled={busy}
                  onClick={async () => {
                    if (confirm('Revoke this key? Assistants using it will lose access.') && (await post({ action: 'revoke', id: x.id }))) load();
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </section>
          <section className="card">
            <h3>Setup</h3>
            <small className="nb-label">CLAUDE CODE</small>
            <pre className="nm-pre">{claudeCode}</pre>
            <CopyButton text={claudeCode} />
            <small className="nb-label">CLAUDE DESKTOP, CURSOR, WINDSURF, VS CODE (MCP CONFIG)</small>
            <pre className="nm-pre">{json}</pre>
            <CopyButton text={json} />
            <small className="nb-label">APPS THAT ONLY ACCEPT A URL (CUSTOM CONNECTORS)</small>
            <pre className="nm-pre">{urlOnly}</pre>
            <CopyButton text={urlOnly} />
            <p className="nm-hint">This URL contains your key. Treat it like a password and revoke the key if it is ever shared.</p>
          </section>
        </>
      )}

      <div className="nm-grid">
        {can.map(([t, d]) => (
          <section className="card" key={t}>
            <strong>{t}</strong>
            <p>{d}</p>
          </section>
        ))}
      </div>
      <section className="card">
        <small className="nb-label">TRY ASKING</small>
        {prompts.map((p) => (
          <div className="nb-key" key={p}>
            <span>“{p}”</span>
            <CopyButton text={p} />
          </div>
        ))}
      </section>
    </>
  );
}
