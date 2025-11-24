const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  search: (query) => ipcRenderer.invoke('search', query),

  startExport: (config) => ipcRenderer.invoke('startExport', config),

  stopExport: () => ipcRenderer.invoke('stopExport'),

  saveToken: (token) => ipcRenderer.invoke('save-token', token),

  selectFolder: () => ipcRenderer.invoke('selectFolder'),

  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),

  getConfig: () => ipcRenderer.invoke('get-config'),

  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  onProgress: (callback) => {
    // Remove all existing listeners to prevent duplicates
    ipcRenderer.removeAllListeners('progress');
    ipcRenderer.on('progress', (event, data) => callback(data));
  },
});
