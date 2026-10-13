import test from 'node:test';
import assert from 'node:assert/strict';
import {activeProvider, activeModel} from '../lib/ai.ts';

const KEYS = ['NOVA_PROVIDER', 'NOVA_MODEL', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'AI_GATEWAY_API_KEY', 'OPENAI_API_KEY', 'OPENAI_MODEL'];
function env(vars: Record<string, string>) { for (const k of KEYS) delete process.env[k]; Object.assign(process.env, vars); }

test('no keys means Nova is not active', () => { env({}); assert.equal(activeProvider(), null); });
test('auto-picks the first configured provider', () => {
  env({GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o'}); assert.equal(activeProvider(), 'gemini');
  env({ANTHROPIC_API_KEY: 'a', GEMINI_API_KEY: 'g'}); assert.equal(activeProvider(), 'anthropic');
});
test('NOVA_PROVIDER wins, but only when its key exists', () => {
  env({NOVA_PROVIDER: 'Gateway', ANTHROPIC_API_KEY: 'a', AI_GATEWAY_API_KEY: 'v'}); assert.equal(activeProvider(), 'gateway');
  env({NOVA_PROVIDER: 'gemini', ANTHROPIC_API_KEY: 'a'}); assert.equal(activeProvider(), null);
  env({NOVA_PROVIDER: 'unknown', ANTHROPIC_API_KEY: 'a'}); assert.equal(activeProvider(), null);
});
test('model defaults and overrides', () => {
  env({}); assert.equal(activeModel('gemini'), 'gemini-2.5-flash');
  env({OPENAI_MODEL: 'x'}); assert.equal(activeModel('openai'), 'x');
  env({NOVA_MODEL: 'y', OPENAI_MODEL: 'x'}); assert.equal(activeModel('openai'), 'y');
});
