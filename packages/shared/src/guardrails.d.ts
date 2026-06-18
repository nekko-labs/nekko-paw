/** Guardrails: risky-command classification + policy. */
export type GuardrailSeverity = 'low' | 'medium' | 'high';
export type GuardrailAction = 'allow' | 'ask' | 'deny';
export interface GuardrailRule {
    id: string;
    /** Human label shown in settings. */
    label: string;
    description: string;
    /** Regex source matched against the command/tool input. */
    pattern: string;
    severity: GuardrailSeverity;
    /** Default action when the rule matches. */
    action: GuardrailAction;
    enabled: boolean;
}
export interface GuardrailMatch {
    ruleId: string;
    label: string;
    severity: GuardrailSeverity;
    action: GuardrailAction;
    /** The substring that triggered the match. */
    evidence: string;
}
export interface GuardrailDecision {
    /** Strongest action across all matched rules. */
    action: GuardrailAction;
    severity: GuardrailSeverity;
    matches: GuardrailMatch[];
}
export type SandboxMode = 
/** Tool file access is jailed to the active workspace folders. */
'workspace-jail'
/** Every tool call that writes/executes asks for approval. */
 | 'ask-everything'
/** Run shell commands inside a Docker container if Docker is present. */
 | 'docker'
/** No restrictions (power users). */
 | 'off';
