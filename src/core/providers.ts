import type { ModelProvider } from './types';

export const defaultProviders: ModelProvider[] = [
  { id: 'ollama-local', name: 'Ollama (local)', kind: 'ollama', baseUrl: 'http://localhost:11434', enabled: true },
  { id: 'openai-compatible', name: 'OpenAI-compatible', kind: 'openai-compatible', baseUrl: '', enabled: false },
  { id: 'demo', name: 'MVM Demo', kind: 'demo', baseUrl: '', enabled: true }
];

export function selectProvider(providers: ModelProvider[]): ModelProvider | undefined {
  return providers.find((provider) => provider.enabled);
}
