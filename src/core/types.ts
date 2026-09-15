export type MVMModuleId = 'hub' | 'vision' | 'code' | 'flows' | 'vault' | 'modules';

export type ProviderKind = 'local' | 'remote';

export interface AIProvider {
  id: string;
  name: string;
  kind: ProviderKind;
  endpoint: string;
  enabled: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface MVMSettings {
  theme: 'dark' | 'light';
  activeModule: MVMModuleId;
  providers: AIProvider[];
}
