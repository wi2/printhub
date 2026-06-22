import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const workflowsDir = join(process.cwd(), '.github/workflows');
const nvmrcPath = join(process.cwd(), '.nvmrc');
const packageJsonPath = join(process.cwd(), 'package.json');

/** Minimum major versions that declare a Node 24 JavaScript action runtime. */
const NODE24_COMPATIBLE_MIN_MAJOR = {
  'actions/checkout': 7,
  'actions/setup-node': 6,
} as const;

/** Majors that run on Node 20 and emit GitHub Actions deprecation warnings. */
const DEPRECATED_ACTION_MAJORS = [1, 2, 3, 4] as const;

type WorkflowStep = {
  name?: string;
  uses?: string;
  with?: Record<string, string | number | boolean>;
  run?: string;
};

type WorkflowJob = {
  steps?: WorkflowStep[];
};

type Workflow = {
  on?: { push?: { branches?: string[] } };
  jobs?: Record<string, WorkflowJob>;
};

type ParsedActionRef = {
  name: string;
  major: number;
};

/**
 * Parses `owner/repo@vN` action references. Returns undefined for non-semver tags.
 */
function parseActionRef(uses: string): ParsedActionRef | undefined {
  const match = uses.match(/^([^@]+)@v(\d+)/);
  if (!match) {
    return undefined;
  }

  return { name: match[1], major: Number(match[2]) };
}

/**
 * Loads every workflow YAML file under `.github/workflows/`.
 */
function loadWorkflowFiles(): { file: string; workflow: Workflow }[] {
  return readdirSync(workflowsDir)
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map(file => ({
      file,
      workflow: parse(readFileSync(join(workflowsDir, file), 'utf-8')) as Workflow,
    }));
}

/**
 * Collects all `uses:` steps across every job in a workflow file.
 */
function collectActionSteps(workflow: Workflow): WorkflowStep[] {
  const jobs = workflow.jobs ?? {};

  return Object.values(jobs).flatMap(job => job.steps ?? []).filter(step => step.uses !== undefined);
}

/**
 * Ensures CI workflows use `.nvmrc` for application Node, Node 24–compatible action
 * majors, and the required build, test, and E2E steps from S-5.1.
 */
describe('CI workflow', () => {
  const pinnedNodeVersion = readFileSync(nvmrcPath, 'utf-8').trim();
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    engines?: { node?: string };
  };
  const workflowFiles = loadWorkflowFiles();

  it('reads Node version from .nvmrc via setup-node', () => {
    for (const { file, workflow } of workflowFiles) {
      const setupNodeStep = collectActionSteps(workflow).find(step =>
        step.uses?.startsWith('actions/setup-node@'),
      );

      expect(setupNodeStep, `${file} must configure setup-node`).toBeDefined();
      expect(setupNodeStep?.with?.['node-version-file']).toBe('.nvmrc');
      expect(setupNodeStep?.with?.['node-version']).toBeUndefined();
    }
  });

  it('does not hardcode node-version in any workflow step', () => {
    for (const { file, workflow } of workflowFiles) {
      for (const step of collectActionSteps(workflow)) {
        expect(
          step.with?.['node-version'],
          `${file} must not hardcode node-version on ${step.uses}`,
        ).toBeUndefined();
      }
    }
  });

  it('uses Node 24 compatible checkout and setup-node action majors', () => {
    for (const { file, workflow } of workflowFiles) {
      for (const step of collectActionSteps(workflow)) {
        const actionRef = step.uses ? parseActionRef(step.uses) : undefined;
        if (!actionRef) {
          continue;
        }

        const minimumMajor =
          NODE24_COMPATIBLE_MIN_MAJOR[
            actionRef.name as keyof typeof NODE24_COMPATIBLE_MIN_MAJOR
          ];

        if (minimumMajor === undefined) {
          continue;
        }

        expect(
          actionRef.major,
          `${file} ${step.uses} must be at least v${minimumMajor} for Node 24 runtime`,
        ).toBeGreaterThanOrEqual(minimumMajor);
      }
    }
  });

  it('does not reference deprecated checkout or setup-node action majors', () => {
    for (const { file, workflow } of workflowFiles) {
      for (const step of collectActionSteps(workflow)) {
        const actionRef = step.uses ? parseActionRef(step.uses) : undefined;
        if (!actionRef) {
          continue;
        }

        if (
          actionRef.name !== 'actions/checkout' &&
          actionRef.name !== 'actions/setup-node'
        ) {
          continue;
        }

        expect(
          DEPRECATED_ACTION_MAJORS,
          `${file} ${step.uses} uses a Node 20 action runtime`,
        ).not.toContain(actionRef.major);
      }
    }
  });

  it('keeps package.json engines.node aligned with .nvmrc', () => {
    expect(packageJson.engines?.node).toBe(pinnedNodeVersion);
  });

  it('runs install, profile build, app build, tests, and E2E on push to main', () => {
    const ciWorkflow = workflowFiles.find(({ file }) => file === 'ci.yml');
    expect(ciWorkflow).toBeDefined();

    expect(ciWorkflow?.workflow.on?.push?.branches).toEqual(
      expect.arrayContaining(['main']),
    );

    const commands = (ciWorkflow?.workflow.jobs?.ci?.steps ?? [])
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
