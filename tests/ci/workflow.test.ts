import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const workflowPath = join(process.cwd(), '.github/workflows/ci.yml');
const nvmrcPath = join(process.cwd(), '.nvmrc');
const packageJsonPath = join(process.cwd(), 'package.json');

type WorkflowStep = {
  name?: string;
  uses?: string;
  with?: Record<string, string>;
  run?: string;
};

type Workflow = {
  on: { push: { branches: string[] } };
  jobs: { ci: { steps: WorkflowStep[] } };
};

/**
 * Ensures the CI workflow exists, uses the pinned Node version from `.nvmrc`,
 * and runs the required build, test, and E2E steps defined in S-5.1 acceptance criteria.
 */
describe('CI workflow', () => {
  const pinnedNodeVersion = readFileSync(nvmrcPath, 'utf-8').trim();
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    engines?: { node?: string };
  };

  it('reads Node version from .nvmrc via setup-node', () => {
    const workflow = parse(readFileSync(workflowPath, 'utf-8')) as Workflow;

    const setupNodeStep = workflow.jobs.ci.steps.find(
      step => step.uses?.startsWith('actions/setup-node@'),
    );

    expect(setupNodeStep).toBeDefined();
    expect(setupNodeStep?.with?.['node-version-file']).toBe('.nvmrc');
    expect(setupNodeStep?.with?.['node-version']).toBeUndefined();
  });

  it('keeps package.json engines.node aligned with .nvmrc', () => {
    expect(packageJson.engines?.node).toBe(pinnedNodeVersion);
  });

  it('runs install, profile build, app build, tests, and E2E on push to main', () => {
    const workflow = parse(readFileSync(workflowPath, 'utf-8')) as Workflow;

    expect(workflow.on.push.branches).toEqual(expect.arrayContaining(['main']));

    const commands = workflow.jobs.ci.steps
      .map(step => step.run)
      .filter((run): run is string => run !== undefined);

    expect(commands).toEqual(
      expect.arrayContaining([
        'npm ci',
        'npm run build:profiles',
        'npm run build',
        'npm run typecheck',
        'npm run test',
        'npm run test:e2e',
      ]),
    );
  });
});
