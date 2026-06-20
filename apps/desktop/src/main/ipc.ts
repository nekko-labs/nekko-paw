import { BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { IpcChannels, IpcEvents } from '@open-paw/shared';
import { createDispatcher, type Host } from '@open-paw/host';

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(channel, payload);
}

/**
 * Thin Electron transport over the shared Host. Every IPC channel is routed
 * through the shared dispatcher (one source of truth, reused by the web server),
 * except `workspaceAdd`, which needs Electron's native folder picker.
 */
export function registerIpc(host: Host): void {
  const dispatch = createDispatcher(host);

  for (const channel of Object.values(IpcChannels)) {
    ipcMain.handle(channel, (_e, ...args) => dispatch(channel, args));
  }

  // Native folder picker → host.addWorkspaceByPath (replaces the generic handler).
  ipcMain.removeHandler(IpcChannels.workspaceAdd);
  ipcMain.handle(IpcChannels.workspaceAdd, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const res = await dialog.showOpenDialog(win!, { properties: ['openDirectory'] });
    if (res.canceled || !res.filePaths[0]) return host.listWorkspaces();
    return host.addWorkspaceByPath(res.filePaths[0]);
  });

  // Native multi-file picker → absolute paths (transport-local, not in dispatcher).
  ipcMain.removeHandler(IpcChannels.dialogOpenFiles);
  ipcMain.handle(IpcChannels.dialogOpenFiles, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const res = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
    });
    return res.canceled ? [] : res.filePaths;
  });

  // Reveal/open a path or URL with the OS (transport-local, not in dispatcher).
  ipcMain.removeHandler(IpcChannels.openPath);
  ipcMain.handle(IpcChannels.openPath, async (_e, target: string) => {
    if (/^https?:\/\//i.test(target)) await shell.openExternal(target);
    else await shell.openPath(target);
  });

  // Forward host events to all renderers.
  host.events.on('agentEvent', (e) => broadcast(IpcEvents.agentEvent, e));
  host.events.on('indexProgress', (s) => broadcast(IpcEvents.indexProgress, s));
}
