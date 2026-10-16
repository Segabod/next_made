// Static catalogue for the idea-to-business features: Nova agents, the founder quiz,
// the 7-day Launch Sprint and the builder toolkit. Shared by the UI and the AI route.

export type AgentGroup = 'decide' | 'offer' | 'build' | 'sell';
export type Agent = {
  id: string;
  group: AgentGroup;
  title: string;
  name: string;
  desc: string;
  minutes: string;
  /** Uses live web search for sources when the provider supports it (Gemini). */
  research?: boolean;
  /** What the member should give Nova, shown as the input placeholder. */
  ask: string;
  instruction: string;
};

export const agentGroups: { id: AgentGroup; label: string; title: string }[] = [
  { id: 'decide', label: 'Decide', title: 'Decide what to build' },
  { id: 'offer', label: 'Offer', title: 'Shape the offer' },
  { id: 'build', label: 'Build', title: 'Build it' },
  { id: 'sell', label: 'Sell', title: 'Sell it' },
];

const md = 'Write in clear Markdown with short ## headings and bullet points. Label every number as a fact (with its source) or an assumption. Never invent customers, quotes, results or sources.';

export const agents: Agent[] = [
  {
    id: 'business-map', group: 'decide', title: 'Map the business', name: 'BUSINESS MAP', minutes: '20-40 min',
    desc: 'Six parts from idea to a real go or no-go: your advantage, the customer, the offer, the page, how customers find you, and the math.',
    ask: 'Describe the idea, or leave blank to use the linked idea.',
    instruction: `Produce a one-page business map with these sections: Your advantage (from the founder profile only), The customer (one specific segment), The offer (one core offer and price hypothesis), The page (headline + 3 bullets), How customers find you (2 channels ranked), The math (simple unit economics with assumptions), and a Go / No-go / Test-first verdict with the single riskiest assumption. ${md}`,
  },
  {
    id: 'should-build', group: 'decide', title: 'Decide if it is worth building', name: 'GO OR NO-GO', minutes: '15-30 min', research: true,
    desc: 'A go or no-go report with two priced routes, the value equation and a three-week plan.',
    ask: 'Which idea, and what is making you hesitate?',
    instruction: `Write a go/no-go report: a one-line verdict headline; Two routes (a service-first route and a product route, each with a price and first-90-day target); The value equation (outcome, likelihood, time to result, effort); Three-week plan (week by week); What would change the verdict. ${md}`,
  },
  {
    id: 'stress-test', group: 'decide', title: 'Get honest feedback', name: 'STRESS TEST', minutes: '5-15 min',
    desc: 'Four tough perspectives on your idea: a customer, a competitor, an investor and a mentor.',
    ask: 'Paste the idea or pitch you want challenged.',
    instruction: `Stress-test the idea from four perspectives, each under its own heading: The customer (would I pay, why not), The competitor (how I would crush or copy this), The investor (what is missing for this to be big), The mentor (what I would do first). Be candid but respectful, never mocking. End with "Fix these three things first". ${md}`,
  },
  {
    id: 'founder-fit', group: 'decide', title: 'See if the idea fits you', name: 'FOUNDER FIT', minutes: '~2 min',
    desc: 'Is this idea right for you, given your skills, time, budget and builder style?',
    ask: 'Which idea should Nova check against your profile?',
    instruction: `Assess founder-idea fit using ONLY the founder profile and archetype in context. Give: Fit score out of 10 (labelled as a judgement, not a measurement), Where you have an edge, Where you will struggle, What the idea demands (distribution, domain depth, sales, content, capital each rated 1-10), and How to close the biggest gap. If the profile is thin, say what is missing. ${md}`,
  },
  {
    id: 'competitors', group: 'decide', title: 'Size up your competitors', name: 'COMPETITOR SCAN', minutes: '10-20 min', research: true,
    desc: 'Map who you are up against, how they position and price, and where your edge is.',
    ask: 'Name the idea and any competitors you already know.',
    instruction: `Map the competitive landscape: a table of up to 8 players (name, who they serve, positioning, public pricing if known), the incumbent to beat, the white space, and the wedge for this founder. Only name companies you can support with sources; otherwise mark them "to verify". ${md}`,
  },
  {
    id: 'coach', group: 'decide', title: 'Figure out what to do next', name: 'COACH ME', minutes: 'ongoing',
    desc: 'A sharp founder friend who looks at everything you have and tells you the next move.',
    ask: 'What is on your mind?',
    instruction: `Act as a candid business coach. Read the workspace (quests, customers, experiments, ideas, agent outputs). Give: What I see, The one thing to do this week, What to stop doing, and One question for the member. Under 300 words. ${md}`,
  },
  {
    id: 'offer-shaper', group: 'offer', title: 'Shape an offer people buy', name: 'OFFER SHAPER', minutes: '20-40 min',
    desc: 'What you sell, who it is for, and why it is worth the price.',
    ask: 'Who do you want to serve and what result do you help them get?',
    instruction: `Shape one offer: Who exactly, The urgent problem (in the customer's words), The promised outcome, What is included, Price and format (as a hypothesis), Guarantee or risk reversal, Proof available today (only real context), and the cheapest test to validate it this week. ${md}`,
  },
  {
    id: 'brand-voice', group: 'offer', title: 'Define your brand', name: 'BRAND VOICE', minutes: '15-30 min',
    desc: 'Your brand personality, voice, words to use and avoid, and three sample lines.',
    ask: 'Describe your audience and how you want to come across.',
    instruction: `Define a brand voice: Personality (3 traits with "this, not that"), Audience in one sentence, Core message, Words to use / avoid, Tone by channel (website, email, social), and three sample lines. ${md}`,
  },
  {
    id: 'audience-plan', group: 'offer', title: 'Pick your audience, content and product', name: 'AUDIENCE PLAN', minutes: '20-40 min',
    desc: 'Choose the platform, the content style and the path from follower to buyer.',
    ask: 'Who are you trying to reach, and what can you create consistently?',
    instruction: `Create an audience-first plan: Ideal customer profile (role, situation, trigger, where they gather), The one platform to start on and why, Content pillars (3) with 5 post ideas, The path from follower to buyer, and a 30-day posting rhythm. ${md}`,
  },
  {
    id: 'funnel', group: 'offer', title: 'Build your funnel', name: 'FUNNEL MAP', minutes: '30-60 min',
    desc: 'From traffic source to lead capture to the sale, with the metric to watch at each step.',
    ask: 'What are you selling and where will traffic come from?',
    instruction: `Design a simple funnel: Traffic source, Hook, Lead capture (what they get), Nurture (sequence outline), Conversion step, and Follow-up. For each step give the metric to watch and a benchmark labelled as an assumption. ${md}`,
  },
  {
    id: 'money-model', group: 'offer', title: 'Price your offer', name: 'MONEY MODEL', minutes: '30-60 min',
    desc: 'Pricing, a value ladder, revenue streams and napkin math for year one.',
    ask: 'What do you sell and what do similar things cost?',
    instruction: `Build a money model: a value ladder (lead magnet, entry offer, core offer, continuity) with prices; revenue streams; napkin math for year one as a table with each row marked fact or assumption; break-even point; and the price test to run first. Keep the member's internal projections private: this output is for them only. ${md}`,
  },
  {
    id: 'service-scale', group: 'offer', title: 'Scale a service business', name: 'SERVICE SCALE PLAN', minutes: '30-60 min',
    desc: 'Revenue, delivery and growth strategy for service businesses and agencies.',
    ask: 'Describe your service, current clients and capacity.',
    instruction: `Plan how to scale a service: productise the offer, delivery system and capacity math, pricing moves, what to systemise or delegate first, and a 90-day growth plan. ${md}`,
  },
  {
    id: 'build-plan', group: 'build', title: 'Plan your build', name: '7-DAY BUILD PLAN', minutes: '15-25 min',
    desc: 'MVP scope with a kill list, one stack choice, validation gates with real numbers, and one thing to do today.',
    ask: 'Which idea are you building and what skills or tools do you have?',
    instruction: `Write a 7-day ship plan: MVP scope (must have / kill list), one recommended no-code or low-code stack with reasons, Day 1 to Day 7 tasks, validation gates with target numbers (labelled assumptions), and "Do this today" (one task under 60 minutes). Also output a final section "## Commitments" with 3 to 5 bullet points, each a single concrete task. ${md}`,
  },
  {
    id: 'landing-page', group: 'build', title: 'Write your landing page', name: 'LANDING PAGE DRAFT', minutes: '15-30 min',
    desc: 'A conversion-focused page for a waitlist, lead capture or sales.',
    ask: 'What is the page for: a waitlist, leads or sales?',
    instruction: `Write landing page copy: Headline (3 options), Sub-headline, Problem section, How it works (3 steps), What you get, Proof (only real; otherwise a placeholder note), FAQ (4), and Call to action. No fake testimonials or numbers. ${md}`,
  },
  {
    id: 'launch-pack', group: 'build', title: 'Get the whole plan in one run', name: 'LAUNCH PACK', minutes: '15-25 min',
    desc: 'Offer, voice, lead magnet, landing page and three emails in one run.',
    ask: 'Describe the idea and the customer in a few sentences.',
    instruction: `Produce a compact launch pack in one document: Offer (5 lines), Brand voice (3 traits), Lead magnet (title + outline), Landing page (headline, 3 bullets, CTA), and three short emails (welcome, value, offer). ${md}`,
  },
  {
    id: 'first-prospects', group: 'sell', title: 'Find your first customers', name: 'FIRST 100 PROSPECTS', minutes: '30-50 min',
    desc: 'Turn your customer into a list of where to find 100 real people, the first message and a call script.',
    ask: 'Who is your customer and what are you offering them?',
    instruction: `Plan first-customer outreach: Where to find them (specific communities, directories, events, search queries the member can run; never invent named people), How to build a list of 100 (columns to track), First message (under 100 words, honest), Follow-up message, and a 10-minute discovery call script. Remind them to log each person in First customers. ${md}`,
  },
  {
    id: 'lead-magnet', group: 'sell', title: 'Create a lead magnet', name: 'LEAD MAGNET', minutes: '15-25 min',
    desc: 'A free resource that earns an email and leads naturally to your offer.',
    ask: 'What is your main offer and who is it for?',
    instruction: `Design three lead magnet options (title, format, promise, how it bridges to the paid offer), pick the best, and outline it fully. ${md}`,
  },
  {
    id: 'sales-page', group: 'sell', title: 'Fix your sales page', name: 'SALES PAGE REWRITE', minutes: '30-60 min',
    desc: 'Long-form, voice-led sales copy for a premium offer.',
    ask: 'Paste your current sales page or describe the offer.',
    instruction: `Rewrite or draft a long-form sales page: hook, story, problem agitation, the offer stack, price justification, risk reversal, FAQ and close. Flag any claim that needs real proof. ${md}`,
  },
  {
    id: 'emails', group: 'sell', title: 'Write your emails', name: 'EMAIL SEQUENCE', minutes: '10-30 min',
    desc: 'An email sequence from lead magnet to nurture to the offer.',
    ask: 'What does someone sign up for, and what do you want them to buy?',
    instruction: `Write a 5-email sequence (subject line, preview text, body under 150 words each): deliver, story, objection, proof (real only, otherwise a placeholder), offer. ${md}`,
  },
  {
    id: 'video-script', group: 'sell', title: 'Script your sales video', name: 'VIDEO SCRIPT', minutes: '10-20 min',
    desc: 'A founder-led video sales script built on a simple story.',
    ask: 'What are you selling and what is your story?',
    instruction: `Write a 3-5 minute founder-led video script with timestamps: hook, the founder's story (only from context, otherwise placeholders), the problem, the method, the offer, and the call to action. ${md}`,
  },
];

