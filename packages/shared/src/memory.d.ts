/** Memory store types — markdown-backed notes, global or per-workspace. */
export type MemoryScope = 'global' | 'workspace';
export interface MemoryEntry {
    id: string;
    scope: MemoryScope;
    /** Workspace id when scope === 'workspace'. */
    workspaceId?: string;
    title: string;
    body: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}
