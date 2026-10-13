import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyDigest, hasDigest, normalize, weeklyStats, emptyWorkspace, dayIn, points } from '../app/domain.ts';

function ws() {
  const s = emptyWorkspace('Ada');
  s.goals.push({ id: 'g', title: 'Launch', category: 'Business', due: '', why: '', created: '2026-10-01T10:00:00Z', paused: false });
  s.goals.push({ id: 'p', title: 'Paused', category: 'Business', due: '', why: '', created: '2026-10-01T10:00:00Z', paused: true });
  s.tasks.push(
    { id: 't1', goalId: 'g', title: 'Overdue', due: '2026-10-10', status: 'planned', created: '' },
    { id: 't2', goalId: 'g', title: 'Today', due: '2026-10-13', status: 'planned', created: '' },
    { id: 't3', goalId: 'g', title: 'Later', due: '2026-10-20', status: 'planned', created: '' },
    { id: 't4', goalId: 'p', title: 'Paused quest task', due: '2026-10-01', status: 'planned', created: '' },
    { id: 't5', goalId: 'g', title: 'Done', due: '2026-10-12', status: 'completed', created: '' },
  );
  s.contacts.push(
    { id: 'c1', name: 'Bola', channel: '', offerId: '', stage: 'replied', notes: '', nextStep: 'Call', nextDate: '2026-10-13', value: 0, created: '2026-10-11T00:00:00Z', updated: '2026-10-12T00:00:00Z' },
    { id: 'c2', name: 'Paid', channel: '', offerId: '', stage: 'paid', notes: '', nextStep: '', nextDate: '2026-10-01', value: 300, created: '2026-10-11T00:00:00Z', updated: '2026-10-12T00:00:00Z' },
  );
  return s;
}

test('daily digest picks due, overdue and follow-ups, ignoring paused quests and closed deals', () => {
  const d = dailyDigest(ws(), '2026-10-13');
  assert.deepEqual(d.overdue.map((t) => t.title), ['Overdue']);
  assert.deepEqual(d.dueToday.map((t) => t.title), ['Today']);
  assert.deepEqual(d.followUps.map((c) => c.name), ['Bola']);
  assert.equal(hasDigest(d), true);
  assert.equal(hasDigest(dailyDigest(emptyWorkspace(), '2026-10-13')), false);
});
test('quiet nudge after three days without a check-in', () => {
  const s = ws();
  s.tasks = [];
  s.contacts = [];
  s.logs.push({ id: 'l', goalId: 'g', activity: 'x', learning: '', blocker: '', next: '', created: '2026-10-09T12:00:00Z', evidence: '' });
  assert.equal(dailyDigest(s, '2026-10-13').quietDays, 4);
  assert.equal(dailyDigest(s, '2026-10-10').quietDays, null);
});
test('older saved workspaces gain the new fields', () => {
  const old: any = { ...emptyWorkspace('Ada') };
  delete old.offers; delete old.contacts; delete old.experiments; delete old.profile.weeklyLetter;
  const n = normalize(old);
  assert.deepEqual([n.offers, n.contacts, n.experiments], [[], [], []]);
  assert.equal(n.profile.weeklyLetter, true);
  assert.equal(normalize(null).profile.style, 'Supportive');
});
test('weekly stats and points count customer progress', () => {
  const st = weeklyStats(ws(), new Date('2026-10-13T12:00:00Z'));
  assert.equal(st.newContacts, 2);
  assert.equal(st.paid, 1);
  assert.equal(st.completed, 1);
  assert.ok(points(ws()) >= 50);
});
test('dayIn respects timezones and survives bad zones', () => {
  const t = new Date('2026-10-13T02:00:00Z');
  assert.equal(dayIn('America/Toronto', t), '2026-10-12');
  assert.equal(dayIn('Africa/Lagos', t), '2026-10-13');
  assert.equal(dayIn('Not/AZone', t), '2026-10-13');
});
