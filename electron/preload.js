const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
  readHistory: () => ipcRenderer.sendSync('history:read'),
  saveHistory: (data) => ipcRenderer.send('history:save', data),
})
