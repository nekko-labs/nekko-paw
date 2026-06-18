/** Context assembly + provenance (powers the Context Inspector panel). */
/** Rough token estimate: ~4 chars per token. */
export function estimateTokens(text) {
    return Math.max(1, Math.ceil(text.length / 4));
}
//# sourceMappingURL=context.js.map