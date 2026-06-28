/** Types for the Design board — a Figma-style board of an app's UI page snapshots. */

/** A persistent note pinned to a design page. */
export interface DesignNote {
  id: string;
  text: string;
  createdAt: number;
}

/** One UI page on the design board. The snapshot is a live, scaled-down preview. */
export interface DesignPage {
  id: string;
  /** Human label (e.g. "Home", "Settings"). */
  label: string;
  /** URL the page renders at (e.g. http://localhost:3000/about). */
  url: string;
  /** Persistent notes the user pinned to this page. */
  notes: DesignNote[];
  createdAt: number;
  updatedAt: number;
}

/** The design board for a single workspace. */
export interface DesignBoard {
  workspaceId: string;
  pages: DesignPage[];
}
