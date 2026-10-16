import test from 'node:test';
import assert from 'node:assert/strict';
import { toEntry, firstObject } from '../lib/catalog-ai.ts';
import { applyFilters, matchScore, noFilters, sortItems, untilNextDrop, type CatalogItem } from '../app/browse-logic.ts';
import { slugify, slugProblem, emailOk } from '../app/pages-logic.ts';
import { limits } from '../app/plans.ts';
import { emptyWorkspace, normalize, stateSchema } from '../app/domain.ts';

test('catalog replies are validated, clamped and stripped of column fields', () => {
  const raw = firstObject('Here you go: {"title":"Rent reporting for newcomers","oneLiner":"Turn rent into credit.","market":"B2C","category":"SaaS","tags":["Credit","Canada","x","y","z","w","extra"],"scores":{"opportunity":12,"pain":"8","timing":7.6,"feasibility":-3},"difficulty":"moderate build","canada":true,"whoFor":"Renters","plan":["Talk to 5 renters"]}');
  const e = toEntry('idea', raw, [{ title: 'Src', url: 'https://example.com' }, { title: 'Bad', url: 'javascript:alert(1)' }]);
  assert.ok(e);
  assert.equal(e!.summary, 'Turn rent into credit.');
  assert.deepEqual([e!.scores.opportunity, e!.scores.pain, e!.scores.timing, e!.scores.feasibility], [10, 8, 8, 0]);
  assert.equal(e!.scores.difficulty, 'Moderate');
  assert.equal(e!.tags.length, 6);
  assert.equal(e!.canada, true);
  assert.equal(e!.sources.length, 1);
  assert.equal((e!.body as any).tags, undefined);
  assert.equal((e!.body as any).whoFor, 'Renters');
  assert.equal(toEntry('trend', { summary: 'no title' }), null);
  assert.equal(toEntry('niche', [1, 2]), null);
  assert.equal(toEntry('idea', { title: 'x', market: 'Enterprise' })!.market, '');
});

const item = (o: Partial<CatalogItem>): CatalogItem => ({ id: 'a', kind: 'idea', title: 't', summary: '', market: 'B2B', category: 'SaaS', tags: [], scores: {}, demand: {}, canada: false, shared: false, mine: false, community: false, created: '2026-10-01T00:00:00Z', ...o });

test('browse filters, sorting and For you matching', () => {
  const items = [
    item({ id: '1', title: 'Bookkeeping for restaurants', market: 'B2B', scores: { pain: 9, opportunity: 6, difficulty: 'Manageable' }, canada: true }),
    item({ id: '2', title: 'Pet sitting app', market: 'B2C', category: 'Marketplace', scores: { pain: 5, opportunity: 9 }, community: true, created: '2026-10-05T00:00:00Z' }),
    item({ id: '3', title: 'My own research', mine: true, community: true, scores: { pain: 8 } }),
  ];
  assert.deepEqual(applyFilters(items, { ...noFilters, markets: ['B2C'] }).map((i) => i.id), ['2']);
  assert.deepEqual(applyFilters(items, { ...noFilters, high: ['pain'] }).map((i) => i.id), ['1', '3']);
  assert.deepEqual(applyFilters(items, { ...noFilters, canada: true }).map((i) => i.id), ['1']);
  assert.deepEqual(applyFilters(items, { ...noFilters, source: 'community' }).map((i) => i.id), ['2']);
  assert.deepEqual(applyFilters(items, { ...noFilters, source: 'mine' }).map((i) => i.id), ['3']);
  assert.deepEqual(applyFilters(items, { ...noFilters, difficulty: 'Manageable' }).map((i) => i.id), ['1']);
  assert.deepEqual(applyFilters(items, { ...noFilters, q: 'PET' }).map((i) => i.id), ['2']);
  assert.equal(sortItems(items, 'newest')[0].id, '2');
  assert.equal(sortItems(items, 'opportunity')[0].id, '2');
  const m = matchScore(items[0], { skills: 'accounting and bookkeeping', audience: 'restaurants owners' });
  assert.ok(m.matched.includes('bookkeeping'));
  assert.ok(m.score > matchScore(items[1], { skills: 'accounting and bookkeeping', audience: 'restaurants owners' }).score);
});

test('daily drop countdown targets 10:00 UTC', () => {
  assert.equal(untilNextDrop(new Date('2026-10-16T09:00:00Z')), '01:00:00');
  assert.equal(untilNextDrop(new Date('2026-10-16T10:30:00Z')), '23:30:00');
});

test('offer page addresses are safe and readable', () => {
  assert.equal(slugify('Café Books: Done in 2 Hours!'), 'cafe-books-done-in-2-hours');
  assert.equal(slugProblem('ok-page'), '');
  assert.notEqual(slugProblem('ab'), '');
  assert.notEqual(slugProblem('-bad'), '');
  assert.notEqual(slugProblem('verify-your-bank'), '');
  assert.ok(emailOk('a@b.co'));
  assert.ok(!emailOk('nope'));
});

test('plan limits give Pro more than Free', () => {
  for (const k of ['ai', 'research', 'livePages', 'mentorRequests', 'keys'] as const) assert.ok(limits.pro[k] > limits.free[k]);
});

test('older workspaces gain bookmarks without losing data', () => {
  const old: any = emptyWorkspace('Ada');
  delete old.bookmarks;
  const w = normalize(old);
  assert.deepEqual(w.bookmarks, []);
  assert.equal(stateSchema.safeParse(w).success, true);
});
