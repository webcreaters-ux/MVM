export type FlowNodeKind = 'prompt' | 'model' | 'transform' | 'condition' | 'output';

export interface FlowNode { id: string; kind: FlowNodeKind; title: string; config: Record<string, string>; x: number; y: number; }
export interface FlowEdge { id: string; from: string; to: string; }
export interface FlowDefinition { id: string; name: string; description: string; nodes: FlowNode[]; edges: FlowEdge[]; updatedAt: number; }

export const FLOW_NODE_KINDS: FlowNodeKind[] = ['prompt', 'model', 'transform', 'condition', 'output'];

export function createFlow(name = 'New Flow'): FlowDefinition {
  const now = Date.now();
  const prompt = createNode('prompt', 'Prompt', 80, 100, { prompt: '' });
  const model = createNode('model', 'AI Model', 360, 100, { model: 'default' });
  const output = createNode('output', 'Output', 640, 100, {});
  return { id: crypto.randomUUID(), name, description: 'Reusable local-first MVM automation.', nodes: [prompt, model, output], edges: [createEdge(prompt.id, model.id), createEdge(model.id, output.id)], updatedAt: now };
}

export function createNode(kind: FlowNodeKind, title = kind, x = 80, y = 80, config: Record<string, string> = {}): FlowNode {
  return { id: crypto.randomUUID(), kind, title, config, x, y };
}

export function createEdge(from: string, to: string): FlowEdge {
  if (!from || !to || from === to) throw new Error('A flow edge needs two different nodes.');
  return { id: crypto.randomUUID(), from, to };
}

export function addNode(flow: FlowDefinition, kind: FlowNodeKind): FlowDefinition {
  const index = flow.nodes.length;
  return { ...flow, nodes: [...flow.nodes, createNode(kind, kind[0].toUpperCase() + kind.slice(1), 80 + (index % 3) * 280, 100 + Math.floor(index / 3) * 150)], updatedAt: Date.now() };
}

export function connectNodes(flow: FlowDefinition, from: string, to: string): FlowDefinition {
  if (!flow.nodes.some(n => n.id === from) || !flow.nodes.some(n => n.id === to)) throw new Error('Both flow nodes must exist.');
  if (flow.edges.some(e => e.from === from && e.to === to)) return flow;
  return { ...flow, edges: [...flow.edges, createEdge(from, to)], updatedAt: Date.now() };
}

export function validateFlow(flow: FlowDefinition): string[] {
  const ids = new Set(flow.nodes.map(n => n.id));
  const errors: string[] = [];
  if (!flow.name.trim()) errors.push('Flow name is required.');
  if (!flow.nodes.length) errors.push('Add at least one node.');
  for (const edge of flow.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push('Flow contains an edge pointing to a missing node.');
    if (edge.from === edge.to) errors.push('A node cannot connect to itself.');
  }
  return [...new Set(errors)];
}

export function topologicalOrder(flow: FlowDefinition): FlowNode[] {
  const incoming = new Map(flow.nodes.map(n => [n.id, 0]));
  for (const edge of flow.edges) if (incoming.has(edge.to)) incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  const queue = flow.nodes.filter(n => incoming.get(n.id) === 0).map(n => n.id);
  const ordered: FlowNode[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    const node = flow.nodes.find(n => n.id === id); if (node) ordered.push(node);
    for (const edge of flow.edges.filter(e => e.from === id)) {
      const next = (incoming.get(edge.to) ?? 0) - 1; incoming.set(edge.to, next);
      if (next === 0) queue.push(edge.to);
    }
  }
  return ordered.length === flow.nodes.length ? ordered : [];
}
