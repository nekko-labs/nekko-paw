import { existsSync, mkdirSync } from 'fs';

/**
 * The host's data directory is injected by each runtime (Electron passes
 * `app.getPath('userData')/nekko`; the web server passes its own dir) so the
 * service layer stays free of any runtime-specific dependency.
 */
let _dir = '';

export function setDataDir(dir: string): void {
  _dir = dir;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function dataDir(): string {
  if (!_dir) throw new Error('Host not initialized — call createHost({ dataDir }) first.');
  return _dir;
}
