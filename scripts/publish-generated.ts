import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Copies build artifacts from generated/ into public/ so Vite dev and
 * production builds can serve combinations.json and profile downloads.
 */
export function publishGeneratedToPublic(root = process.cwd()): void {
  const generatedDir = resolve(root, 'generated');
  const publicDir = resolve(root, 'public');
  const manifestSrc = join(generatedDir, 'combinations.json');
  const profilesSrc = join(generatedDir, 'profiles');
  const profilesDest = join(publicDir, 'profiles');

  if (!existsSync(manifestSrc)) {
    throw new Error('generated/combinations.json not found — run build:profiles first');
  }

  mkdirSync(publicDir, { recursive: true });
  cpSync(manifestSrc, join(publicDir, 'combinations.json'));

  if (existsSync(profilesDest)) {
    rmSync(profilesDest, { recursive: true });
  }
  cpSync(profilesSrc, profilesDest, { recursive: true });
}
