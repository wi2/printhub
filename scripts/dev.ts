import { spawn, type ChildProcess } from 'node:child_process';

const children: ChildProcess[] = [];

function run(command: string, args: string[]): void {
  const child = spawn(command, args, { stdio: 'inherit' });
  children.push(child);

  child.on('exit', code => {
    if (code !== null && code !== 0) {
      shutdown('SIGTERM', code);
    }
  });
}

function shutdown(signal: NodeJS.Signals, exitCode = 0): void {
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

run('tsx', ['server/index.ts']);
run('vite', []);
