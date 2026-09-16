export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  updatedAt: number;
}

export interface KnowledgeResult {
  document: KnowledgeDocument;
  score: number;
  snippet: string;
}

const KEY = 'mvm.knowledge.documents.v1';
export const MAX_DOCUMENTS = 100;
export const MAX_DOCUMENT_SIZE = 750_000;
export const MAX_TOTAL_CHARS = 4_000_000;

const STOP_WORDS = new Set('a an and are as at be by for from has have i in is it its me of on or our that the their this to was were what when where which with you your'.split(' '));

function read(): KnowledgeDocument[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value as KnowledgeDocument[] : [];
  } catch { return []; }
}

function write(documents: KnowledgeDocument[]) {
  localStorage.setItem(KEY, JSON.stringify(documents.slice(-MAX_DOCUMENTS)));
}

export function loadKnowledge(): KnowledgeDocument[] { return read(); }

export function clearKnowledge() { localStorage.removeItem(KEY); }

export function addKnowledgeDocument(input: Omit<KnowledgeDocument, 'id' | 'updatedAt'>): KnowledgeDocument {
  if (!input.name.trim()) throw new Error('Document name is required.');
  if (input.content.length > MAX_DOCUMENT_SIZE) throw new Error('Document is larger than 750 KB.');
  const documents = read().filter(d => d.name !== input.name);
  const total = documents.reduce((sum, d) => sum + d.content.length, 0) + input.content.length;
  if (total > MAX_TOTAL_CHARS) throw new Error('Knowledge storage limit reached. Remove documents before adding more.');
  const document: KnowledgeDocument = { ...input, id: crypto.randomUUID(), updatedAt: Date.now() };
  write([...documents, document]);
  return document;
}

export function removeKnowledgeDocument(id: string): KnowledgeDocument[] {
  const documents = read().filter(d => d.id !== id);
  write(documents);
  return documents;
}

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9_]{2,}/g)?.filter(token => !STOP_WORDS.has(token)) ?? [];
}

function snippetFor(content: string, queryTokens: string[]): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();
  const positions = queryTokens.map(t => lower.indexOf(t)).filter(p => p >= 0);
  const center = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, center - 110);
  const end = Math.min(clean.length, start + 360);
  return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
}

export function searchKnowledge(query: string, documents = read(), limit = 8): KnowledgeResult[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const querySet = new Set(tokens);
  return documents.map(document => {
    const docTokens = tokenize(document.content);
    const counts = new Map<string, number>();
    for (const token of docTokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    let score = 0;
    for (const token of querySet) {
      const count = counts.get(token) ?? 0;
      if (count) score += 1 + Math.min(2, Math.log2(count + 1));
      if (document.name.toLowerCase().includes(token)) score += 2;
    }
    return { document, score, snippet: snippetFor(document.content, tokens) };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score).slice(0, Math.max(1, limit));
}

export function buildKnowledgeContext(results: KnowledgeResult[], maxChars = 12_000): string {
  let used = 0;
  const chunks: string[] = [];
  for (const result of results) {
    const chunk = `SOURCE: ${result.document.name}\n${result.snippet || result.document.content.slice(0, 1200)}`;
    if (used + chunk.length > maxChars) break;
    chunks.push(chunk);
    used += chunk.length;
  }
  return chunks.join('\n\n---\n\n');
}

export function indexProjectFiles(files: Array<{ path: string; language: string; content: string }>): number {
  let count = 0;
  for (const file of files) {
    if (!file.content.trim() || file.content.length > MAX_DOCUMENT_SIZE) continue;
    addKnowledgeDocument({ name: `Code Forge / ${file.path}`, type: file.language, size: file.content.length, content: file.content });
    count++;
  }
  return count;
}
