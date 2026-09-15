import type { AIProvider } from './types';

export const defaultProviders: AIProvider[] = [
  { id: 'ollama', name: 'Ollama', kind: 'local', endpoint: 'http://localhost:11434', enabled: true },
  { id: 'openai-compatible', name: 'OpenAI-compatible', kind: 'remote', endpoint: '', enabled: false },
];

export function selectProvider(providers: AIProvider[]): AIProvider | undefined {
  return providers.find((provider) => provider.enabled);
}
