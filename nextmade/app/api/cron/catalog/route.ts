// Daily scheduled job (Vercel Cron, see vercel.json): adds one researched NextMade entry to the Browse catalog.
// /api/cron/catalog?kind=idea | trend | niche. Runs with the scheduled-job key, never a member session.
import { adminReady, adminRead, adminWrite } from '../../../../lib/admin';
import { aiReady, generateRich, researchReady } from '../../../../lib/ai';
import { dailyBrief, firstObject, kinds, prompts, toEntry, type Kind } from '../../../../lib/catalog-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const kind = new URL(req.url).searchParams.get('kind') as Kind;
  if (!kinds.includes(kind)) return Response.json({ error: 'Unknown kind' }, { status: 400 });
  if (!aiReady() || !adminReady()) return Response.json({ skipped: 'AI provider or scheduled-job keys are not configured.' });
  try {
    const today = new Date().toISOString().slice(0, 10);
    const recent: { title: string; created: string }[] = await adminRead(
      `/rest/v1/catalog?select=title,created&kind=eq.${kind}&created_by=is.null&order=created.desc&limit=40`,
    );
    if (recent[0]?.created?.slice(0, 10) === today) return Response.json({ skipped: 'Already added today.' });
    const research = researchReady();
    const { text, sources } = await generateRich({
      system:
        'You are the NextMade research desk. You write for first-time founders, many of them in Canada, and for anyone building an online business anywhere. Be specific, honest and practical. ' +
        (research ? 'Search the web and cite only what you actually found. ' : 'No browsing is available: mark market facts as assumptions to verify. ') +
        prompts[kind],
      input: JSON.stringify({ brief: dailyBrief[kind], today, avoidTheseRecentTitles: recent.map((r) => r.title) }),
      maxTokens: 4500,
      timeoutMs: 55000,
      research,
    });
    const entry = toEntry(kind, firstObject(text), sources);
    if (!entry) return Response.json({ error: 'The AI reply was not usable.' }, { status: 502 });
    const rows = await adminWrite('/rest/v1/catalog', 'POST', { ...entry, created_by: null, shared: false });
    return Response.json({ added: rows?.[0]?.id, title: entry.title, researched: research });
  } catch (e) {
    console.error('catalog job failed', e instanceof Error ? e.message : e);
    return Response.json({ error: 'Catalog job failed.' }, { status: 500 });
  }
}
