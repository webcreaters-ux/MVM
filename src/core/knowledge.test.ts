import { describe, expect, it } from 'vitest';
import { buildKnowledgeContext, searchKnowledge, tokenize } from './knowledge';

const docs = [
  { id: 'a', name: 'alpha.md', type: 'markdown', size: 80, content: 'MVM is a local-first AI workspace with a Flow Engine and Knowledge Workspace.', updatedAt: 1 },
  { id: 'b', name: 'beta.txt', type: 'text', size: 80, content: 'A recipe contains flour, water and salt.', updatedAt: 1 }
];

describe('Knowledge Workspace', () => {
  it('tokenizes useful terms and removes common stop words', () => {
    expect(tokenize('The MVM local AI workspace')).toEqual(['mvm', 'local', 'ai', 'workspace']);
  });

  it('ranks matching documents and builds bounded context', () => {
    const results = searchKnowledge('MVM Knowledge', docs);
    expect(results[0].document.name).toBe('alpha.md');
    expect(buildKnowledgeContext(results, 100)).toContain('SOURCE: alpha.md');
  });
});
