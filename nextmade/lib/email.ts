// Email delivery through Resend, plus the reminder and weekly-letter templates.
import { dailyDigest, stageLabels, weeklyStats } from '../app/domain';
import { appOriginSetting } from './backend';

export const emailReady = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(opts: { to: string; subject: string; html: string; text: string; idempotencyKey?: string }) {
  const key = process.env.RESEND_API_KEY,
    from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error('Email is not configured (RESEND_API_KEY and EMAIL_FROM).');
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey.slice(0, 256);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error(`Resend returned ${r.status}: ${detail.slice(0, 300)}`);
  }
  return r.json();
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const origin = () => appOriginSetting().replace(/\/$/, '');

function layout(title: string, blocks: string[], cta: { label: string; href: string }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Georgia,serif;color:#253229">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font:600 12px/1 Arial,sans-serif;letter-spacing:.12em;color:#567c69;margin:0 0 18px">NEXTMADE</p>
<h1 style="font-size:28px;font-weight:400;margin:0 0 20px">${esc(title)}</h1>
${blocks.join('\n')}
<p style="margin:28px 0"><a href="${cta.href}" style="background:#2f4a3c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font:600 14px Arial,sans-serif">${esc(cta.label)}</a></p>
<p style="font:12px/1.5 Arial,sans-serif;color:#7a8580">You get this because email reminders are on in your NextMade settings. <a href="${origin()}/workspace" style="color:#567c69">Change your email settings</a>.</p>
</div></body></html>`;
  return html;
}
const section = (heading: string, items: string[]) =>
  items.length
    ? `<h3 style="font:600 14px Arial,sans-serif;margin:22px 0 8px">${esc(heading)}</h3><ul style="font:15px/1.6 Arial,sans-serif;padding-left:20px;margin:0">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : '';
const textSection = (heading: string, items: string[]) => (items.length ? `\n${heading}\n${items.map((i) => '- ' + i).join('\n')}\n` : '');

type Ws = Parameters<typeof dailyDigest>[0];

export function dailyEmail(ws: Ws, today: string, firstName: string) {
  const d = dailyDigest(ws, today);
  const parts: [string, string[]][] = [
    ['Due today', d.dueToday.map((t) => t.title)],
    ['Overdue', d.overdue.map((t) => `${t.title} (was due ${t.due})`)],
    ['Customer follow-ups', d.followUps.map((c) => `${c.name}: ${c.nextStep || 'follow up'} (${stageLabels[c.stage]})`)],
    ['Experiments to review', d.experiments.map((x) => x.belief)],
  ];
  const count = d.dueToday.length + d.overdue.length + d.followUps.length + d.experiments.length;
  const subject = count ? `${count} thing${count === 1 ? '' : 's'} for today, ${firstName}` : `A small step today, ${firstName}?`;
  const intro =
    d.quietDays !== null && !count
      ? `It has been ${d.quietDays} days since your last check-in. One honest note about what you did, even if small, keeps the momentum going.`
      : 'Here is what is waiting for you today. Pick one and make it happen.';
  const html = layout(
    count ? 'Your next steps for today' : 'Keep the momentum going',
    [`<p style="font:16px/1.6 Arial,sans-serif;margin:0">${esc(intro)}</p>`, ...parts.map(([h, i]) => section(h, i))],
    { label: 'Open my workspace', href: origin() + '/workspace' },
  );
  const text = `${intro}\n${parts.map(([h, i]) => textSection(h, i)).join('')}\nOpen your workspace: ${origin()}/workspace`;
  return { subject, html, text };
}

export function weeklyEmail(ws: Ws, firstName: string, novaNote?: string, now = new Date()) {
  const s = weeklyStats(ws, now);
  const numbers = [
    `${s.checkIns} check-in${s.checkIns === 1 ? '' : 's'} recorded`,
    `${s.completed} commitment${s.completed === 1 ? '' : 's'} completed`,
    `${s.newContacts} new customer conversation${s.newContacts === 1 ? '' : 's'} started, ${s.conversationsMoved} moved forward`,
    ...(s.paid ? [`${s.paid} paying customer${s.paid === 1 ? '' : 's'} this week`] : []),
    `${s.experimentsClosed} experiment${s.experimentsClosed === 1 ? '' : 's'} concluded`,
  ];
  const subject = s.paid ? `Your week: ${s.paid} paying customer${s.paid === 1 ? '' : 's'}!` : `Your week in NextMade, ${firstName}`;
  const blocks = [
    novaNote ? `<p style="font:16px/1.6 Arial,sans-serif;margin:0;padding:14px 16px;background:#fff;border-radius:12px"><strong>Nova:</strong> ${esc(novaNote)}</p>` : '',
    section('This week', numbers),
    section('What you learned', s.learnings),
    section('Still blocked', s.blocked),
    section('Coming up next', s.next),
  ];
  const html = layout('Your weekly progress letter', blocks, { label: 'Plan this week', href: origin() + '/workspace' });
  const text = `${novaNote ? 'Nova: ' + novaNote + '\n' : ''}${textSection('This week', numbers)}${textSection('What you learned', s.learnings)}${textSection('Still blocked', s.blocked)}${textSection('Coming up next', s.next)}\nPlan your week: ${origin()}/workspace`;
  return { subject, html, text, stats: s };
}
