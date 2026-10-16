// Prompts and validators for Browse catalog entries (ideas, trends, niches).
// Used by the daily catalog job and by members researching their own entries.
import { reportInstruction } from '../app/catalog.ts';

export type Kind = 'idea' | 'trend' | 'niche';
export const kinds: Kind[] = ['idea', 'trend', 'niche'];
export const markets = ['B2B', 'B2C', 'B2B2C', 'D2C'] as const;
export const difficulties = ['Manageable', 'Moderate', 'Challenging'] as const;

export type Entry = {
  kind: Kind;
  title: string;
  summary: string;
  market: string;
  category: string;
  tags: string[];
  scores: Record<string, number | string>;
  demand: Record<string, string>;
  body: Record<string, unknown>;
  sources: { title: string; url: string }[];
  canada: boolean;
};

const shared =
  'Also include: market (one of B2B, B2C, B2B2C, D2C; omit for niches), category (e.g. SaaS, Service, Marketplace, Productized service, Content, Ecommerce, Hardware, Community), tags (array of up to 6 short lowercase keywords), canada (true when it is especially relevant to founders or buyers in Canada).';

export const prompts: Record<Kind, string> = {
  idea:
    reportInstruction +
    '\nAdd these fields to the same JSON object: scores ({opportunity, pain, timing, feasibility} each 1-10, where feasibility is how realistic it is for a small team), difficulty (one of Manageable, Moderate, Challenging), demand (a short label of demand evidence, such as a search-interest estimate, marked "est." when estimated). ' +
    shared,
  trend:
    'Research ONE rising trend that creates openings for small founders. Reply with ONLY one JSON object (no code fences, no prose) with fields: title (2-6 words, the trend itself), summary (2-3 sentences), driving (what is causing it, with dates where known), growth (a short label for the growth signal you actually found, e.g. "searches up sharply over 12 months (est.)"), interest (a short label for current interest, e.g. "about 10K monthly searches (est.)"), whoBenefits, opportunities (array of 3 {title, oneLiner} business ideas riding the trend), risks (array of strings), window (how long the opening likely lasts), scores ({momentum, opportunity} each 1-10). ' +
    shared +
    ' Use only facts you can support; label estimates. Never invent numbers, quotes or sources.',
  niche:
    'Research ONE specific, reachable customer niche with proven, unmet pain. Reply with ONLY one JSON object (no code fences, no prose) with fields: title (the audience, e.g. "Independent dog walkers with 2-50 clients"), summary (2-3 sentences), size (how many and where, labelled as estimate when estimated), pains (array of up to 5 {pain, severity 1-10}), gather (array of places they gather online or offline), spend (what they already pay for), opportunities (array of 3 {title, oneLiner}), scores ({pain, opportunity, revenue} each 1-10). ' +
    shared +
    ' Use only facts you can support; label estimates. Never invent numbers, quotes or sources.',
};

/** Extra steer for the daily NextMade entries. */
export const dailyBrief: Record<Kind, string> = {
  idea: 'Find one fresh, specific opportunity from the last few months of news, forums or regulation changes that a first-time founder could get a paying customer for within 90 days.',
  trend: 'Find one rising trend from the last 12 months with clear openings for small founders.',
  niche: 'Find one underserved niche whose members already spend money and gather somewhere reachable.',
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : typeof v === 'number' ? String(v).slice(0, max) : '');
const num = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0;
};

/** Validate an AI reply into a catalog entry, or null when it is unusable. */
export function toEntry(kind: Kind, parsed: any, sources: { title: string; url: string }[] = []): Entry | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const title = str(parsed.title, 200);
  if (!title) return null;
  const summary = str(parsed.summary ?? parsed.oneLiner, 2000);
  const market = (markets as readonly string[]).includes(String(parsed.market)) ? String(parsed.market) : '';
  const category = str(parsed.category ?? (typeof parsed.model === 'string' ? parsed.model.split('·')[1] : ''), 40);
  const tags = (Array.isArray(parsed.tags) ? parsed.tags : [])
    .map((t: unknown) => str(t, 40).toLowerCase())
    .filter(Boolean)
    .slice(0, 6);
  const s = parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : {};
  const scores: Record<string, number | string> = {};
  const keys = kind === 'idea' ? ['opportunity', 'pain', 'timing', 'feasibility'] : kind === 'trend' ? ['momentum', 'opportunity'] : ['pain', 'opportunity', 'revenue'];
  for (const k of keys) scores[k] = num(s[k]);
  if (kind === 'idea') {
    scores.overall = num(parsed.score) || Math.round((keys.reduce((a, k) => a + Number(scores[k]), 0) / keys.length) * 10) / 10;
    const d = String(parsed.difficulty || parsed.reality?.difficulty || '');
    scores.difficulty = (difficulties as readonly string[]).find((x) => d.toLowerCase().includes(x.toLowerCase())) || 'Moderate';
  }
  const demand: Record<string, string> = {};
  if (kind === 'idea' && parsed.demand && typeof parsed.demand === 'string') demand.label = str(parsed.demand, 120);
  if (kind === 'trend') {
    demand.growth = str(parsed.growth, 120);
    demand.interest = str(parsed.interest, 120);
  }
  if (kind === 'niche') demand.size = str(parsed.size, 160);
  // Keep the full structured reply as the body, without fields stored in their own columns.
  const { tags: _t, scores: _s, canada: _c, market: _m, category: _cat, ...rest } = parsed;
  const body = JSON.parse(JSON.stringify(rest)) as Record<string, unknown>;
  if (JSON.stringify(body).length > 55000) return null;
  return {
    kind,
    title,
    summary,
    market: kind === 'niche' ? '' : market,
    category,
    tags,
    scores,
    demand,
    body,
    sources: sources.filter((x) => /^https?:\/\//.test(x.url)).slice(0, 30).map((x) => ({ title: str(x.title, 300), url: str(x.url, 2000) })),
    canada: parsed.canada === true,
  };
}

/** First JSON object in a reply. */
export function firstObject(text: string): any {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}
