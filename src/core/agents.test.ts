import { describe, expect, it } from 'vitest';
import { buildAgentPrompt, canAdvance, createAgentPlan, createAgentRun, roleLabel, updateAgentTask } from './agents';

describe('Agent Core', () => {
  it('creates a deterministic multi-agent plan', () => {
    const plan = createAgentPlan('Build a landing page');
    expect(plan.tasks.map(task => task.role)).toEqual(['planner', 'researcher', 'builder', 'reviewer', 'synthesizer']);
    expect(roleLabel('builder')).toBe('Builder');
  });

  it('enforces task dependencies and completes a run', () => {
    let run = createAgentRun('Analyze my project');
    const first = run.tasks[0];
    const second = run.tasks[1];
    expect(canAdvance(run, first)).toBe(true);
    expect(canAdvance(run, second)).toBe(false);

    run = updateAgentTask(run, first.id, { status: 'completed', output: 'Plan complete.' });
    expect(canAdvance(run, second)).toBe(true);

    for (const task of run.tasks.slice(1)) {
      run = updateAgentTask(run, task.id, { status: 'completed', output: `${task.title} complete.` });
    }
    expect(run.status).toBe('completed');
  });

  it('builds a context-aware prompt without claiming execution', () => {
    const run = createAgentRun('Review a TypeScript project');
    run = updateAgentTask(run, run.tasks[0].id, { status: 'completed', output: 'Found three modules.' });
    const prompt = buildAgentPrompt(run, run.tasks[1], 'src/main.ts: application entry point');
    expect(prompt).toContain('Researcher agent');
    expect(prompt).toContain('Found three modules.');
    expect(prompt).toContain('src/main.ts');
    expect(prompt).toContain('Do not execute arbitrary code');
  });
});
