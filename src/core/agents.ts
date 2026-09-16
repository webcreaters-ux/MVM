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
      {
        title: 'Plan the task',
        role: 'planner',
        instruction: `Break this goal into safe, concrete steps and identify required inputs: ${clean}`
      },
      {
        title: 'Research context',
        role: 'researcher',
        instruction: `Gather relevant facts from the available local knowledge and workspace context for: ${clean}`
      },
      {
        title: 'Build a solution',
        role: 'builder',
        instruction: `Produce an implementation or actionable solution for: ${clean}`
      },
      {
        title: 'Review the result',
        role: 'reviewer',
        instruction: `Inspect the proposed result for correctness, missing requirements, unsafe assumptions and regressions: ${clean}`
      },
      {
        title: 'Synthesize the answer',
        role: 'synthesizer',
        instruction: `Combine the available outputs into a concise final result for: ${clean}`
      }
    ]
  };
}

export function createAgentRun(goal: string): AgentRun {
  const plan = createAgentPlan(goal);
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    goal: plan.goal,
    tasks: plan.tasks.map(task => ({ ...task, id: crypto.randomUUID(), status: 'queued', createdAt: now })),
    status: 'ready',
    createdAt: now,
    updatedAt: now
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
  if (index <= 0) return true;
  return run.tasks.slice(0, index).every(candidate => candidate.status === 'completed');
}
