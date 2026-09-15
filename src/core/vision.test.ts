import { describe, expect, it } from 'vitest';
import { analyzeImage } from './vision';

const demo = { id: 'demo', name: 'MVM Demo', kind: 'demo' as const, baseUrl: '', enabled: true };

describe('Vision Lab', () => {
  it('returns a safe demo response without a network request', async () => {
    const result = await analyzeImage({
      provider: demo,
      model: 'demo-model',
      imageDataUrl: 'data:image/png;base64,AAAA',
      prompt: 'What is in this image?'
    });
    expect(result.provider).toBe('MVM Demo');
    expect(result.content).toContain('Vision Demo');
    expect(result.content).toContain('What is in this image?');
  });
});