export const agentById = (id: string) => agents.find((a) => a.id === id);

/** Structured idea report, used by "Validate an idea". Server-side instruction. */
export const reportInstruction = `Research and assess the member's idea. Reply with ONLY one JSON object (no code fences, no prose) with these fields:
title (short), oneLiner, score (number 1-10, your overall judgement), model (e.g. "B2B · SaaS"), whoFor, problem, gap, whyNow,
pain (array of up to 4 {quote, where}: only real quotes found in your sources; otherwise an empty array),
competitors (array of up to 8 {name, note, price}: only real companies),
reasonsBuild (array of strings), reasonsNot (array of strings), bestFounder (who wins this),
demands ({distribution, domain, sales, content, capital} each 1-10),
reality ({firstRevenue, capital, difficulty}),
valueLadder (array of {tier, name, price, desc} for lead magnet, frontend, core, continuity),
napkin (array of {label, value, kind} where kind is "fact" or "assumption"), ceiling,
biggestRisk, plan (array of 3-5 concrete first steps).
Use only facts you can support; mark everything else as an assumption. Never invent quotes, people, numbers or sources.`;

export const feedInstruction = `Suggest 6 distinct startup or small-business ideas matched to this founder's profile (skills, edge, market, audience, problem, time, budget, archetype). Favour ideas they could get a first paying customer for within 90 days. Reply with ONLY a JSON array (no code fences) of 6 objects with fields: title, oneLiner (2-3 sentences), model (e.g. "B2B · Service"), whyYou (one sentence tied to their profile), firstStep (one concrete action this week), score (1-10, your judgement of fit). These are AI suggestions to explore, not researched facts.`;

