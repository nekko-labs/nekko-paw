/** Provider + model domain types. */
/** Default base URLs per provider kind. */
export const PROVIDER_DEFAULTS = {
    anthropic: { baseUrl: 'https://api.anthropic.com', needsKey: true, label: 'Anthropic (Claude)' },
    openai: { baseUrl: 'https://api.openai.com/v1', needsKey: true, label: 'OpenAI' },
    openrouter: { baseUrl: 'https://openrouter.ai/api/v1', needsKey: true, label: 'OpenRouter' },
    ollama: { baseUrl: 'http://localhost:11434', needsKey: false, label: 'Ollama' },
    lmstudio: { baseUrl: 'http://localhost:1234/v1', needsKey: false, label: 'LM Studio' },
    vllm: { baseUrl: 'http://localhost:8000/v1', needsKey: false, label: 'vLLM' },
    'openai-compat': { baseUrl: 'http://localhost:8080/v1', needsKey: false, label: 'OpenAI-compatible' },
};
/** Ports we probe when auto-discovering local servers. */
export const DISCOVERY_TARGETS = [
    { kind: 'ollama', baseUrl: 'http://localhost:11434', probe: '/api/tags' },
    { kind: 'lmstudio', baseUrl: 'http://localhost:1234/v1', probe: '/models' },
    { kind: 'vllm', baseUrl: 'http://localhost:8000/v1', probe: '/models' },
];
//# sourceMappingURL=models.js.map