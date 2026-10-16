import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyWorkspace, fitWorkspace, localDay, normalize, stateSchema, streak } from '../app/domain.ts';
import { agents, quiz, scoreQuiz, sprintSteps } from '../app/catalog.ts';

test('older saved workspaces gain the new founder, ideas and runs fields', () => {
  const old: any = emptyWorkspace('Ada');
  delete old.founder; delete old.ideas; delete old.runs; delete old.feed; delete old.sprint;
  const w = normalize(old);
  assert.equal(w.founder.stage, 'exploring');
  assert.deepEqual(w.ideas, []);
  assert.equal(w.sprint, null);
  assert.ok(stateSchema.safeParse(w).success);
});

test('streak counts consecutive active days and survives until the day ends', () => {
  const d = new Date();
  const day = (n: number) => { const x = new Date(d); x.setDate(x.getDate() - n); return localDay(x); };
  assert.equal(streak({ [day(0)]: 1, [day(1)]: 2, [day(2)]: 1, [day(4)]: 1 }), 3);
  assert.equal(streak({ [day(1)]: 1, [day(2)]: 1 }), 2);
  assert.equal(streak({}), 0);
});

test('quiz scoring picks the most chosen builder style', () => {
  const answers = quiz.map((q) => q.options.findIndex((o) => o.type === 'craftsman')).map((i) => (i < 0 ? 0 : i));
  assert.equal(scoreQuiz(answers).primary, 'craftsman');
});

test('catalogue is consistent', () => {
  assert.equal(new Set(agents.map((a) => a.id)).size, agents.length);
  for (const s of sprintSteps) if (s.action === 'agent') assert.ok(agents.some((a) => a.id === s.agent), s.agent);
});

test('fitWorkspace drops oldest agent outputs to stay under the storage limit', () => {
  const w = emptyWorkspace();
  const run = (i: number) => ({ id: 'r' + i, agent: 'coach', title: 't', ideaId: '', goalId: '', input: '', output: 'x'.repeat(19000), sources: [], created: '' });
  const big = { ...w, runs: Array.from({ length: 80 }, (_, i) => run(i)) };
  const fitted = fitWorkspace(big);
  assert.ok(JSON.stringify(fitted).length <= 900000);
  assert.equal(fitted.runs[0].id, 'r0');
});