/* ---------- Founder style quiz ---------- */
export const archetypes = [
  { id: 'craftsman', name: 'The Craftsman', emoji: '🛠️', line: 'Builds things people love to use.', builds: ['Software products', 'Tools and templates'], avoid: ['Pure sales roles', 'Audience-first media'], partner: 'A Hustler who sells what you build' },
  { id: 'hustler', name: 'The Hustler', emoji: '🤝', line: 'Opens doors and closes deals.', builds: ['B2B services', 'Agencies and brokerage'], avoid: ['Long, quiet R&D', 'Faceless products'], partner: 'A Craftsman who delivers what you sell' },
  { id: 'storyteller', name: 'The Storyteller', emoji: '🎙️', line: 'Turns attention into trust, and trust into sales.', builds: ['Media and content businesses', 'Courses and communities'], avoid: ['Complex enterprise sales', 'Regulated slow-burn niches'], partner: 'An Operator who runs the back end' },
  { id: 'operator', name: 'The Operator', emoji: '⚙️', line: 'Makes things run smoothly at scale.', builds: ['Productised services', 'Operations-heavy businesses'], avoid: ['Hype-driven launches', 'Pure content plays'], partner: 'A Storyteller who brings the demand' },
  { id: 'analyst', name: 'The Analyst', emoji: '🔎', line: 'Finds the gap others miss.', builds: ['Niche data and research products', 'Vertical SaaS'], avoid: ['Broad consumer apps', 'Personality-led brands'], partner: 'A Hustler who takes it to market' },
  { id: 'connector', name: 'The Connector', emoji: '🌉', line: 'Brings the right people together.', builds: ['Marketplaces and communities', 'Partnership-led ventures'], avoid: ['Solo technical builds', 'Isolated deep work'], partner: 'A Craftsman or Operator who builds the engine' },
] as const;
export type ArchetypeId = (typeof archetypes)[number]['id'];

