import type { ChatMessage, ModelProvider, RouterRequest, RouterResponse } from './types';

function lastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find(message => message.role === 'user')?.content ?? '';
}

async function callOllama(request: RouterRequest): Promise<RouterResponse> {
  const response = await fetch(`${request.provider.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages.map(({ role, content }) => ({ role, content })),
      stream: false
    }),
    signal: request.signal
  });
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
  const data = await response.json() as { message?: { content?: string } };
  return { content: data.message?.content ?? 'The local model returned an empty response.', provider: request.provider.name, model: request.model };
}

async function callOpenAICompatible(request: RouterRequest): Promise<RouterResponse> {
  const response = await fetch(`${request.provider.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages.map(({ role, content }) => ({ role, content })),
      stream: false
    }),
    signal: request.signal
  });
  if (!response.ok) throw new Error(`OpenAI-compatible endpoint returned HTTP ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return { content: data.choices?.[0]?.message?.content ?? 'The provider returned an empty response.', provider: request.provider.name, model: request.model };
}

function demoResponse(request: RouterRequest): RouterResponse {
  const prompt = lastUserMessage(request.messages);
  return {
    content: `MVM Demo Mode received: “${prompt}”\n\nConnect Ollama or an OpenAI-compatible endpoint in Settings to run a real model. Your provider configuration stays in this browser.`,
    provider: request.provider.name,
    model: request.model
  };
}

export async function routeChat(request: RouterRequest): Promise<RouterResponse> {
  if (request.provider.kind === 'demo') return demoResponse(request);
  if (!request.provider.baseUrl.trim()) throw new Error('This provider needs a base URL in Settings.');
  if (request.provider.kind === 'ollama') return callOllama(request);
  return callOpenAICompatible(request);
}

export async function checkProvider(provider: ModelProvider): Promise<boolean> {
  if (provider.kind === 'demo') return true;
  if (!provider.baseUrl.trim()) return false;
  try {
    const response = await fetch(provider.kind === 'ollama' ? `${provider.baseUrl.replace(/\/$/, '')}/api/tags` : provider.baseUrl, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}
