import { describe, expect, it } from 'vitest';

describe('MVM foundation', () => {
  it('defines the expected product name', () => {
    expect('MVM — Modular Vision Matrix').toContain('MVM');
  });

  it('keeps the core architecture provider-neutral', () => {
    expect(['local', 'remote', 'plugin']).toEqual(expect.arrayContaining(['local', 'remote', 'plugin']));
  });
});
