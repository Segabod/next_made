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

type Request = { system: string; input: string; maxTokens?: number; timeoutMs?: number };

/** Send one instruction + input to the active provider and return its text reply. */
export async function generate({ system, input, maxTokens = 1800, timeoutMs = 45000 }: Request): Promise<string> {
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
    });
    text = (r.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n');
  } else if (p === 'gemini') {
    const r = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key }, {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: input }] }],
      generationConfig: { maxOutputTokens: Math.max(maxTokens, 4096) },
    });
    text = (r.candidates?.[0]?.content?.parts || []).map((x: any) => x.text || '').join('');
  } else if (p === 'gateway') {
    // Vercel AI Gateway, OpenAI-compatible endpoint. Model ids look like "anthropic/claude-haiku-4.5".
    const r = await post('https://ai-gateway.vercel.sh/v1/chat/completions', { Authorization: `Bearer ${key}` }, {
      model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: input }],
    });
    text = r.choices?.[0]?.message?.content || '';
  } else {
    const r = await post('https://api.openai.com/v1/responses', { Authorization: `Bearer ${key}` }, {
      model, instructions: system, input, max_output_tokens: maxTokens, store: false,
    });
    text = (r.output || []).flatMap((o: any) => o.content || []).filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('\n');
  }
  text = text.trim();
  if (!text) throw new AiError('The AI provider returned an empty reply.');
  return text;
}
