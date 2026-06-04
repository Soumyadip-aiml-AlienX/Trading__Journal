// Preload script to securely expose Electron features if needed in future
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose safe APIs to renderer here if needed
  platform: process.platform,
});
