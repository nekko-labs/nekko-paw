/** Provider + model domain types. */
export type ProviderKind = 'anthropic' | 'openai' | 'openrouter' | 'ollama' | 'lmstudio' | 'vllm' | 'openai-compat';
/** A configured connection to a model server / provider. */
export interface ProviderConfig {
    id: string;
    kind: ProviderKind;
    label: string;
    /** Base URL for the server. For cloud providers this defaults per-kind. */
    baseUrl: string;
    /** API key (cloud) or token (some local servers). Stored locally. */
    apiKey?: string;
    /** Whether this provider was auto-discovered on the local network. */
    discovered?: boolean;
    enabled: boolean;
}
/** A model exposed by a provider. */
export interface ModelInfo {
    id: string;
    providerId: string;
    /** Display name. */
    name: string;
    /** Context window in tokens, if known. */
    contextLength?: number;
    /** Whether this model is currently loaded into memory (ollama/lmstudio). */
    loaded?: boolean;
    /** Approximate size on disk in bytes, if known. */
    sizeBytes?: number;
    /** Family / quantization hints. */
    details?: Record<string, string>;
}
/** Default base URLs per provider kind. */
export declare const PROVIDER_DEFAULTS: Record<ProviderKind, {
    baseUrl: string;
    needsKey: boolean;
    label: string;
}>;
/** Ports we probe when auto-discovering local servers. */
export declare const DISCOVERY_TARGETS: Array<{
    kind: ProviderKind;
    baseUrl: string;
    probe: string;
}>;
