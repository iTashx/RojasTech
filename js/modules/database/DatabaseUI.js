// Interfaz de usuario para gestión de base de datos
import { DatabaseManager } from './DatabaseManager.js';

export class DatabaseUI {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botón de exportar
        document.getElementById('export-db-btn')?.addEventListener('click', () => this.exportDatabase());
        
        // Botón de importar
        document.getElementById('import-db-btn')?.addEventListener('click', () => this.showImportDialog());
        
        // Input de archivo
        document.getElementById('import-db-file')?.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Botón de restaurar respaldo
        document.getElementById('restore-backup-btn')?.addEventListener('click', () => this.showRestoreDialog());
    }

    // Exportar base de datos
    async exportDatabase() {
        try {
            await this.dbManager.exportDatabase();
        } catch (error) {
            console.error('Error al exportar:', error);
        }
    }

    // Mostrar diálogo de importación
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.id = 'import-db-file';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    // Manejar selección de archivo
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (confirm('¿Está seguro de importar esta base de datos? Se sobrescribirán los datos actuales.')) {
            try {
                await this.dbManager.importDatabase(file);
            } catch (error) {
                console.error('Error al importar:', error);
            }
        }
    }

    // Mostrar diálogo de restauración
    async showRestoreDialog() {
        try {
            const backups = await this.dbManager.listBackups();
            if (!backups.length) {
                alert('No hay respaldos disponibles');
                return;
            }

            const select = document.createElement('select');
            select.className = 'form-select mb-3';
            
            backups.forEach(backup => {
                const option = document.createElement('option');
                option.value = backup.id;
                option.textContent = `Respaldo del ${new Date(backup.fecha).toLocaleString()}`;
                select.appendChild(option);
            });

            const dialog = document.createElement('div');
            dialog.className = 'modal fade';
            dialog.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Restaurar Respaldo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Seleccione el respaldo a restaurar:</p>
                            ${select.outerHTML}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="confirm-restore">Restaurar</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
            const modal = new bootstrap.Modal(dialog);
            modal.show();

            dialog.querySelector('#confirm-restore').addEventListener('click', async () => {
                const backupId = parseInt(select.value);
                if (confirm('¿Está seguro de restaurar este respaldo? Se sobrescribirán los datos actuales.')) {
                    try {
                        await this.dbManager.restoreBackup(backupId);
                        modal.hide();
                        document.body.removeChild(dialog);
                    } catch (error) {
                        console.error('Error al restaurar:', error);
                    }
                }
            });

            dialog.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(dialog);
            });
        } catch (error) {
            console.error('Error al mostrar diálogo:', error);
        }
    }

    // Actualizar lista de respaldos
    async updateBackupsList() {
        try {
            const backups = await this.dbManager.listBackups();
            const container = document.getElementById('backups-list');
            if (!container) return;

            container.innerHTML = backups.map(backup => `
                <div class="backup-item">
                    <div class="backup-info">
                        <span class="backup-date">${new Date(backup.fecha).toLocaleString()}</span>
                        <span class="backup-type">${backup.tipo}</span>
                    </div>
                    <div class="backup-actions">
                        <button class="btn btn-sm btn-primary restore-btn" data-id="${backup.id}">
                            Restaurar
                        </button>
                    </div>
                </div>
            `).join('');

            // Agregar event listeners a los botones
            container.querySelectorAll('.restore-btn').forEach(btn => {
                btn.addEventListener('click', () => this.showRestoreDialog());
            });
        } catch (error) {
            console.error('Error al actualizar lista:', error);
        }
    }
} 