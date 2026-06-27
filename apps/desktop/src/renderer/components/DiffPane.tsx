import React from 'react';

/**
 * Diff/approve view for a changed file. Full implementation (line/file/all
 * approve + revert) lands with the change-tracking host module.
 */
export function DiffPane({ path }: { path: string }) {
  const name = path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || path;
  return (
    <div className="grid h-full place-items-center px-6 text-center text-[13px] text-ink-faint">
      Reviewing changes to {name}…
    </div>
  );
}