export const quiz: { q: string; options: { text: string; type: ArchetypeId }[] }[] = [
  { q: 'You have a free Saturday to work on your business. You…', options: [
    { text: 'Build a prototype', type: 'craftsman' }, { text: 'Message ten potential customers', type: 'hustler' },
    { text: 'Record a video about the problem', type: 'storyteller' }, { text: 'Map out the process in a spreadsheet', type: 'operator' } ] },
  { q: 'A competitor launches the same idea. Your first move?', options: [
    { text: 'Study their reviews to find what they miss', type: 'analyst' }, { text: 'Call their unhappy customers', type: 'hustler' },
    { text: 'Partner with someone they ignore', type: 'connector' }, { text: 'Ship a better version faster', type: 'craftsman' } ] },
  { q: 'Which win would feel best?', options: [
    { text: 'A product people use every day', type: 'craftsman' }, { text: 'A big signed contract', type: 'hustler' },
    { text: '10,000 people following your journey', type: 'storyteller' }, { text: 'A business that runs without you', type: 'operator' } ] },
  { q: 'At an event you are most likely to…', options: [
    { text: 'Introduce two people who should meet', type: 'connector' }, { text: 'Pitch your idea to anyone who listens', type: 'hustler' },
    { text: 'Take notes on what people complain about', type: 'analyst' }, { text: 'Leave early to get back to building', type: 'craftsman' } ] },
  { q: 'Your idea of a good first month:', options: [
    { text: 'One paying customer, even if it is manual', type: 'hustler' }, { text: 'A clean system I can repeat', type: 'operator' },
    { text: 'A small, engaged audience', type: 'storyteller' }, { text: 'Solid evidence the market wants it', type: 'analyst' } ] },
  { q: 'What drains you fastest?', options: [
    { text: 'Cold outreach', type: 'craftsman' }, { text: 'Paperwork and process', type: 'storyteller' },
    { text: 'Working alone for weeks', type: 'connector' }, { text: 'Chaos without a plan', type: 'operator' } ] },
  { q: 'Pick the business you would rather own:', options: [
    { text: 'A niche software tool', type: 'analyst' }, { text: 'A community with paid membership', type: 'connector' },
    { text: 'A done-for-you service', type: 'operator' }, { text: 'A popular newsletter or channel', type: 'storyteller' } ] },
  { q: 'When you get stuck, you…', options: [
    { text: 'Ask someone in my network', type: 'connector' }, { text: 'Dig into data until it makes sense', type: 'analyst' },
    { text: 'Try something and see what happens', type: 'hustler' }, { text: 'Rebuild it from first principles', type: 'craftsman' } ] },
  { q: 'Your risk appetite:', options: [
    { text: 'Bet big, move fast', type: 'hustler' }, { text: 'Small bets, learn quickly', type: 'analyst' },
    { text: 'Steady, compounding progress', type: 'operator' }, { text: 'Build in public and let it grow', type: 'storyteller' } ] },
  { q: 'People usually come to you for…', options: [
    { text: 'Making something work', type: 'craftsman' }, { text: 'An introduction', type: 'connector' },
    { text: 'Getting organised', type: 'operator' }, { text: 'Explaining something clearly', type: 'storyteller' } ] },
];

