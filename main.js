const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });

  // Cargar el archivo index.html
  mainWindow.loadFile('index.html');

  // Abrir las herramientas de desarrollo solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Error al cargar la aplicación:', errorDescription);
    dialog.showErrorBox('Error de Carga', 
      'No se pudo cargar la aplicación. Por favor, reinicie la aplicación.');
  });
}

// Inicializar la aplicación
app.whenReady().then(async () => {
  try {
    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    dialog.showErrorBox('Error de Inicio', 
      'No se pudo iniciar la aplicación. Por favor, contacte al soporte técnico.');
  }
});

// Cerrar la aplicación cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Manejar eventos IPC
ipcMain.on('app-quit', () => {
  app.quit();
});

// Manejar diálogo de selección de archivo
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  } catch (error) {
    console.error('Error al mostrar diálogo:', error);
    throw error;
  }
});

// Leer archivo Excel
ipcMain.handle('read-excel-file', async (event, filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    
    // Convertir cada hoja a JSON
    const result = {
      contracts: XLSX.utils.sheet_to_json(workbook.Sheets['Contratos'] || {}),
      partidas: XLSX.utils.sheet_to_json(workbook.Sheets['Partidas'] || {}),
      hes: XLSX.utils.sheet_to_json(workbook.Sheets['HES'] || {})
    };
    
    return result;
  } catch (error) {
    console.error('Error al leer archivo Excel:', error);
    throw new Error('No se pudo leer el archivo Excel. Verifique que el formato sea correcto.');
  }
});

// Leer archivo JSON
ipcMain.handle('read-json-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error al leer archivo JSON:', error);
    throw new Error('No se pudo leer el archivo JSON. Verifique que el archivo existe y tiene el formato correcto.');
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  dialog.showErrorBox('Error Inesperado', 
    'Ha ocurrido un error inesperado. La aplicación se cerrará.');
  app.quit();
}); 