import { describe, expect, it } from 'vitest';
import { routeChat } from './router';
import type { ChatMessage, ModelProvider } from './types';

const demo: ModelProvider = { id: 'demo', name: 'MVM Demo', kind: 'demo', baseUrl: '', enabled: true };
const messages: ChatMessage[] = [{ id: '1', role: 'user', content: 'hello MVM', createdAt: 0 }];

describe('MVM router', () => {
  it('returns a deterministic demo response without network access', async () => {
    const result = await routeChat({ provider: demo, model: 'demo', messages });
    expect(result.provider).toBe('MVM Demo');
    expect(result.content).toContain('hello MVM');
  });

  it('rejects an OpenAI-compatible provider without a URL', async () => {
    const provider: ModelProvider = { id: 'x', name: 'Remote', kind: 'openai-compatible', baseUrl: '', enabled: true };
    await expect(routeChat({ provider, model: 'test', messages })).rejects.toThrow('base URL');
  });
});
