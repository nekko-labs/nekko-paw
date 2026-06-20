import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createProvider } from '@open-paw/core';
import { getSettings } from './store.js';
import { getSession } from './sessions.js';

const SPEC_FILE = 'spec.md';

/** Absolute path of the spec.md for a chat's workspace, or null if no workspace. */
export function specPathForSession(sessionId: string): string | null {
  const session = getSession(sessionId);
  if (!session?.workspaceId) return null;
  const folder = getSettings().workspaces.find((w) => w.id === session.workspaceId);
  return folder ? join(folder.path, SPEC_FILE) : null;
}

const SYSTEM = `You maintain a project's spec.md, synthesized from an ongoing working conversation between a user and an AI assistant.
Write a clear, well-structured markdown spec with sections like: Overview, Goals, Requirements, Design / Decisions, Open Questions, and Next Steps.
If an existing spec is provided, UPDATE it to reflect the latest conversation — keep still-valid content, revise what changed, add what's new.
Be concise and concrete. Output ONLY the markdown for spec.md, with no preamble or code fences.`;

/**
 * Synthesize (or update) spec.md in the chat's workspace from the conversation.
 * Uses the session's own provider/model. One-shot, no tools.
 */
export async function buildSpec(sessionId: string): Promise<{ ok: boolean; path?: string; message?: string }> {
  const session = getSession(sessionId);
  if (!session) return { ok: false, message: 'Session not found.' };
  if (!session.workspaceId) return { ok: false, message: 'Add a project folder to this chat first.' };
  const folder = getSettings().workspaces.find((w) => w.id === session.workspaceId);
  if (!folder) return { ok: false, message: 'Workspace not found.' };

  const provider = getSettings().providers.find((p) => p.id === session.providerId);
  if (!provider || !session.modelId) return { ok: false, message: 'Pick a provider and model, then chat first.' };

  const transcript = session.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `## ${m.role === 'user' ? 'User' : 'Assistant'}\n${m.content}`)
    .join('\n\n')
    .slice(0, 60000);
  if (!transcript.trim()) return { ok: false, message: 'Nothing to build a spec from yet.' };

  const path = join(folder.path, SPEC_FILE);
  const existing = existsSync(path) ? readFileSync(path, 'utf8').slice(0, 40000) : '';
  const prompt =
    (existing ? `Existing spec.md:\n\n${existing}\n\n---\n\n` : '') +
    `Conversation so far:\n\n${transcript}\n\n---\n\nWrite the updated spec.md.`;

  let out = '';
  try {
    for await (const chunk of createProvider(provider).chat({
      model: session.modelId,
      system: SYSTEM,
      messages: [{ id: 'spec', role: 'user', content: prompt, createdAt: Date.now() }],
      temperature: 0.3,
    })) {
      if (chunk.type === 'text') out += chunk.delta;
    }
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  out = out.replace(/^```(?:markdown|md)?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  if (!out) return { ok: false, message: 'The model returned an empty spec.' };
  writeFileSync(path, out + '\n', 'utf8');
  return { ok: true, path };
}
