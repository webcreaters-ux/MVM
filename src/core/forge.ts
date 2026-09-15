import type { ForgeProject, ProjectFile } from './types';

const extensionLanguage: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript-react', js: 'javascript', jsx: 'javascript-react',
  css: 'css', html: 'html', json: 'json', md: 'markdown', py: 'python', rs: 'rust',
  go: 'go', java: 'java', kt: 'kotlin', sh: 'shell', yaml: 'yaml', yml: 'yaml'
};

export function detectLanguage(path: string): string {
  const extension = path.toLowerCase().split('.').pop() ?? '';
  return extensionLanguage[extension] ?? 'text';
}

export function normalizePath(path: string): string {
  return path.trim().replace(/^\/+/, '').replace(/\\/g, '/').replace(/\/+/g, '/');
}

export function createFile(path: string, content = ''): ProjectFile {
  const normalized = normalizePath(path);
  if (!normalized) throw new Error('A file name is required.');
  return { id: crypto.randomUUID(), path: normalized, content, language: detectLanguage(normalized), updatedAt: Date.now() };
}

export function updateProjectFile(project: ForgeProject, fileId: string, content: string): ForgeProject {
  return { ...project, updatedAt: Date.now(), files: project.files.map(file => file.id === fileId ? { ...file, content, updatedAt: Date.now() } : file) };
}

export function removeProjectFile(project: ForgeProject, fileId: string): ForgeProject {
  return { ...project, updatedAt: Date.now(), files: project.files.filter(file => file.id !== fileId) };
}

export function projectStats(project: ForgeProject) {
  return { files: project.files.length, lines: project.files.reduce((total, file) => total + (file.content ? file.content.split('\n').length : 0), 0) };
}
