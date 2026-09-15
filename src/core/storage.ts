import type { ModelProvider } from './types';

const PROVIDERS_KEY = 'mvm.providers.v1';
const MODEL_KEY = 'mvm.model.v1';

export const defaultProviders: ModelProvider[] = [
  { id: 'ollama-local', name: 'Ollama (local)', kind: 'ollama', baseUrl: 'http://localhost:11434', enabled: true },
  { id: 'openai-compatible', name: 'OpenAI-compatible', kind: 'openai-compatible', baseUrl: '', enabled: false },
  { id: 'demo', name: 'MVM Demo', kind: 'demo', baseUrl: '', enabled: true }
];

export function loadProviders(): ModelProvider[] {
  try {
    const raw = localStorage.getItem(PROVIDERS_KEY);
    if (!raw) return defaultProviders;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as ModelProvider[] : defaultProviders;
  } catch {
    return defaultProviders;
  }
}

export function saveProviders(providers: ModelProvider[]) {
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
}

export function loadModel() {
  return localStorage.getItem(MODEL_KEY) ?? 'llama3.2';
}

export function saveModel(model: string) {
  localStorage.setItem(MODEL_KEY, model);
}
