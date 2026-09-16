import { useMemo, useRef, useState } from 'react';
import { executeAgentRun, createAgentRun, roleLabel, type AgentRun } from '../core/agents';
import { routeChat } from '../core/router';
import { buildKnowledgeContext, searchKnowledge, type KnowledgeDocument } from '../core/knowledge';
import type { ForgeProject, ModelProvider } from '../core/types';
import type { FlowDefinition } from '../core/flow';

type Props = {
  provider: ModelProvider;
  model: string;
  knowledge: KnowledgeDocument[];
  project?: ForgeProject;
  flow?: FlowDefinition;
  onError: (message: string) => void;
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  planner: 'Breaks the goal into a concrete plan.',
  researcher: 'Retrieves relevant local knowledge.',
  builder: 'Creates the actionable or implementation result.',
  reviewer: 'Checks correctness, gaps and risky assumptions.',
  synthesizer: 'Combines the work into the final answer.'
};

function workspaceContext(project?: ForgeProject, flow?: FlowDefinition): string {
  const projectText = project
    ? `CODE FORGE PROJECT: ${project.name}\n${project.files.map(f => `FILE ${f.path} (${f.language})\n${f.content.slice(0, 4000)}`).join('\n\n')}`
    : 'CODE FORGE: No project selected.';
  const flowText = flow
    ? `FLOW ENGINE: ${flow.name}\nNodes: ${flow.nodes.map(n => `${n.kind}:${n.title}`).join(' -> ')}\nEdges: ${flow.edges.length}`
    : 'FLOW ENGINE: No flow selected.';
  return `${projectText}\n\n${flowText}`;
}

export function AgentCorePanel({ provider, model, knowledge, project, flow, onError }: Props) {
  const [goal, setGoal] = useState('');
  const [run, setRun] = useState<AgentRun | null>(null);
  const [finalOutput, setFinalOutput] = useState('');
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const knowledgePreview = useMemo(() => knowledge.length
    ? `${knowledge.length} local document${knowledge.length === 1 ? '' : 's'} available`
    : 'No local documents indexed yet', [knowledge.length]);

  async function start() {
    const clean = goal.trim();
    if (!clean || running) return;
    onError('');
    const initial = createAgentRun(clean);
    setRun(initial);
    setFinalOutput('');
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await executeAgentRun(
        initial,
        async ({ prompt, role }) => {
          let enriched = prompt;
          if (role === 'researcher') {
            const results = searchKnowledge(clean, knowledge, 6);
            enriched += `\n\nRETRIEVED KNOWLEDGE:\n${buildKnowledgeContext(results) || '(No matching local knowledge found.)'}`;
          }
          if (role === 'builder') {
            enriched += `\n\nCURRENT MVM WORKSPACE:\n${workspaceContext(project, flow)}`;
          }
          if (role === 'reviewer') {
            enriched += `\n\nWORKSPACE CHECK:\n${workspaceContext(project, flow)}`;
          }
          if (role === 'synthesizer') {
            enriched += `\n\nINTEGRATED WORKSPACE:\n${workspaceContext(project, flow)}`;
          }
          const response = await routeChat({
            provider,
            model,
            messages: [{ id: crypto.randomUUID(), role: 'user', content: enriched, createdAt: Date.now() }],
            signal: controller.signal
          });
          return response.content;
        },
        workspaceContext(project, flow),
        controller.signal,
        setRun
      );
      setRun(result.run);
      setFinalOutput(result.finalOutput);
      localStorage.setItem('mvm.agent.last.v1', JSON.stringify(result.run));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onError(error instanceof Error ? error.message : 'Agent execution failed.');
    } finally {
      abortRef.current = null;
      setRunning(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setRunning(false);
  }

  return <section className="workspace agent-page">
    <div className="workspace-head">
      <div>
        <span className="pill">AGENT CORE • 5 AGENTS</span>
        <h2>Give MVM one goal.</h2>
        <p>Planner → Researcher → Builder → Reviewer → Synthesizer, with your local workspace as context.</p>
      </div>
      <div className="head-actions"><span className="health"><i/> {provider.name} · {model}</span></div>
    </div>
    <div style={{padding:'18px'}}>
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'14px'}}>
        <textarea value={goal} onChange={e=>setGoal(e.target.value)} disabled={running} placeholder="Example: Build a landing page for my app with a clear mobile-first structure…" rows={3} style={{flex:'1 1 420px',minHeight:'74px',background:'#09090b',border:'1px solid #27272a',borderRadius:'10px',color:'#fff',padding:'13px',font:'inherit',resize:'vertical'}} />
        {!running ? <button className="primary" disabled={!goal.trim()} onClick={()=>void start()}>Run 5 agents ↗</button> : <button className="ghost" onClick={cancel}>Stop run</button>}
      </div>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'18px'}}>
        <span className="pill">AI HUB: CONNECTED</span>
        <span className="pill">KNOWLEDGE: {knowledgePreview}</span>
        <span className="pill">CODE FORGE: {project?.name ?? 'none'}</span>
        <span className="pill">FLOW: {flow?.name ?? 'none'}</span>
      </div>
      {run ? <>
        <div style={{display:'grid',gap:'8px'}}>
          {run.tasks.map((task, index) => <article key={task.id} style={{border:'1px solid #27272a',borderRadius:'12px',padding:'13px',background:'#111113',display:'grid',gridTemplateColumns:'34px 1fr auto',gap:'10px',alignItems:'start'}}>
            <strong style={{fontSize:'12px',border:'1px solid #3f3f46',borderRadius:'8px',padding:'7px',textAlign:'center'}}>{index + 1}</strong>
            <div><strong style={{display:'block'}}>{roleLabel(task.role)}</strong><small style={{display:'block',color:'#71717a',marginTop:'3px'}}>{AGENT_DESCRIPTIONS[task.role]}</small>{task.output && <p style={{whiteSpace:'pre-wrap',color:'#a1a1aa',fontSize:'11px',lineHeight:1.5,margin:'9px 0 0'}}>{task.output}</p>}</div>
            <span className="status">{task.status.toUpperCase()}</span>
          </article>)}
        </div>
        {finalOutput && <article className="forge-output" style={{marginTop:'14px'}}><div className="result-label">SYNTHESIZED RESULT</div><p>{finalOutput}</p></article>}
      </> : <div className="knowledge-empty">Enter one goal and MVM will visibly run all five agents in dependency order. Every AI step uses the configured AI Hub provider; no arbitrary code is executed.</div>}
    </div>
  </section>;
}
