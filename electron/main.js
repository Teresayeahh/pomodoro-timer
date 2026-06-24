const { app, BrowserWindow, ipcMain, Notification, nativeImage } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')

// Unify userData across dev and packaged builds so data is never lost on reinstall
if (process.platform === 'darwin') {
  app.setPath('userData', path.join(os.homedir(), 'Library', 'Application Support', '番茄钟'))
}

let mainWindow

if (!app.isPackaged && process.platform === 'darwin') {
  app.dock?.setIcon(nativeImage.createFromPath(path.join(__dirname, '../build/icon-1024.png')))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 620,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#12121f',
    icon: path.join(__dirname, '../build/icon-1024.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// File-based focus history — shared across dev and packaged builds
function historyPath() {
  return path.join(app.getPath('userData'), 'focus-history.json')
}

ipcMain.on('history:read', (e) => {
  try {
    e.returnValue = JSON.parse(fs.readFileSync(historyPath(), 'utf8'))
  } catch {
    e.returnValue = {}
  }
})

ipcMain.on('history:save', (_, data) => {
  try {
    fs.writeFileSync(historyPath(), JSON.stringify(data))
  } catch {}
})

ipcMain.on('notify', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
})

ipcMain.on('set-always-on-top', (_, value) => {
  mainWindow?.setAlwaysOnTop(value)
})
