// Curated Canadian funding and supports, and startup credit programmes.
// Last reviewed October 2026. Amounts are the maximums programmes publish; terms change, so members are always sent to the official page.
export const reviewed = 'October 2026';

export type Program = {
  id: string;
  name: string;
  by: string;
  type: 'Grant' | 'Loan' | 'Tax credit' | 'Wage support' | 'Advice and network' | 'Directory';
  where: string; // 'Canada' or a province or city
  amount: string;
  who: string;
  tags: ('newcomer' | 'youth' | 'student' | 'women' | 'black' | 'indigenous' | 'tech' | 'export' | 'any')[];
  url: string;
};

export const programs: Program[] = [
  { id: 'innovation-canada', name: 'Innovation Canada business benefits finder', by: 'Government of Canada', type: 'Directory', where: 'Canada', amount: 'Searches federal and provincial programmes', who: 'Any business; answer a few questions to get a tailored list.', tags: ['any'], url: 'https://innovation.ised-isde.canada.ca/innovation/s/?language=en' },
  { id: 'futurpreneur', name: 'Futurpreneur Startup Program', by: 'Futurpreneur Canada with BDC', type: 'Loan', where: 'Canada', amount: 'Up to $60,000 in loans, plus up to 2 years of mentoring', who: 'Founders aged 18 to 39 who are citizens or permanent residents, starting or recently started.', tags: ['youth', 'newcomer'], url: 'https://www.futurpreneur.ca/' },
  { id: 'irap', name: 'Industrial Research Assistance Program (IRAP)', by: 'National Research Council of Canada', type: 'Grant', where: 'Canada', amount: 'Varies by project, with advisory support', who: 'Incorporated, Canadian-controlled firms with up to 500 staff developing innovative technology.', tags: ['tech'], url: 'https://nrc.canada.ca/en/support-technology-innovation' },
  { id: 'sred', name: 'SR&ED tax incentive', by: 'Canada Revenue Agency', type: 'Tax credit', where: 'Canada', amount: 'Refundable and non-refundable credits on eligible R&D spending', who: 'Businesses doing experimental development or research in Canada.', tags: ['tech'], url: 'https://www.canada.ca/en/revenue-agency/services/scientific-research-experimental-development-tax-incentive-program.html' },
  { id: 'canexport', name: 'CanExport SMEs', by: 'Trade Commissioner Service', type: 'Grant', where: 'Canada', amount: 'Up to $50,000, covering up to half of eligible export costs', who: 'Incorporated small and mid-sized firms entering new international markets.', tags: ['export'], url: 'https://www.tradecommissioner.gc.ca/en/our-solutions/funding-financing-international-business/canexport-smes.html' },
  { id: 'bdc', name: 'BDC startup and small business loans', by: 'Business Development Bank of Canada', type: 'Loan', where: 'Canada', amount: 'Varies; online small business loans and startup financing', who: 'Canadian businesses, including those operating under a year.', tags: ['any'], url: 'https://www.bdc.ca/' },
  { id: 'csbfp', name: 'Canada Small Business Financing Program', by: 'ISED, through your bank or credit union', type: 'Loan', where: 'Canada', amount: 'Government-backed loans for equipment, leaseholds and property', who: 'Small businesses with revenue of $10 million or less.', tags: ['any'], url: 'https://ised-isde.canada.ca/site/canada-small-business-financing-program/en' },
  { id: 'bep', name: 'Black Entrepreneurship Program', by: 'Government of Canada', type: 'Loan', where: 'Canada', amount: 'Loan fund (up to $250,000), plus a knowledge hub and ecosystem support', who: 'Black business owners and entrepreneurs.', tags: ['black'], url: 'https://ised-isde.canada.ca/site/black-entrepreneurship-program/en' },
  { id: 'wes', name: 'Women Entrepreneurship Strategy', by: 'Government of Canada', type: 'Advice and network', where: 'Canada', amount: 'Loan fund, knowledge hub and funded support organisations', who: 'Women-owned and women-led businesses.', tags: ['women'], url: 'https://ised-isde.canada.ca/site/women-entrepreneurship-strategy/en' },
  { id: 'windmill', name: 'Windmill Microlending', by: 'Windmill Microlending (charity)', type: 'Loan', where: 'Canada', amount: 'Low-interest loans up to $15,000', who: 'Skilled immigrants and refugees paying for licensing, training and career costs.', tags: ['newcomer'], url: 'https://www.windmillmicrolending.org/' },
  { id: 'access-ccf', name: 'ACCESS Community Capital Fund', by: 'ACCESS (non-profit)', type: 'Loan', where: 'Ontario', amount: 'Small business microloans with coaching', who: 'Ontario entrepreneurs who cannot get traditional bank credit.', tags: ['newcomer', 'any'], url: 'https://accessccf.com/' },
  { id: 'starter-company', name: 'Starter Company Plus', by: 'Ontario, via Small Business Enterprise Centres', type: 'Grant', where: 'Ontario', amount: 'Up to $5,000, plus training and mentoring', who: 'Ontario residents 18+ starting or growing a small business. Apply through your local Small Business Enterprise Centre (Toronto link shown).', tags: ['any'], url: 'https://www.toronto.ca/business-economy/business-operation-growth/business-incentives/starter-company-plus-grant/' },
  { id: 'summer-company', name: 'Summer Company', by: 'Ontario', type: 'Grant', where: 'Ontario', amount: 'Up to $3,000, plus coaching', who: 'Students aged 15 to 29 running a summer business.', tags: ['student', 'youth'], url: 'https://www.ontario.ca/summercompany' },
  { id: 'sbec', name: 'Small Business Enterprise Centres', by: 'Ontario', type: 'Advice and network', where: 'Ontario', amount: 'Free advice, registration help and workshops', who: 'Anyone starting a business in Ontario.', tags: ['any'], url: 'https://www.ontario.ca/SBEC' },
  { id: 'community-futures', name: 'Community Futures', by: 'Community Futures Canada', type: 'Loan', where: 'Rural Canada', amount: 'Small business loans and advice', who: 'Businesses in rural and smaller communities.', tags: ['any'], url: 'https://communityfuturescanada.ca/' },
  { id: 'csj', name: 'Canada Summer Jobs', by: 'Employment and Social Development Canada', type: 'Wage support', where: 'Canada', amount: 'Wage subsidies for summer hires aged 15 to 30', who: 'Small businesses (up to 50 staff) hiring young people.', tags: ['any'], url: 'https://www.canada.ca/en/employment-social-development/services/funding/canada-summer-jobs.html' },
  { id: 'mitacs', name: 'Mitacs Accelerate', by: 'Mitacs', type: 'Wage support', where: 'Canada', amount: 'Cost-shared graduate research interns', who: 'Companies working with university researchers on innovation projects.', tags: ['tech', 'student'], url: 'https://www.mitacs.ca/' },
  { id: 'dmz', name: 'DMZ at Toronto Metropolitan University', by: 'TMU', type: 'Advice and network', where: 'Toronto', amount: 'Incubation, coaching and investor access', who: 'Early-stage tech startups.', tags: ['tech'], url: 'https://dmz.torontomu.ca/' },
];

