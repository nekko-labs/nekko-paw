/** External connector types: Linear, Slack, Discord, Gmail, Google Drive. */
export type ConnectorKind = 'linear' | 'slack' | 'discord' | 'gmail' | 'gdrive';
export type ConnectorAuthKind = 'token' | 'oauth';
export interface ConnectorMeta {
    kind: ConnectorKind;
    label: string;
    auth: ConnectorAuthKind;
    /** Short description shown in the Connectors UI. */
    description: string;
}
export interface ConnectorConfig {
    kind: ConnectorKind;
    connected: boolean;
    /** Token-based connectors store a token; oauth stores tokens elsewhere. */
    token?: string;
    /** Free-form per-connector settings (workspace id, channel, etc.). */
    settings?: Record<string, string>;
    connectedAt?: number;
}
export interface ConnectorResource {
    id: string;
    title: string;
    subtitle?: string;
    url?: string;
    /** Body that can be pulled into context. */
    body?: string;
}
export declare const CONNECTOR_CATALOG: ConnectorMeta[];
