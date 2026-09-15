import type { ChatMessage, ForgeProject, ModelProvider } from './types';

const PROVIDERS_KEY = 'mvm.providers.v1';
const MODEL_KEY = 'mvm.model.v1';
const CHAT_KEY = 'mvm.chat.v1';
const FORGE_KEY = 'mvm.forge.projects.v1';

export const defaultProviders: ModelProvider[] = [
  { id: 'ollama-local', name: 'Ollama (local)', kind: 'ollama', baseUrl: 'http://localhost:11434', enabled: true },
  { id: 'openai-compatible', name: 'OpenAI-compatible', kind: 'openai-compatible', baseUrl: '', enabled: false },
  { id: 'demo', name: 'MVM Demo', kind: 'demo', baseUrl: '', enabled: true }
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function loadProviders(): ModelProvider[] {
  const parsed = readJson<unknown>(PROVIDERS_KEY, defaultProviders);
  return Array.isArray(parsed) ? parsed as ModelProvider[] : defaultProviders;
}

export function saveProviders(providers: ModelProvider[]) { localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers)); }
export function loadModel() { return localStorage.getItem(MODEL_KEY) ?? 'llama3.2'; }
export function saveModel(model: string) { localStorage.setItem(MODEL_KEY, model.trim() || 'llama3.2'); }
export function loadChat(): ChatMessage[] {
  const parsed = readJson<unknown>(CHAT_KEY, []);
  return Array.isArray(parsed) ? parsed as ChatMessage[] : [];
}
export function saveChat(messages: ChatMessage[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-100))); }
export function clearChat() { localStorage.removeItem(CHAT_KEY); }

const starterProject: ForgeProject = {
  id: 'starter', name: 'MVM Starter', updatedAt: Date.now(), files: [
    { id: 'starter-index', path: 'README.md', language: 'markdown', content: '# MVM Starter\n\nA private project managed by Code Forge.\n', updatedAt: Date.now() },
    { id: 'starter-app', path: 'app.ts', language: 'typescript', content: 'export function hello(name: string) {\n  return `Hello, ${name}!`;\n}\n', updatedAt: Date.now() }
  ]
};

export function loadForgeProjects(): ForgeProject[] {
  const parsed = readJson<unknown>(FORGE_KEY, [starterProject]);
  return Array.isArray(parsed) && parsed.length ? parsed as ForgeProject[] : [starterProject];
}
export function saveForgeProjects(projects: ForgeProject[]) {
  localStorage.setItem(FORGE_KEY, JSON.stringify(projects.slice(-20)));
}
