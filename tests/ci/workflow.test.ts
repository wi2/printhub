import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const workflowPath = join(process.cwd(), '.github/workflows/ci.yml');

/**
 * Ensures the CI workflow exists and runs the required build, test, and E2E steps
 * defined in S-5.1 acceptance criteria.
 */
describe('CI workflow', () => {
  it('runs install, profile build, app build, tests, and E2E on push to main', () => {
    const workflow = parse(readFileSync(workflowPath, 'utf-8')) as {
      on: { push: { branches: string[] } };
      jobs: { ci: { steps: Array<{ run?: string }> } };
    };

    expect(workflow.on.push.branches).toEqual(expect.arrayContaining(['main']));

    const commands = workflow.jobs.ci.steps
      .map(step => step.run)
      .filter((run): run is string => run !== undefined);

    expect(commands).toEqual(
      expect.arrayContaining([
        'npm ci',
        'npm run build:profiles',
        'npm run build',
        'npm run test',
        'npm run test:e2e',
      ]),
    );
  });
});