export type Perk = { name: string; what: string; offer: string; who: string; url: string; group: 'Cloud and hosting' | 'AI' | 'Product and growth' | 'Run the business' };

export const perks: Perk[] = [
  { name: 'AWS Activate', what: 'Cloud hosting and AI services', offer: 'Credits from $1,000 for self-funded founders; more through an accelerator or investor', who: 'Self-funded founders, or startups backed by an Activate provider', url: 'https://aws.amazon.com/startups/credits/', group: 'Cloud and hosting' },
  { name: 'Google for Startups Cloud Program', what: 'Google Cloud and Gemini', offer: 'Start tier up to $2,000; larger tiers for funded and AI-first startups', who: 'Startups with a working product', url: 'https://cloud.google.com/startup', group: 'Cloud and hosting' },
  { name: 'Microsoft for Startups', what: 'Azure, OpenAI models on Azure, GitHub and Microsoft 365', offer: 'Starter credits, unlocking higher tiers as you grow', who: 'Most early-stage startups', url: 'https://www.microsoft.com/en-us/startups', group: 'Cloud and hosting' },
  { name: 'Cloudflare for Startups', what: 'Hosting, Workers, storage and CDN', offer: 'Credits by funding stage, from $10,000', who: 'Startups with a product built on Cloudflare', url: 'https://www.cloudflare.com/startups/', group: 'Cloud and hosting' },
  { name: 'NVIDIA Inception', what: 'GPU, training and go-to-market support', offer: 'Free programme with partner discounts', who: 'AI and data startups', url: 'https://www.nvidia.com/en-us/startups/', group: 'AI' },
  { name: 'Anthropic startup program', what: 'Claude API', offer: 'API credits and support through partner VCs and accelerators', who: 'Startups backed by participating partners', url: 'https://www.anthropic.com/startups', group: 'AI' },
  { name: 'PostHog for Startups', what: 'Product analytics, session replay and feature flags', offer: 'Credits for eligible early-stage companies', who: 'Startups under 2 years old with limited funding', url: 'https://posthog.com/startups', group: 'Product and growth' },
  { name: 'HubSpot for Startups', what: 'CRM, marketing and sales tools', offer: 'Discounts on paid plans through partners', who: 'Startups affiliated with a HubSpot partner', url: 'https://www.hubspot.com/startups', group: 'Product and growth' },
  { name: 'Notion for Startups', what: 'Docs, wiki and project management', offer: 'Discounted or free months of Plus with AI', who: 'Early-stage startups, often via partners', url: 'https://www.notion.com/startups', group: 'Run the business' },
  { name: 'Stripe Atlas', what: 'US incorporation and payments', offer: 'Partner credits bundled with incorporation', who: 'Founders incorporating a US company', url: 'https://stripe.com/atlas', group: 'Run the business' },
];
