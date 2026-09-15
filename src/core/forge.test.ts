import { describe, expect, it } from 'vitest';
import { createFile, detectLanguage, normalizePath, projectStats, updateProjectFile } from './forge';
import type { ForgeProject } from './types';

describe('Code Forge', () => {
  it('detects common languages and normalizes paths', () => {
    expect(detectLanguage('src/App.tsx')).toBe('typescript-react');
    expect(normalizePath('/src\\main.ts')).toBe('src/main.ts');
  });

  it('creates and updates files without executing them', () => {
    const file = createFile('src/index.ts', 'const x = 1;');
    const project: ForgeProject = { id: 'p', name: 'Test', files: [file], updatedAt: 0 };
    const updated = updateProjectFile(project, file.id, 'const x = 2;\n');
    expect(updated.files[0].content).toContain('2');
    expect(projectStats(updated)).toEqual({ files: 1, lines: 2 });
  });
});
