/**
 * Client-side prompt analysis — instant, offline, no API cost. Modeled on the
 * PromptLint diagnostics approach: detect the *parts* of a prompt, run lint
 * rules over the text, produce an A–F health grade, and suggest a model tier.
 * Pure functions; the composer renders the result.
 */

export type Severity = 'critical' | 'warn' | 'info';

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  /** Character range in the source text, when the finding points at a span. */
  start?: number;
  end?: number;
}

export interface PromptPart {
  id: string;
  label: string;
  present: boolean;
  hint: string;
}

export interface ModelHint {
  tier: 'frontier' | 'balanced' | 'fast';
  reason: string;
}

export interface PromptAnalysis {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  parts: PromptPart[];
  findings: Finding[];
  tokens: number;
  model: ModelHint;
}

/** Rough token estimate (~4 chars/token), matching the app's other estimates. */
function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

/** Push a finding for every match of `re` in `text`. */
function eachMatch(text: string, re: RegExp, make: (m: RegExpExecArray) => Finding, out: Finding[]): void {
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(text))) {
    out.push(make(m));
    if (m.index === r.lastIndex) r.lastIndex++; // avoid zero-width loops
  }
}

const PART_DEFS: Array<{ id: string; label: string; hint: string; test: (t: string) => boolean }> = [
  { id: 'role', label: 'Role', hint: 'Give the model a persona ("You are a…").', test: (t) => /\b(you are|act as|you're an?|as an? expert|your role is)\b/i.test(t) },
  { id: 'task', label: 'Task', hint: 'State the task as a clear command.', test: (t) => /\b(write|create|generate|analy[sz]e|summari[sz]e|list|explain|implement|refactor|fix|debug|review|design|build|translate|extract|classify|compare|rewrite|draft|plan|outline)\b/i.test(t) },
  { id: 'context', label: 'Context', hint: 'Add background or reference material, set off with delimiters.', test: (t) => /```|"""|<[a-z_]+>|^#{1,6}\s|\b(context|background|given|reference)\s*:/im.test(t) },
  { id: 'examples', label: 'Examples', hint: 'Show one or two examples of what you want.', test: (t) => /\bexamples?\b|\be\.g\.|for instance|input\s*:|output\s*:/i.test(t) },
  { id: 'format', label: 'Format', hint: 'Specify the output shape (JSON, markdown, length…).', test: (t) => /\b(json|markdown|md|table|bullet(s| points)?|csv|yaml|xml|format|respond with|return (a|the)|schema|as a list|number(ed)? list|word(s)?|sentences?|paragraphs?)\b/i.test(t) },
  { id: 'constraints', label: 'Constraints', hint: 'State rules and limits (must / never / at most…).', test: (t) => /\b(must|do not|don't|never|only|at most|no more than|limit|avoid|should not|always|exclude|without)\b/i.test(t) },
];

const VAGUE = ['good', 'nice', 'appropriate', 'properly', 'some', 'several', 'things', 'stuff', 'better', 'high-quality', 'as needed', 'robust', 'clean', 'optimal', 'reasonable'];
const HEDGES = ['should be', 'could you', 'might want to', 'try to', 'maybe', 'perhaps', 'kind of', 'sort of', 'if possible'];
const FILLER = ['please note that', 'it is important to', 'as previously mentioned', 'in order to', 'due to the fact that', 'needless to say', 'as a matter of fact'];

const SECRET_RES: Array<[RegExp, string]> = [
  [/sk-[A-Za-z0-9]{20,}/g, 'OpenAI-style API key'],
  [/sk-ant-[A-Za-z0-9_-]{20,}/g, 'Anthropic API key'],
  [/AKIA[0-9A-Z]{16}/g, 'AWS access key'],
  [/ghp_[A-Za-z0-9]{30,}/g, 'GitHub token'],
  [/Bearer\s+[A-Za-z0-9._-]{12,}/g, 'Bearer token'],
  [/\b(api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[A-Za-z0-9._-]{8,}/gi, 'credential'],
];

function wordList(words: string[]): RegExp {
  return new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
}

export function analyzePrompt(raw: string): PromptAnalysis {
  const text = raw ?? '';
  const findings: Finding[] = [];
  const tokens = estimateTokens(text);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const parts = PART_DEFS.map((p) => ({ id: p.id, label: p.label, hint: p.hint, present: p.test(text) }));
  const has = (id: string) => parts.find((p) => p.id === id)?.present ?? false;

  // --- Structure / completeness ---
  if (!has('task')) findings.push({ ruleId: 'no-task', severity: 'warn', message: 'No clear task — start with a command verb (Write, Analyze, Fix…).' });
  if (!has('format') && words > 12) findings.push({ ruleId: 'no-format', severity: 'warn', message: 'No output format specified (e.g. JSON, markdown, a list, a length).' });
  if (!has('role') && words > 20) findings.push({ ruleId: 'no-role', severity: 'info', message: 'Consider adding a persona ("You are a…") to steer tone and expertise.' });
  if (/\b(classify|categori[sz]e|extract|label|tag)\b/i.test(text) && !has('examples')) {
    findings.push({ ruleId: 'no-examples', severity: 'info', message: 'Extraction/classification works far better with one or two examples.' });
  }

  // --- Vagueness & weak language (ranged) ---
  eachMatch(text, wordList(VAGUE), (m) => ({ ruleId: 'vague', severity: 'warn', message: `"${m[0]}" is vague — say specifically what you mean.`, start: m.index, end: m.index + m[0].length }), findings);
  eachMatch(text, wordList(HEDGES), (m) => ({ ruleId: 'hedge', severity: 'info', message: `"${m[0]}" is tentative — use a direct instruction.`, start: m.index, end: m.index + m[0].length }), findings);
  eachMatch(text, wordList(FILLER), (m) => ({ ruleId: 'filler', severity: 'info', message: `"${m[0]}" is filler — it wastes tokens.`, start: m.index, end: m.index + m[0].length }), findings);

  // --- Length ---
  if (tokens > 2000) findings.push({ ruleId: 'too-long', severity: 'warn', message: `Long prompt (~${tokens} tokens). Trim anything the model doesn't need.` });
  if (words > 0 && words < 8 && !has('format') && !has('constraints')) {
    findings.push({ ruleId: 'too-short', severity: 'info', message: 'Very short — likely underspecified. Add the task, context, and desired output.' });
  }
  // Long sentences (ranged).
  eachMatch(text, /[^.!?\n]{160,}?[.!?]/g, (m) => ({ ruleId: 'long-sentence', severity: 'info', message: 'Long sentence — splitting it improves clarity.', start: m.index, end: m.index + m[0].length }), findings);

  // --- Conflicts ---
  if (/\bconcise|brief|short\b/i.test(text) && /\b(detailed|comprehensive|thorough|in-depth|exhaustive)\b/i.test(text)) {
    findings.push({ ruleId: 'conflict-length', severity: 'warn', message: 'Conflicting length cues ("concise" vs "detailed") — pick one.' });
  }

  // --- Safety (ranged) ---
  for (const [re, label] of SECRET_RES) {
    eachMatch(text, re, (m) => ({ ruleId: 'secret', severity: 'critical', message: `Possible ${label} in the prompt — replace it with a placeholder.`, start: m.index, end: m.index + m[0].length }), findings);
  }
  eachMatch(text, /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, (m) => ({ ruleId: 'pii-email', severity: 'info', message: 'Email address detected — consider a placeholder for privacy.', start: m.index, end: m.index + m[0].length }), findings);

  // --- Score & grade ---
  const penalty = findings.reduce((s, f) => s + (f.severity === 'critical' ? 30 : f.severity === 'warn' ? 9 : 3), 0);
  const score = Math.max(0, 100 - penalty);
  const grade: PromptAnalysis['grade'] = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';

  // --- Model hint ---
  const reasoningHeavy = /\b(step by step|reason|think through|chain of thought|prove|derive|plan then)\b/i.test(text);
  const constraintCount = (text.match(/\b(must|do not|don't|never|only|at most|no more than|avoid|always)\b/gi) ?? []).length;
  const codeHeavy = /```/.test(text);
  let model: ModelHint;
  if (tokens > 800 || reasoningHeavy || constraintCount >= 3 || (codeHeavy && tokens > 300)) {
    model = { tier: 'frontier', reason: 'Multi-step reasoning or lots of context — a frontier model will follow it most reliably.' };
  } else if (words > 0 && tokens < 120 && constraintCount === 0 && !codeHeavy) {
    model = { tier: 'fast', reason: 'Short and single-shot — a fast, cheap model is plenty.' };
  } else {
    model = { tier: 'balanced', reason: 'Moderate complexity — a balanced mid-tier model fits well.' };
  }

  return { grade, score, parts, findings, tokens, model };
}

export const GRADE_COLOR: Record<PromptAnalysis['grade'], string> = {
  A: '#4ec98a', B: '#7bc86c', C: '#e0a23a', D: '#e0823a', F: '#e0574a',
};
export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#e0574a', warn: '#e0a23a', info: '#5b9dd9',
};