export function scoreQuiz(answers: number[]) {
  const tally: Record<string, number> = {};
  answers.forEach((a, i) => {
    const t = quiz[i]?.options[a]?.type;
    if (t) tally[t] = (tally[t] || 0) + 1;
  });
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return { primary: (top[0]?.[0] || '') as ArchetypeId | '', secondary: (top[1]?.[0] || '') as ArchetypeId | '', tally };
}

/* ---------- 7-day Launch Sprint ---------- */
export const sprintSteps = [
  { id: 'd1', day: 1, title: 'Kick off and prove demand', text: 'Pick one idea and run a validation report: real pain, what people pay today, and who else sells it.', action: 'report' as const, agent: '' },
  { id: 'd2', day: 2, title: 'Pick the business', text: 'Map the business model and the outcome you sell, so you can see how the pieces fit.', action: 'agent' as const, agent: 'business-map' },
  { id: 'd3', day: 3, title: 'Find the right customer', text: 'Choose the first customer to go after: their problem, what they pay for now, and where they gather.', action: 'agent' as const, agent: 'audience-plan' },
  { id: 'd4', day: 4, title: 'Build the offer', text: 'What you sell, how you price it, and the one offer to lead with.', action: 'agent' as const, agent: 'money-model' },
  { id: 'd5', day: 5, title: 'Launch the page', text: 'The headline that makes the right person stop, the page under it, and a free thing that earns an email.', action: 'agent' as const, agent: 'landing-page' },
  { id: 'd6', day: 6, title: 'Get customers', text: 'Where your customers are, the list to build, and the first message to send. Log people in First customers.', action: 'agent' as const, agent: 'first-prospects' },
  { id: 'd7', day: 7, title: 'Review and set up your AI cofounder', text: 'Copy your project briefing into the AI tool you use, review the week with your circle, and decide: move on, adjust or double down.', action: 'brief' as const, agent: '' },
];

/* ---------- Builder toolkit (plain links, no claimed credits) ---------- */
export const toolkit = [
  { group: 'Build', items: [
    { name: 'Vercel', what: 'Host websites and apps', url: 'https://vercel.com' },
    { name: 'Supabase', what: 'Database, auth and storage', url: 'https://supabase.com' },
    { name: 'Lovable', what: 'Build an app by describing it', url: 'https://lovable.dev' },
    { name: 'Google AI Studio', what: 'Gemini models with a free tier', url: 'https://aistudio.google.com' },
    { name: 'Framer', what: 'Landing pages and waitlists', url: 'https://www.framer.com' },
  ] },
  { group: 'Sell', items: [
    { name: 'Stripe', what: 'Take payments', url: 'https://stripe.com' },
    { name: 'Resend', what: 'Send product and marketing email', url: 'https://resend.com' },
    { name: 'Tally', what: 'Free forms and surveys', url: 'https://tally.so' },
    { name: 'Cal.com', what: 'Booking links for discovery calls', url: 'https://cal.com' },
  ] },
  { group: 'Run the business', items: [
    { name: 'Notion', what: 'Docs, wikis and planning', url: 'https://www.notion.so' },
    { name: 'Wave', what: 'Free invoicing and accounting', url: 'https://www.waveapps.com' },
    { name: 'PostHog', what: 'Product analytics', url: 'https://posthog.com' },
    { name: 'Daily.co', what: 'Video meeting rooms', url: 'https://www.daily.co' },
  ] },
];
