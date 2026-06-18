/** External connector types: Linear, Slack, Discord, Gmail, Google Drive. */
export const CONNECTOR_CATALOG = [
    { kind: 'linear', label: 'Linear', auth: 'token', description: 'Issues, projects, and cycles via Linear API key.' },
    { kind: 'slack', label: 'Slack', auth: 'token', description: 'Channels and messages via a bot/user token.' },
    { kind: 'discord', label: 'Discord', auth: 'token', description: 'Servers and channels via a bot token.' },
    { kind: 'gmail', label: 'Gmail', auth: 'oauth', description: 'Threads and messages via Google OAuth.' },
    { kind: 'gdrive', label: 'Google Drive', auth: 'oauth', description: 'Docs and files via Google OAuth.' },
];
//# sourceMappingURL=connectors.js.map