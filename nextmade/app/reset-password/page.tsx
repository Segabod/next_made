'use client';
import {useEffect, useState} from 'react';

// Landing page for the password-reset email. Supabase redirects here with a short-lived
// recovery token in the URL fragment; we use it once to set the new password.
export default function ResetPassword() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get('error_description')) setError('This reset link is invalid or has expired. Request a new one from the sign-in page.');
    else if (h.get('access_token') && h.get('type') === 'recovery') setToken(h.get('access_token'));
    else setError('Open this page from the reset link in your email.');
    history.replaceState(null, '', location.pathname);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (f.password !== f.confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/auth/reset', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({token, password: f.password})});
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not update your password.');
      location.assign('/login?reset=1');
    } catch (err: any) { setError(err?.message || 'Could not update your password.'); setBusy(false); }
  }

  return <main style={{maxWidth: 430, margin: '8vh auto', padding: 28}}>
    <p className="eyebrow">NEXTMADE</p>
    <h1 style={{fontFamily: 'Georgia', fontSize: 42, margin: '20px 0'}}>Choose a new password.</h1>
    {token ? <form onSubmit={submit}>
      <label className="field">New password<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/></label>
      <label className="field">Confirm new password<input name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="btn primary full" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
    </form> : <>
      {error && <p role="alert" className="form-error">{error}</p>}
      <p><a href="/login">Back to sign in</a></p>
    </>}
  </main>;
}
