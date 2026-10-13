'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Users, Plus, ArrowLeft, Copy, RefreshCw, Send } from 'lucide-react';
type Circle = { id: string; title: string; description: string; code: string; members: number; isOwner: boolean };
export default function Circles({ name }: { name: string }) {
  const [circles, setCircles] = useState<Circle[]>([]),
    [active, setActive] = useState<Circle | null>(null),
    [posts, setPosts] = useState<any[]>([]),
    [members, setMembers] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [confirm, setConfirm] = useState(false);
  async function request(path: string, body?: unknown) {
    const r = await fetch(
      path,
      body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined,
    );
    const b: any = await r.json();
    if (!r.ok) throw new Error(b.error || 'Could not load this circle.');
    return b;
  }
  async function load(circle?: Circle) {
    setError('');
    try {
      const b = await request(circle ? '/api/circles?id=' + circle.id : '/api/circles');
      if (circle) {
        setPosts(b.posts);
        setMembers(b.members);
      } else setCircles(b.circles);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed.');
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function act(body: unknown, after?: () => void) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await request('/api/circles', body);
      await load();
      if (active) await load(active);
      after?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const form = e.currentTarget,
      f = Object.fromEntries(new FormData(form));
    act({ ...f, action, name: name || 'Member' }, () => form.reset());
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SHOW UP TOGETHER</p>
          <h2>Accountability circles</h2>
          <p>Small groups. Honest updates. Shared momentum.</p>
        </div>
        <button className="btn" onClick={() => load(active || undefined)} disabled={busy}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
      <p className="connection-note">
        Circle posts are shared with circle members. Your quests, Nova conversations and journal stay private. Invite codes work for people
        who already have access to this site.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {active ? (
        <>
          <button
            className="text-btn"
            onClick={() => {
              setActive(null);
              setConfirm(false);
              setNotice('');
            }}
          >
            <ArrowLeft size={15} />
            All circles
          </button>
          <section className="card">
            <div className="card-heading">
              <h3>{active.title}</h3>
              <span className="badge sage">{members.length} / 6 members</span>
            </div>
            <p>{active.description}</p>
            <p className="muted">Members: {members.map((m) => m.name).join(', ')}</p>
            <button
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(active.code);
                  setNotice('Invite code copied. Share it with someone who has site access.');
                } catch {
                  setNotice('Invite code: ' + active.code);
                }
              }}
            >
              <Copy size={15} />
              Copy invite code
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  f = new FormData(form);
                act({ action: 'post', circleId: active.id, text: f.get('text') }, () => form.reset());
              }}
            >
              <label className="field">
                What did you do, what did you learn, and what comes next?
                <textarea name="text" rows={3} maxLength={3000} required placeholder="Share an honest check-in with your circle." />
              </label>
              <button className="btn primary" disabled={busy}>
                <Send size={15} />
                Share with my circle
              </button>
            </form>
          </section>
          {posts.length ? (
            posts.map((p) => (
              <article className="card" key={p.id}>
                <div className="card-heading">
                  <strong>{p.name}</strong>
                  <small>{new Date(p.created).toLocaleString()}</small>
                </div>
                <p className="pre-wrap">{p.text}</p>
              </article>
            ))
          ) : (
            <section className="card empty">
              <Users size={30} />
              <h3>Start the conversation.</h3>
              <p>Your first shared check-in will appear here.</p>
            </section>
          )}
          <section className="card">
            <button className="text-btn danger" onClick={() => setConfirm(!confirm)}>
              {active.isOwner ? 'Delete this circle' : 'Leave this circle'}
            </button>
            {confirm && (
              <>
                <p>
                  {active.isOwner
                    ? 'This deletes the circle and all member posts.'
                    : 'This removes your membership and posts from this circle.'}{' '}
                  This cannot be undone.
                </p>
                <button
                  className="btn destructive"
                  disabled={busy}
                  onClick={() =>
                    act({ action: active.isOwner ? 'delete' : 'leave', circleId: active.id }, () => {
                      setActive(null);
                      setConfirm(false);
                    })
                  }
                >
                  Confirm {active.isOwner ? 'deletion' : 'leave'}
                </button>
              </>
            )}
          </section>
        </>
      ) : (
        <>
          <div className="quest-grid">
            {circles.map((c) => (
              <button
                className="card quest-card"
                key={c.id}
                onClick={() => {
                  setActive(c);
                  load(c);
                }}
              >
                <Users size={24} />
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <span className="badge sage">{c.members} / 6 members</span>
              </button>
            ))}
          </div>
          <div className="settings-grid">
            <section className="card">
              <h3>Create a circle</h3>
              <p>Invite up to five people to share regular progress.</p>
              <form onSubmit={(e) => submit(e, 'create')}>
                <label className="field">
                  Circle name
                  <input name="title" required maxLength={100} placeholder="e.g. Our first customer" />
                </label>
                <label className="field">
                  What will you work toward?
                  <textarea name="description" maxLength={1000} rows={2} />
                </label>
                <button className="btn primary" disabled={busy}>
                  <Plus size={15} />
                  Create circle
                </button>
              </form>
            </section>
            <section className="card">
              <h3>Join a circle</h3>
              <p>Enter an invite code shared by a circle member.</p>
              <form onSubmit={(e) => submit(e, 'join')}>
                <label className="field">
                  Invite code
                  <input name="code" required maxLength={100} />
                </label>
                <button className="btn" disabled={busy}>
                  Join circle
                </button>
              </form>
            </section>
          </div>
        </>
      )}
    </>
  );
}
