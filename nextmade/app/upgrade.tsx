'use client';
// NextMade Pro: plan comparison, usage, and the founding-member request (billing is not live yet).
import { useState } from 'react';
import { Check, Crown, Send } from 'lucide-react';
import { compare, limits, proPriceLabel } from './plans';
import { Field, Heading, type Ctx } from './ui';

export default function Upgrade({ ctx }: { ctx: Ctx }) {
  const { plan } = ctx;
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(!!plan.requested);
  const pro = plan.tier === 'pro';
  const l = limits[plan.tier];
  return (
    <>
      <Heading eyebrow="NEXTMADE PRO" title={pro ? 'You’re on Pro' : 'Go further with Pro'} text="More research, more tests in market, and NextMade inside the AI tools you already use." />
      {!plan.ready && plan.loaded && <p className="nb-count">Plans switch on after the 005 database update runs. Until then everyone is on Free.</p>}
      <div className="nb-usage">
        <div className="card">
          <small>NOVA TODAY</small>
          <b>
            {plan.aiToday} / {l.ai}
          </b>
        </div>
        <div className="card">
          <small>RESEARCH THIS MONTH</small>
          <b>
            {plan.researchUsed} / {l.research}
          </b>
        </div>
        <div className="card">
          <small>YOUR PLAN</small>
          <b>{pro ? 'Pro' : 'Free'}</b>
        </div>
      </div>
      <section className="card nb-compare">
        <table className="nm-table">
          <thead>
            <tr>
              <th />
              <th>Free</th>
              <th>
                <Crown size={12} /> Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {compare.map((r) => (
              <tr key={r.feature}>
                <td>{r.feature}</td>
                <td>{r.free}</td>
                <td>
                  <b>{r.pro}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {!pro && (
        <section className="card nb-pro-cta">
          <div>
            <h3>
              <Crown size={16} /> Founding members
            </h3>
            <p>Billing isn’t switched on yet. Ask to join as a founding member and we’ll turn Pro on for your account. {proPriceLabel}.</p>
          </div>
          {sent ? (
            <p className="nb-reply">
              <Check size={14} /> Request received. We’ll switch Pro on and let you know.
            </p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const r = await fetch('/api/plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: String(new FormData(e.currentTarget).get('reason') || '') }),
                  });
                  const b: any = await r.json();
                  if (!r.ok) throw new Error(b.error);
                  setSent(true);
                  ctx.refreshPlan();
                } catch (x) {
                  ctx.notify(x instanceof Error ? x.message : 'Could not send.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="What would you use Pro for? (optional)">
                <textarea name="reason" rows={2} maxLength={1000} />
              </Field>
              <button className="btn primary" disabled={busy}>
                <Send size={15} /> Request founding access
              </button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
