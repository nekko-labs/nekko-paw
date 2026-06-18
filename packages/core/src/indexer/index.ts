export * from './outline.js';

/** Directories and patterns the indexer always skips. */
export const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'out', 'build', '.next', '.nuxt', 'target',
  '.venv', 'venv', '__pycache__', '.cache', 'coverage', '.idea', '.vscode',
  'vendor', '.turbo', 'release',
]);

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf', 'zip', 'gz', 'tar', 'exe',
  'dll', 'so', 'dylib', 'woff', 'woff2', 'ttf', 'mp4', 'mp3', 'wav', 'bin',
]);

export function isIndexable(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase();
  return !ext || !BINARY_EXT.has(ext);
}
