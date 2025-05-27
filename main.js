const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase } = require('./config/database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Cargar el archivo index.html
  mainWindow.loadFile('index.html');

  // Abrir las herramientas de desarrollo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Inicializar la aplicación
app.whenReady().then(async () => {
  // Inicializar la base de datos
  const dbInitialized = await initDatabase();
  if (!dbInitialized) {
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cerrar la aplicación cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Manejar eventos IPC
ipcMain.on('app-quit', () => {
  app.quit();
}); 