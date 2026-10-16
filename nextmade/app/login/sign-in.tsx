'use client';
import {useEffect, useState} from 'react';

type Mode = 'signin' | 'signup' | 'forgot';

async function post(path: string, data: unknown) {
  const r = await fetch(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(b.error || 'Something went wrong. Please try again.'), {code: b.code});
  return b;
}

const linkBtn: React.CSSProperties = {background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit'};

export default function Login({ready}: {ready: boolean}) {
  const [mode, setMode] = useState<Mode>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.get('error_description')) setError(hash.get('error_code') === 'otp_expired' ? 'That link has expired. Sign in to request a new confirmation email.' : hash.get('error_description')!.replace(/\+/g, ' '));
    else if (q.get('confirmed')) setNotice('Your email is confirmed. Sign in to enter NextMade.');
    else if (q.get('reset')) setNotice('Your password was updated. Sign in with your new password.');
    // Drop any tokens Supabase appended to the URL; sign-in creates the real session.
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }, []);

  const switchTo = (m: Mode) => { setMode(m); setError(''); setNotice(''); setNeedsConfirm(false); };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true); setError(''); setNotice(''); setNeedsConfirm(false);
    try {
      if (mode === 'signin') {
        await post('/api/auth/login', {email: f.email, password: f.password});
        const next = new URLSearchParams(location.search).get('next') || '/workspace';
        const u = new URL(next, location.origin);
        location.assign(u.origin === location.origin ? u.pathname + u.search : '/workspace');
        return;
      }
      if (mode === 'signup') {
        if (f.password !== f.confirm) throw new Error('The two passwords do not match.');
        const res: any = await post('/api/auth/signup', {name: f.name, email: f.email, password: f.password});
        if (res?.signedIn) { location.assign('/workspace'); return; }
        setPendingEmail(f.email);
        setMode('signin');
        setNotice(res?.confirm === false ? 'Your account is ready. Sign in to enter NextMade.' : `Almost there. We sent a confirmation link to ${f.email}. Open it, then sign in here.`);
        return;
      }
      await post('/api/auth/recover', {email: f.email});
      setMode('signin');
      setNotice(`If an account exists for ${f.email}, a password reset link is on its way.`);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
      if (err?.code === 'email_not_confirmed') { setPendingEmail(f.email); setNeedsConfirm(true); }
    } finally { setBusy(false); }
  }

  async function resend() {
    if (!pendingEmail) return;
    setBusy(true); setError('');
    try { await post('/api/auth/resend', {email: pendingEmail}); setNeedsConfirm(false); setNotice(`A new confirmation link was sent to ${pendingEmail}.`); }
    catch (err: any) { setError(err?.message || 'Could not resend the email.'); }
    finally { setBusy(false); }
  }

  const title = mode === 'signup' ? 'Start your next chapter.' : mode === 'forgot' ? 'Reset your password.' : 'Welcome back.';
  const intro = mode === 'signup' ? 'Create your free NextMade account and start right away.' : mode === 'forgot' ? 'Enter your account email and we will send you a reset link.' : 'Sign in to enter your NextMade workspace.';
  const action = mode === 'signup' ? (busy ? 'Creating account…' : 'Create account') : mode === 'forgot' ? (busy ? 'Sending…' : 'Send reset link') : (busy ? 'Signing in…' : 'Enter NextMade');

  return <main style={{maxWidth: 430, margin: '8vh auto', padding: 28}}>
    <p className="eyebrow">NEXTMADE</p>
    <h1 style={{fontFamily: 'Georgia', fontSize: 42, margin: '20px 0'}}>{title}</h1>
    <p>{intro}</p>
    {!ready && <p className="connection-note">The deployment needs its Supabase configuration before accounts are available.</p>}
    {notice && <p role="status" className="connection-note">{notice}</p>}
    <form key={mode} onSubmit={submit}>
      {mode === 'signup' && <label className="field">Your name<input name="name" autoComplete="name" required maxLength={80}/></label>}
      <label className="field">Email<input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={mode === 'signin' ? pendingEmail : undefined}/></label>
      {mode !== 'forgot' && <label className="field">Password<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : 1} maxLength={72}/></label>}
      {mode === 'signup' && <label className="field">Confirm password<input name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/></label>}
      {error && <p role="alert" className="form-error">{error}</p>}
      {needsConfirm && <p style={{fontSize: 14}}><button type="button" style={linkBtn} onClick={resend} disabled={busy}>Resend the confirmation email</button></p>}
      <button className="btn primary full" disabled={!ready || busy}>{action}</button>
    </form>
    <p style={{marginTop: 24, fontSize: 14, display: 'flex', gap: 16, flexWrap: 'wrap'}}>
      {mode !== 'signin' && <button type="button" style={linkBtn} onClick={() => switchTo('signin')}>I already have an account</button>}
      {mode !== 'signup' && <button type="button" style={linkBtn} onClick={() => switchTo('signup')}>Create an account</button>}
      {mode === 'signin' && <button type="button" style={linkBtn} onClick={() => switchTo('forgot')}>Forgot password?</button>}
    </p>
    <p style={{marginTop: 16, fontSize: 12}}>Sessions last up to one hour. You can sign in again when a session expires.</p>
  </main>;
}
