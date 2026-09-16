import { describe, expect, it } from 'vitest';
import { addNode, connectNodes, createFlow, topologicalOrder, validateFlow } from './flow';

describe('Flow Engine', () => {
  it('creates a valid starter graph', () => {
    const flow = createFlow('Demo');
    expect(validateFlow(flow)).toEqual([]);
    expect(topologicalOrder(flow).map(n => n.kind)).toEqual(['prompt', 'model', 'output']);
  });

  it('adds nodes and connections safely', () => {
    let flow = createFlow();
    flow = addNode(flow, 'transform');
    const last = flow.nodes.at(-1)!;
    flow = connectNodes(flow, flow.nodes[1].id, last.id);
    expect(flow.edges.some(e => e.to === last.id)).toBe(true);
    expect(validateFlow(flow)).toEqual([]);
  });
});
