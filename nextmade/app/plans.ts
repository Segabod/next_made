// Plan tiers and limits. The database enforces these (supabase/005); this copy drives the UI.
export type Tier = 'free' | 'pro';
export type PlanInfo = {
  tier: Tier;
  aiToday: number;
  researchUsed: number;
  loaded: boolean;
};
export const blankPlan: PlanInfo = { tier: 'free', aiToday: 0, researchUsed: 0, loaded: false };

export const limits: Record<Tier, { ai: number; research: number; livePages: number; mentorRequests: number; keys: number; archiveDays: number | null }> = {
  free: { ai: 25, research: 1, livePages: 1, mentorRequests: 1, keys: 0, archiveDays: 7 },
  pro: { ai: 150, research: 60, livePages: 10, mentorRequests: 10, keys: 5, archiveDays: null },
};

/** Shown on the upgrade page. Prices are set by env so they can change without a code edit. */
export const proPriceLabel = process.env.NEXT_PUBLIC_PRO_PRICE || 'Founding-member price set before billing opens';

export const compare: { feature: string; free: string; pro: string }[] = [
  { feature: 'Quests, check-ins, journal, circles', free: 'Included', pro: 'Included' },
  { feature: 'Nova sessions per day', free: String(limits.free.ai), pro: String(limits.pro.ai) },
  { feature: 'Browse ideas, trends and niches', free: 'Last 7 days', pro: 'Full archive' },
  { feature: 'Research your own idea, trend or niche', free: '1 a month', pro: '60 a month' },
  { feature: 'Live offer pages (smoke tests)', free: String(limits.free.livePages), pro: String(limits.pro.livePages) },
  { feature: 'Office hours requests', free: '1 a month', pro: '10 a month' },
  { feature: 'Connect your AI (Claude, Cursor and other MCP clients)', free: 'Not included', pro: 'Up to 5 keys' },
  { feature: 'Perk planner with Nova', free: 'Not included', pro: 'Included' },
];
