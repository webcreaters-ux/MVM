import type { ChatMessage, ModelProvider, RouterRequest, RouterResponse } from './types';

function lastUserMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find(message => message.role === 'user')?.content ?? '';
}

function providerConnectionError(provider: ModelProvider): Error {
  const base = provider.baseUrl.trim();
  if (provider.kind === 'ollama' && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(base)) {
    return new Error('Ollama is set to localhost. On a phone, localhost means the phone itself. If Ollama runs on your PC, open Settings and use the PC LAN address (for example http://192.168.1.10:11434), then allow Ollama to accept LAN connections.');
  }
  if (window.location.protocol === 'https:' && /^http:\/\//i.test(base)) {
    return new Error('The browser blocked the AI connection because MVM is using HTTPS but the provider URL uses HTTP. Use an HTTPS provider endpoint or run MVM and the provider in a compatible local environment.');
  }
  return new Error(`MVM could not reach ${provider.name}. Check the provider URL, network connection, CORS settings, and that the model server is running.`);
}

async function safeFetch(input: RequestInfo | URL, init: RequestInit, provider: ModelProvider): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw providerConnectionError(provider);
  }
}

async function callOllama(request: RouterRequest): Promise<RouterResponse> {
  const base = request.provider.baseUrl.replace(/\/$/, '');
  const response = await safeFetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages.map(({ role, content }) => ({ role, content })),
      stream: false
    }),
    signal: request.signal
  }, request.provider);
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}. Check that Ollama is running and the selected model exists.`);
  const data = await response.json() as { message?: { content?: string } };
  return { content: data.message?.content ?? 'The local model returned an empty response.', provider: request.provider.name, model: request.model };
}

async function callOpenAICompatible(request: RouterRequest): Promise<RouterResponse> {
  const base = request.provider.baseUrl.replace(/\/$/, '');
  const response = await safeFetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages.map(({ role, content }) => ({ role, content })),
      stream: false
    }),
    signal: request.signal
  }, request.provider);
  if (!response.ok) throw new Error(`OpenAI-compatible endpoint returned HTTP ${response.status}. Check the endpoint and model.`);
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
