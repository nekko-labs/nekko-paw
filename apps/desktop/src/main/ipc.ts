import { BrowserWindow, dialog, ipcMain } from 'electron';
import type {
  AppSettings,
  ConnectorKind,
  MemoryEntry,
  MemoryScope,
  ProviderConfig,
  SendOptions,
} from '@nekko/shared';
import { IpcChannels, IpcEvents } from '@nekko/shared';
import type { Host } from '@nekko/host';

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(channel, payload);
}

/**
 * Thin Electron transport over the shared Host: each IPC channel maps directly
 * to a host method, and host events are forwarded to every renderer. All the
 * real logic lives in @nekko/host (shared with the web/cloud editions).
 */
export function registerIpc(host: Host): void {
  const h = ipcMain.handle.bind(ipcMain);

  // Forward host events to all renderers.
  host.events.on('agentEvent', (e) => broadcast(IpcEvents.agentEvent, e));
  host.events.on('indexProgress', (s) => broadcast(IpcEvents.indexProgress, s));

  // Settings
  h(IpcChannels.settingsGet, () => host.getSettings());
  h(IpcChannels.settingsUpdate, (_e, patch: Partial<AppSettings>) => host.updateSettings(patch));

  // Providers
  h(IpcChannels.providersList, () => host.listProviders());
  h(IpcChannels.providersSave, (_e, p: ProviderConfig) => host.saveProvider(p));
  h(IpcChannels.providersRemove, (_e, id: string) => host.removeProvider(id));
  h(IpcChannels.providersDiscover, () => host.discoverProviders());
  h(IpcChannels.providersTest, (_e, id: string) => host.testProvider(id));

  // Models
  h(IpcChannels.modelsList, (_e, providerId: string) => host.listModels(providerId));
  h(IpcChannels.modelPull, (_e, providerId: string, model: string) => host.pullModel(providerId, model));
  h(IpcChannels.modelLoad, (_e, providerId: string, model: string) => host.loadModel(providerId, model));
  h(IpcChannels.modelUnload, (_e, providerId: string, model: string) => host.unloadModel(providerId, model));

  // Sessions + chat
  h(IpcChannels.sessionsList, () => host.listSessions());
  h(IpcChannels.sessionCreate, (_e, workspaceId?: string) => host.createSession(workspaceId));
  h(IpcChannels.sessionGet, (_e, id: string) => host.getSession(id));
  h(IpcChannels.sessionDelete, (_e, id: string) => host.deleteSession(id));
  h(IpcChannels.sessionSetWorkspace, (_e, id: string, workspaceId?: string) => host.setSessionWorkspace(id, workspaceId));
  h(IpcChannels.chatSend, (_e, opts: SendOptions) => host.sendChat(opts));
  h(IpcChannels.chatAbort, (_e, sessionId: string) => host.abortChat(sessionId));
  h(IpcChannels.toolApprove, (_e, sessionId: string, toolCallId: string, approved: boolean) =>
    host.approveTool(sessionId, toolCallId, approved),
  );

  // Context
  h(IpcChannels.contextPreview, (_e, sessionId: string, attachedPaths: string[]) =>
    host.previewContext(sessionId, attachedPaths),
  );
  h(IpcChannels.contextToggle, (_e, sessionId: string) => host.previewContext(sessionId, []));
  h(IpcChannels.contextSetPrefs, (_e, sessionId: string, prefs: { excluded: string[]; pinned: string[] }) =>
    host.setContextPrefs(sessionId, prefs),
  );

  // Memory
  h(IpcChannels.memoryList, (_e, scope: MemoryScope, workspaceId?: string) => host.listMemory(scope, workspaceId));
  h(IpcChannels.memorySave, (_e, entry: MemoryEntry) => host.saveMemory(entry));
  h(IpcChannels.memoryDelete, (_e, id: string) => host.deleteMemory(id));

  // Workspace
  h(IpcChannels.workspaceList, () => host.listWorkspaces());
  h(IpcChannels.workspaceAdd, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const res = await dialog.showOpenDialog(win!, { properties: ['openDirectory'] });
    if (res.canceled || !res.filePaths[0]) return host.listWorkspaces();
    return host.addWorkspaceByPath(res.filePaths[0]);
  });
  h(IpcChannels.workspaceRemove, (_e, id: string) => host.removeWorkspace(id));
  h(IpcChannels.workspaceIndex, (_e, id: string) => host.indexWorkspace(id));
  h(IpcChannels.workspaceIndexStatus, (_e, id: string) => host.getIndexStatus(id));
  h(IpcChannels.workspaceSearch, (_e, id: string, query: string) => host.searchWorkspace(id, query));
  h(IpcChannels.workspaceFiles, (_e, id: string) => host.listFiles(id));

  // Connectors
  h(IpcChannels.connectorsList, () => host.listConnectors());
  h(IpcChannels.connectorConnect, (_e, kind: ConnectorKind, token: string, settings?: Record<string, string>) =>
    host.connectConnector(kind, token, settings),
  );
  h(IpcChannels.connectorDisconnect, (_e, kind: ConnectorKind) => host.disconnectConnector(kind));
  h(IpcChannels.connectorFetch, (_e, kind: ConnectorKind, query?: string) => host.fetchConnector(kind, query));

  // Guardrails + usage
  h(IpcChannels.guardrailsClassify, (_e, command: string) => host.classifyCommand(command));
  h(IpcChannels.usageSummary, () => host.usageSummary());
}
