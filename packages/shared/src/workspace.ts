/** Workspace folders + codebase index types. */

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  addedAt: number;
}

export interface IndexedFile {
  path: string;
  /** Relative to its workspace root. */
  relPath: string;
  sizeBytes: number;
  language?: string;
  /** Code symbols discovered by the lightweight outline parser. */
  symbols: CodeSymbol[];
}

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'method' | 'export';
  line: number;
}

export interface IndexStatus {
  workspaceId: string;
  fileCount: number;
  symbolCount: number;
  /** 0..1 */
  progress: number;
  state: 'idle' | 'indexing' | 'ready' | 'error';
  updatedAt: number;
}

export interface SearchHit {
  path: string;
  relPath: string;
  line: number;
  text: string;
}
