export type AgentRole = 'planner' | 'researcher' | 'builder' | 'reviewer' | 'synthesizer';

export interface AgentTask {
  id: string;
  title: string;
  role: AgentRole;
  instruction: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  output?: string;
  createdAt: number;
}

export interface AgentRun {
  id: string;
  goal: string;
  tasks: AgentTask[];
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface AgentPlan {
  goal: string;
  tasks: Array<Pick<AgentTask, 'title' | 'role' | 'instruction'>>;
}

export interface AgentExecutionResult {
  run: AgentRun;
  finalOutput: string;
}

export type AgentExecutor = (input: { prompt: string; role: AgentRole; task: AgentTask; run: AgentRun; signal?: AbortSignal }) => Promise<string>;

const ROLE_LABELS: Record<AgentRole, string> = {
  planner: 'Planner',
  researcher: 'Researcher',
  builder: 'Builder',
  reviewer: 'Reviewer',
  synthesizer: 'Synthesizer'
};

export function roleLabel(role: AgentRole): string {
  return ROLE_LABELS[role];
}

export function createAgentPlan(goal: string): AgentPlan {
  const clean = goal.trim();
  if (!clean) throw new Error('An agent goal is required.');

  return {
    goal: clean,
    tasks: [
      { title: 'Plan the task', role: 'planner', instruction: `Break this goal into safe, concrete steps and identify required inputs: ${clean}` },
      { title: 'Research context', role: 'researcher', instruction: `Gather relevant facts from the available local knowledge and workspace context for: ${clean}` },
      { title: 'Build a solution', role: 'builder', instruction: `Produce an implementation or actionable solution for: ${clean}` },
      { title: 'Review the result', role: 'reviewer', instruction: `Inspect the proposed result for correctness, missing requirements, unsafe assumptions and regressions: ${clean}` },
      { title: 'Synthesize the answer', role: 'synthesizer', instruction: `Combine the available outputs into a concise final result for: ${clean}` }
    ]
  };
}

export function createAgentRun(goal: string): AgentRun {
  const plan = createAgentPlan(goal);
  const now = Date.now();
  return {
    id: crypto.randomUUID(), goal: plan.goal,
    tasks: plan.tasks.map(task => ({ ...task, id: crypto.randomUUID(), status: 'queued', createdAt: now })),
    status: 'ready', createdAt: now, updatedAt: now
  };
}

export function updateAgentTask(run: AgentRun, taskId: string, patch: Partial<Pick<AgentTask, 'status' | 'output'>>): AgentRun {
  if (!run.tasks.some(task => task.id === taskId)) throw new Error('Agent task not found.');
  const tasks = run.tasks.map(task => task.id === taskId ? { ...task, ...patch } : task);
  const status: AgentRun['status'] = tasks.some(t => t.status === 'failed')
    ? 'failed'
    : tasks.every(t => t.status === 'completed')
      ? 'completed'
      : tasks.some(t => t.status === 'running')
        ? 'running'
        : 'ready';
  return { ...run, tasks, status, updatedAt: Date.now() };
}

export function buildAgentPrompt(run: AgentRun, task: AgentTask, context = ''): string {
  const previous = run.tasks
    .filter(candidate => candidate.id !== task.id && candidate.status === 'completed' && candidate.output)
    .map(candidate => `[${roleLabel(candidate.role)}] ${candidate.output}`)
    .join('\n\n');
  return [
    `You are the ${roleLabel(task.role)} agent inside MVM.`,
    `Overall goal: ${run.goal}`,
    `Current task: ${task.instruction}`,
    previous ? `Previous agent outputs:\n${previous}` : '',
    context ? `Available local context:\n${context}` : '',
    'Work only from supplied context and clearly state uncertainty. Do not execute arbitrary code or claim an action was performed unless it actually was.'
  ].filter(Boolean).join('\n\n');
}

export function canAdvance(run: AgentRun, task: AgentTask): boolean {
  const index = run.tasks.findIndex(candidate => candidate.id === task.id);
  if (index < 0) return false;
  if (index === 0) return true;
  return run.tasks.slice(0, index).every(candidate => candidate.status === 'completed');
}

export async function executeAgentRun(
  initialRun: AgentRun,
  executor: AgentExecutor,
  context = '',
  signal?: AbortSignal,
  onUpdate?: (run: AgentRun) => void
): Promise<AgentExecutionResult> {
  let run: AgentRun = { ...initialRun, status: 'running', updatedAt: Date.now() };
  onUpdate?.(run);

  for (const task of run.tasks) {
    if (signal?.aborted) throw new DOMException('Agent run cancelled.', 'AbortError');
    if (!canAdvance(run, task)) throw new Error(`Agent dependency blocked: ${task.title}`);

    run = updateAgentTask(run, task.id, { status: 'running' });
    onUpdate?.(run);
    try {
      const output = await executor({ prompt: buildAgentPrompt(run, task, context), role: task.role, task, run, signal });
      run = updateAgentTask(run, task.id, { status: 'completed', output: output.trim() || '(No output returned.)' });
      onUpdate?.(run);
    } catch (error) {
      run = updateAgentTask(run, task.id, { status: 'failed', output: error instanceof Error ? error.message : 'Agent task failed.' });
      onUpdate?.(run);
      throw error;
    }
  }

  const finalOutput = run.tasks.find(task => task.role === 'synthesizer')?.output ?? '';
  return { run, finalOutput };
}
