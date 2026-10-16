// Pure helpers for Browse: filtering, sorting and "For you" matching. Kept React-free so they can be unit tested.
export type CatalogItem = {
  id: string;
  kind: 'idea' | 'trend' | 'niche';
  title: string;
  summary: string;
  market: string;
  category: string;
  tags: string[];
  scores: Record<string, number | string>;
  demand: Record<string, string>;
  canada: boolean;
  shared: boolean;
  mine: boolean;
  community: boolean;
  created: string;
};

export type Filters = {
  q: string;
  markets: string[];
  categories: string[];
  high: string[]; // score keys that must be 8 or more
  difficulty: string; // '' = any
  canada: boolean;
  source: 'all' | 'nextmade' | 'community' | 'mine';
};
export const noFilters: Filters = { q: '', markets: [], categories: [], high: [], difficulty: '', canada: false, source: 'all' };

export const scoreLabels: Record<string, string> = {
  opportunity: 'Opportunity',
  pain: 'Pain',
  timing: 'Timing',
  feasibility: 'Feasibility',
  momentum: 'Momentum',
  revenue: 'Revenue',
};

const n = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

export function applyFilters(items: CatalogItem[], f: Filters): CatalogItem[] {
  const q = f.q.trim().toLowerCase();
  return items.filter((i) => {
    if (q && !`${i.title} ${i.summary} ${i.tags.join(' ')} ${i.category}`.toLowerCase().includes(q)) return false;
    if (f.markets.length && !f.markets.includes(i.market)) return false;
    if (f.categories.length && !f.categories.includes(i.category)) return false;
    if (f.high.some((k) => n(i.scores[k]) < 8)) return false;
    if (f.difficulty && i.scores.difficulty !== f.difficulty) return false;
    if (f.canada && !i.canada) return false;
    if (f.source === 'nextmade' && i.community) return false;
    if (f.source === 'community' && (!i.community || i.mine)) return false;
    if (f.source === 'mine' && !i.mine) return false;
    return true;
  });
}

export type Sort = 'newest' | 'opportunity' | 'pain' | 'timing';
export function sortItems(items: CatalogItem[], sort: Sort): CatalogItem[] {
  const out = [...items];
  if (sort === 'newest') return out.sort((a, b) => b.created.localeCompare(a.created));
  return out.sort((a, b) => n(b.scores[sort]) - n(a.scores[sort]) || b.created.localeCompare(a.created));
}

/** Facet counts for the filter panel. */
export function facets(items: CatalogItem[], key: 'market' | 'category') {
  const counts: Record<string, number> = {};
  for (const i of items) if (i[key]) counts[i[key]] = (counts[i[key]] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

const stop = new Set(
  'the and for with that this from your you are our who what into have has can will about them they their more most than just very also been being over under like into onto i me my we a an of to in on at by or as is it be not no'.split(
    ' ',
  ),
);
export function words(text: string) {
  return Array.from(new Set(text.toLowerCase().match(/[a-z][a-z0-9+#-]{2,}/g) || [])).filter((w) => !stop.has(w));
}

const archetypeCategories: Record<string, string[]> = {
  craftsman: ['saas', 'software', 'tool', 'app', 'plugin'],
  hustler: ['service', 'agency', 'brokerage', 'b2b', 'sales'],
  storyteller: ['content', 'media', 'course', 'community', 'newsletter'],
  operator: ['productized', 'service', 'operations', 'logistics'],
  analyst: ['data', 'research', 'vertical', 'saas', 'analytics'],
  connector: ['marketplace', 'community', 'network', 'partnership'],
};

/** How well an entry fits a founder profile, with the words that matched. */
export function matchScore(item: CatalogItem, founder: { skills?: string; market?: string; audience?: string; problem?: string; edge?: string; goal?: string; archetype?: string }) {
  const profile = words([founder.skills, founder.market, founder.audience, founder.problem, founder.edge, founder.goal].filter(Boolean).join(' '));
  const text = new Set(words(`${item.title} ${item.summary} ${item.tags.join(' ')} ${item.category}`));
  const matched = profile.filter((w) => text.has(w) || Array.from(text).some((t) => t.length > 4 && w.length > 4 && (t.startsWith(w) || w.startsWith(t))));
  let score = matched.length * 2;
  const pref = archetypeCategories[founder.archetype || ''] || [];
  if (pref.some((p) => `${item.category} ${item.tags.join(' ')}`.toLowerCase().includes(p))) score += 2;
  score += n(item.scores.opportunity) / 5 + n(item.scores.feasibility) / 5;
  return { score, matched: matched.slice(0, 4) };
}

/** Next daily catalog refresh (10:00 UTC), as hh:mm:ss from now. */
export function untilNextDrop(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  const s = Math.floor((next.getTime() - now.getTime()) / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, '0')).join(':');
}
