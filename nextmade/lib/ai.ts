// Nova's AI provider switch. Pick a provider with NOVA_PROVIDER, or leave it unset
// and the first provider with a configured key is used (in the order below).
// All providers are called with plain fetch, so no extra SDK dependencies are needed.

export type Provider = 'anthropic' | 'gemini' | 'gateway' | 'openai';

const ORDER: Provider[] = ['anthropic', 'gemini', 'gateway', 'openai'];

const KEYS: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  gateway: 'AI_GATEWAY_API_KEY',
  openai: 'OPENAI_API_KEY',
};

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-haiku-4-5',
  gemini: 'gemini-2.5-flash',
  gateway: 'anthropic/claude-haiku-4.5',
  openai: 'gpt-4.1-mini',
};

function keyFor(p: Provider) {
  return process.env[KEYS[p]] || '';
}

/** The provider Nova will use, or null when no usable key is configured. */
export function activeProvider(): Provider | null {
  const wanted = (process.env.NOVA_PROVIDER || '').trim().toLowerCase();
  if (wanted) {
    if (!(ORDER as string[]).includes(wanted)) return null;
    return keyFor(wanted as Provider) ? (wanted as Provider) : null;
  }
  return ORDER.find(p => keyFor(p)) ?? null;
}

export const aiReady = () => activeProvider() !== null;

export function activeModel(p: Provider) {
  return process.env.NOVA_MODEL || (p === 'openai' && process.env.OPENAI_MODEL) || DEFAULT_MODELS[p];
}

export class AiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

type Request = { system: string; input: string; maxTokens?: number; timeoutMs?: number; research?: boolean };
export type Source = { title: string; url: string };

/** Send one instruction + input to the active provider and return its text reply. */
export async function generate(req: Request): Promise<string> {
  return (await generateRich(req)).text;
}

/** Whether the active provider can search the web for sources. */
export const researchReady = () => {
  const p = activeProvider();
  return p === 'gemini' || p === 'anthropic' || p === 'openai';
};

/** Like generate, but optionally grounded in live web search, returning the sources used. */
export async function generateRich({ system, input, maxTokens = 1800, timeoutMs = 45000, research = false }: Request): Promise<{ text: string; sources: Source[] }> {
  const sources: Source[] = [];
  const addSource = (url: unknown, title: unknown) => {
    const u = String(url || '');
    if (!/^https?:\/\//.test(u) || sources.some((x) => x.url === u) || sources.length >= 30) return;
    sources.push({ url: u.slice(0, 2000), title: String(title || new URL(u).hostname).slice(0, 300) });
  };
  const p = activeProvider();
  if (!p) throw new AiError('No AI provider is configured.');
  const key = keyFor(p);
  const model = activeModel(p);
  const signal = AbortSignal.timeout(timeoutMs);
  const post = async (url: string, headers: Record<string, string>, body: unknown) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error(`Nova provider ${p} (${model}) returned ${r.status}: ${detail.slice(0, 500)}`);
      throw new AiError(`AI provider returned ${r.status}`, r.status);
    }
    return r.json() as Promise<any>;
  };

  let text = '';
  if (p === 'anthropic') {
    const r = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, {
      model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: input }],
      ...(research ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }] } : {}),
    });
    const blocks = (r.content || []).filter((c: any) => c.type === 'text');
    text = blocks.map((c: any) => c.text).join('');
    blocks.forEach((c: any) => (c.citations || []).forEach((x: any) => addSource(x.url, x.title)));
  } else if (p === 'gemini') {
    const r = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key }, {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: input }] }],
      generationConfig: { maxOutputTokens: Math.max(maxTokens, 4096) },
      ...(research ? { tools: [{ google_search: {} }] } : {}),
    });
    text = (r.candidates?.[0]?.content?.parts || []).map((x: any) => x.text || '').join('');
    (r.candidates?.[0]?.groundingMetadata?.groundingChunks || []).forEach((g: any) => addSource(g.web?.uri, g.web?.title));
  } else if (p === 'gateway') {
    // Vercel AI Gateway, OpenAI-compatible endpoint. Model ids look like "anthropic/claude-haiku-4.5".
    const r = await post('https://ai-gateway.vercel.sh/v1/chat/completions', { Authorization: `Bearer ${key}` }, {
      model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: input }],
    });
    text = r.choices?.[0]?.message?.content || '';
  } else {
    const r = await post('https://api.openai.com/v1/responses', { Authorization: `Bearer ${key}` }, {
      model, instructions: system, input, max_output_tokens: maxTokens, store: false,
      ...(research ? { tools: [{ type: 'web_search' }] } : {}),
    });
    const outs = (r.output || []).flatMap((o: any) => o.content || []).filter((c: any) => c.type === 'output_text');
    text = outs.map((c: any) => c.text).join('\n');
    outs.forEach((c: any) => (c.annotations || []).forEach((a: any) => a.type === 'url_citation' && addSource(a.url, a.title)));
  }
  text = text.trim();
  if (!text) throw new AiError('The AI provider returned an empty reply.');
  return { text, sources };
}
