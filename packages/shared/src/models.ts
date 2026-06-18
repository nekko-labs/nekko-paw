/** Provider + model domain types. */

export type ProviderKind =
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'ollama'
  | 'lmstudio'
  | 'vllm'
  | 'openai-compat';

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
export const PROVIDER_DEFAULTS: Record<ProviderKind, { baseUrl: string; needsKey: boolean; label: string }> = {
  anthropic: { baseUrl: 'https://api.anthropic.com', needsKey: true, label: 'Anthropic (Claude)' },
  openai: { baseUrl: 'https://api.openai.com/v1', needsKey: true, label: 'OpenAI' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', needsKey: true, label: 'OpenRouter' },
  ollama: { baseUrl: 'http://localhost:11434', needsKey: false, label: 'Ollama' },
  lmstudio: { baseUrl: 'http://localhost:1234/v1', needsKey: false, label: 'LM Studio' },
  vllm: { baseUrl: 'http://localhost:8000/v1', needsKey: false, label: 'vLLM' },
  'openai-compat': { baseUrl: 'http://localhost:8080/v1', needsKey: false, label: 'OpenAI-compatible' },
};

/** Ports we probe when auto-discovering local servers. */
export const DISCOVERY_TARGETS: Array<{ kind: ProviderKind; baseUrl: string; probe: string }> = [
  { kind: 'ollama', baseUrl: 'http://localhost:11434', probe: '/api/tags' },
  { kind: 'lmstudio', baseUrl: 'http://localhost:1234/v1', probe: '/models' },
  { kind: 'vllm', baseUrl: 'http://localhost:8000/v1', probe: '/models' },
];
