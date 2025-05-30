const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs de forma segura al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
    // Diálogos y archivos
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    readExcelFile: (filePath) => ipcRenderer.invoke('read-excel-file', filePath),
    readJsonFile: (filePath) => ipcRenderer.invoke('read-json-file', filePath),
    
    // Control de la aplicación
    quitApp: () => ipcRenderer.send('app-quit'),
    
    // Eventos
    on: (channel, callback) => {
        const validChannels = ['notification', 'error', 'success'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },
    
    // Remover listeners
    removeListener: (channel, callback) => {
        const validChannels = ['notification', 'error', 'success'];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeListener(channel, callback);
        }
    }
}); 