import type { ModelProvider } from './types';

export interface VisionRequest {
  provider: ModelProvider;
  model: string;
  imageDataUrl: string;
  prompt: string;
  signal?: AbortSignal;
}

export interface VisionResponse {
  content: string;
  provider: string;
  model: string;
}

function cleanBaseUrl(url: string) {
  return url.replace(/\/$/, '');
}

export async function analyzeImage(request: VisionRequest): Promise<VisionResponse> {
  if (request.provider.kind === 'demo') {
    return {
      content: `MVM Vision Demo received your image.\n\nPrompt: ${request.prompt}\n\nConnect a vision-capable Ollama or OpenAI-compatible model in Settings for real image analysis.`,
      provider: request.provider.name,
      model: request.model
    };
  }

  if (!request.provider.baseUrl.trim()) {
    throw new Error('This provider needs a base URL in Settings.');
  }

  if (request.provider.kind === 'ollama') {
    const response = await fetch(`${cleanBaseUrl(request.provider.baseUrl)}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: [{ role: 'user', content: request.prompt, images: [request.imageDataUrl.split(',')[1]] }],
        stream: false
      }),
      signal: request.signal
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
    const data = await response.json() as { message?: { content?: string } };
    return { content: data.message?.content ?? 'The vision model returned an empty response.', provider: request.provider.name, model: request.model };
  }

  const response = await fetch(`${cleanBaseUrl(request.provider.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: request.prompt },
          { type: 'image_url', image_url: { url: request.imageDataUrl } }
        ]
      }],
      stream: false
    }),
    signal: request.signal
  });
  if (!response.ok) throw new Error(`OpenAI-compatible endpoint returned HTTP ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return { content: data.choices?.[0]?.message?.content ?? 'The vision model returned an empty response.', provider: request.provider.name, model: request.model };
}
