export type ProviderKind = 'ollama' | 'openai-compatible' | 'demo';

export interface ModelProvider {
  id: string;
  name: string;
  kind: ProviderKind;
  baseUrl: string;
  enabled: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface RouterRequest {
  provider: ModelProvider;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}

export interface RouterResponse {
  content: string;
  provider: string;
  model: string;
}

export interface ProviderHealth {
  providerId: string;
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export interface ProjectFile {
  id: string;
  path: string;
  content: string;
  language: string;
  updatedAt: number;
}

export interface ForgeProject {
  id: string;
  name: string;
  files: ProjectFile[];
  updatedAt: number;
}
