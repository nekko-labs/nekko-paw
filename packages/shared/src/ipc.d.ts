/** IPC channel contracts between renderer and main. */
import type { AppSettings, UsageSummary } from './settings.js';
import type { ProviderConfig, ModelInfo } from './models.js';
import type { Session, SendOptions, AgentEvent } from './chat.js';
import type { ContextBundle } from './context.js';
import type { MemoryEntry, MemoryScope } from './memory.js';
import type { WorkspaceFolder, IndexStatus, SearchHit, IndexedFile } from './workspace.js';
import type { ConnectorConfig, ConnectorKind, ConnectorResource } from './connectors.js';
import type { GuardrailRule } from './guardrails.js';
/** Invoke (request/response) channels. */
export declare const IpcChannels: {
    readonly settingsGet: "settings:get";
    readonly settingsUpdate: "settings:update";
    readonly providersList: "providers:list";
    readonly providersSave: "providers:save";
    readonly providersRemove: "providers:remove";
    readonly providersDiscover: "providers:discover";
    readonly providersTest: "providers:test";
    readonly modelsList: "models:list";
    readonly modelPull: "model:pull";
    readonly modelLoad: "model:load";
    readonly modelUnload: "model:unload";
    readonly sessionsList: "sessions:list";
    readonly sessionCreate: "session:create";
    readonly sessionGet: "session:get";
    readonly sessionDelete: "session:delete";
    readonly chatSend: "chat:send";
    readonly chatAbort: "chat:abort";
    readonly toolApprove: "tool:approve";
    readonly contextPreview: "context:preview";
    readonly contextToggle: "context:toggle";
    readonly memoryList: "memory:list";
    readonly memorySave: "memory:save";
    readonly memoryDelete: "memory:delete";
    readonly workspaceList: "workspace:list";
    readonly workspaceAdd: "workspace:add";
    readonly workspaceRemove: "workspace:remove";
    readonly workspaceIndex: "workspace:index";
    readonly workspaceIndexStatus: "workspace:indexStatus";
    readonly workspaceSearch: "workspace:search";
    readonly workspaceFiles: "workspace:files";
    readonly connectorsList: "connectors:list";
    readonly connectorConnect: "connector:connect";
    readonly connectorDisconnect: "connector:disconnect";
    readonly connectorFetch: "connector:fetch";
    readonly guardrailsClassify: "guardrails:classify";
    readonly usageSummary: "usage:summary";
    readonly dialogOpenFolder: "dialog:openFolder";
};
/** Push (main → renderer) channels. */
export declare const IpcEvents: {
    readonly agentEvent: "agent:event";
    readonly indexProgress: "index:progress";
};
/** The typed API the preload bridge exposes as window.nekko. */
export interface NekkoApi {
    getSettings(): Promise<AppSettings>;
    updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
    listProviders(): Promise<ProviderConfig[]>;
    saveProvider(p: ProviderConfig): Promise<ProviderConfig[]>;
    removeProvider(id: string): Promise<ProviderConfig[]>;
    discoverProviders(): Promise<ProviderConfig[]>;
    testProvider(id: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    listModels(providerId: string): Promise<ModelInfo[]>;
    pullModel(providerId: string, model: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    loadModel(providerId: string, model: string): Promise<{
        ok: boolean;
    }>;
    unloadModel(providerId: string, model: string): Promise<{
        ok: boolean;
    }>;
    listSessions(): Promise<Session[]>;
    createSession(workspaceId?: string): Promise<Session>;
    getSession(id: string): Promise<Session | null>;
    deleteSession(id: string): Promise<void>;
    sendChat(opts: SendOptions): Promise<void>;
    abortChat(sessionId: string): Promise<void>;
    approveTool(sessionId: string, toolCallId: string, approved: boolean): Promise<void>;
    previewContext(sessionId: string, attachedPaths: string[]): Promise<ContextBundle>;
    toggleContextItem(sessionId: string, itemId: string, included: boolean, pinned: boolean): Promise<ContextBundle>;
    listMemory(scope: MemoryScope, workspaceId?: string): Promise<MemoryEntry[]>;
    saveMemory(entry: MemoryEntry): Promise<MemoryEntry[]>;
    deleteMemory(id: string): Promise<void>;
    listWorkspaces(): Promise<WorkspaceFolder[]>;
    addWorkspace(): Promise<WorkspaceFolder[]>;
    removeWorkspace(id: string): Promise<WorkspaceFolder[]>;
    indexWorkspace(id: string): Promise<IndexStatus>;
    getIndexStatus(id: string): Promise<IndexStatus | null>;
    searchWorkspace(id: string, query: string): Promise<SearchHit[]>;
    listFiles(id: string): Promise<IndexedFile[]>;
    listConnectors(): Promise<ConnectorConfig[]>;
    connectConnector(kind: ConnectorKind, token: string, settings?: Record<string, string>): Promise<ConnectorConfig[]>;
    disconnectConnector(kind: ConnectorKind): Promise<ConnectorConfig[]>;
    fetchConnector(kind: ConnectorKind, query?: string): Promise<ConnectorResource[]>;
    classifyCommand(command: string): Promise<import('./guardrails.js').GuardrailDecision>;
    saveGuardrail(rule: GuardrailRule): Promise<GuardrailRule[]>;
    getUsageSummary(): Promise<UsageSummary>;
    onAgentEvent(cb: (e: AgentEvent) => void): () => void;
    onIndexProgress(cb: (s: IndexStatus) => void): () => void;
}
