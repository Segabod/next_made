'use client';
import { useEffect, useRef, useState } from 'react';

export default function SignupForm({ slug, cta, question }: { slug: string; cta: string; question: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  if (state === 'done')
    return (
      <div className="op-done">
        <strong>You’re on the list.</strong>
        <p>Thanks. You’ll hear from the founder directly.</p>
      </div>
    );
  return (
    <form
      className="op-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setState('busy');
        setErr('');
        try {
          const r = await fetch('/api/public/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug,
              name: f.get('name'),
              email: f.get('email'),
              answer: f.get('answer') || '',
              website: f.get('website') || '',
              elapsed: Date.now() - started.current,
            }),
          });
          const b: any = await r.json();
          if (!r.ok) throw new Error(b.error);
          setState('done');
        } catch (x) {
          setErr(x instanceof Error ? x.message : 'Something went wrong.');
          setState('idle');
        }
      }}
    >
      <label>
        <span>Name</span>
        <input name="name" required maxLength={120} autoComplete="name" />
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" required maxLength={254} autoComplete="email" />
      </label>
      {question && (
        <label>
          <span>{question}</span>
          <textarea name="answer" rows={3} maxLength={1000} />
        </label>
      )}
      <input className="op-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {err && <p className="op-err">{err}</p>}
      <button disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : cta}</button>
    </form>
  );
}
