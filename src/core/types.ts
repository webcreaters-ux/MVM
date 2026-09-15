export type ProviderKind = 'ollama' | 'openai-compatible' | 'demo';

export type ModelProvider = {
  id: string;
  name: string;
  kind: ProviderKind;
  baseUrl: string;
  enabled: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
};

export type RouterRequest = {
  provider: ModelProvider;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
};

export type RouterResponse = {
  content: string;
  provider: string;
  model: string;
};
