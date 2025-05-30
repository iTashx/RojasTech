// Módulo de gestión de documentos
import { db } from '../../database.js';
import { Notifications } from '../utils/Notifications.js';
import { FormatUtils } from '../utils/FormatUtils.js';

export class DocumentManager {
    constructor() {
        this.notifications = new Notifications();
    }

    // Crear documento
    async createDocument(data) {
        try {
            // Validar datos
            if (!data.contractId) throw new Error('El ID del contrato es requerido');
            if (!data.tipo) throw new Error('El tipo es requerido');
            if (!data.nombre) throw new Error('El nombre es requerido');
            if (!data.url) throw new Error('La URL es requerida');

            // Validar contrato
            const contract = await db.contracts.get(data.contractId);
            if (!contract) {
                this.notifications.error('Contrato no encontrado');
                return false;
            }

            // Crear documento
            const documentId = await db.documents.add({
                ...data,
                fechaCreacion: new Date()
            });

            this.notifications.success('Documento creado');
            return documentId;
        } catch (error) {
            console.error('Error al crear documento:', error);
            this.notifications.error(error.message || 'Error al crear documento');
            return false;
        }
    }

    // Actualizar documento
    async updateDocument(id, data) {
        try {
            // Validar documento
            const document = await db.documents.get(id);
            if (!document) {
                this.notifications.error('Documento no encontrado');
                return false;
            }

            // Actualizar documento
            await db.documents.update(id, data);

            this.notifications.success('Documento actualizado');
            return true;
        } catch (error) {
            console.error('Error al actualizar documento:', error);
            this.notifications.error(error.message || 'Error al actualizar documento');
            return false;
        }
    }

    // Eliminar documento
    async deleteDocument(id) {
        try {
            // Validar documento
            const document = await db.documents.get(id);
            if (!document) {
                this.notifications.error('Documento no encontrado');
                return false;
            }

            // Eliminar documento
            await db.documents.delete(id);

            this.notifications.success('Documento eliminado');
            return true;
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            this.notifications.error(error.message || 'Error al eliminar documento');
            return false;
        }
    }

    // Obtener documento por ID
    async getDocumentById(id) {
        try {
            const document = await db.documents.get(id);
            if (!document) {
                this.notifications.error('Documento no encontrado');
                return null;
            }
            return document;
        } catch (error) {
            console.error('Error al obtener documento:', error);
            this.notifications.error(error.message || 'Error al obtener documento');
            return null;
        }
    }

    // Listar documentos por contrato
    async listDocumentsByContract(contractId) {
        try {
            const documents = await db.documents
                .where('contractId')
                .equals(contractId)
                .sortBy('fechaCreacion');

            return documents;
        } catch (error) {
            console.error('Error al listar documentos:', error);
            this.notifications.error(error.message || 'Error al listar documentos');
            return [];
        }
    }

    // Obtener documentos por tipo
    async getDocumentsByType(contractId, type) {
        try {
            const documents = await db.documents
                .where(['contractId', 'tipo'])
                .equals([contractId, type])
                .toArray();

            return documents;
        } catch (error) {
            console.error('Error al obtener documentos por tipo:', error);
            this.notifications.error(error.message || 'Error al obtener documentos por tipo');
            return [];
        }
    }

    // Obtener documentos por fecha
    async getDocumentsByDate(contractId, startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            const documents = await db.documents
                .where('contractId')
                .equals(contractId)
                .and(document => {
                    const fecha = new Date(document.fechaCreacion);
                    return fecha >= start && fecha <= end;
                })
                .toArray();

            return documents;
        } catch (error) {
            console.error('Error al obtener documentos por fecha:', error);
            this.notifications.error(error.message || 'Error al obtener documentos por fecha');
            return [];
        }
    }

    // Obtener documentos por búsqueda
    async searchDocuments(contractId, query) {
        try {
            const documents = await db.documents
                .where('contractId')
                .equals(contractId)
                .toArray();

            return documents.filter(document => {
                const searchStr = `
                    ${document.tipo}
                    ${document.nombre}
                    ${document.url}
                    ${document.observaciones || ''}
                `.toLowerCase();

                return searchStr.includes(query.toLowerCase());
            });
        } catch (error) {
            console.error('Error al buscar documentos:', error);
            this.notifications.error(error.message || 'Error al buscar documentos');
            return [];
        }
    }

    // Obtener tipos de documentos
    getDocumentTypes() {
        return [
            { id: 'contrato', nombre: 'Contrato' },
            { id: 'factura', nombre: 'Factura' },
            { id: 'boleta', nombre: 'Boleta' },
            { id: 'guia', nombre: 'Guía de Remisión' },
            { id: 'nota', nombre: 'Nota de Crédito' },
            { id: 'debito', nombre: 'Nota de Débito' },
            { id: 'otro', nombre: 'Otro' }
        ];
    }

    // Validar tipo de documento
    validateDocumentType(type) {
        const types = this.getDocumentTypes();
        return types.some(t => t.id === type);
    }

    // Obtener extensión de archivo
    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    // Validar extensión de archivo
    validateFileExtension(filename, allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']) {
        const extension = this.getFileExtension(filename).toLowerCase();
        return allowedExtensions.includes(extension);
    }

    // Validar tamaño de archivo
    validateFileSize(size, maxSize = 10 * 1024 * 1024) { // 10MB por defecto
        return size <= maxSize;
    }

    // Generar nombre de archivo
    generateFilename(originalName, contractId) {
        const timestamp = new Date().getTime();
        const extension = this.getFileExtension(originalName);
        return `doc_${contractId}_${timestamp}.${extension}`;
    }

    // Obtener URL de documento
    getDocumentUrl(document) {
        if (!document || !document.url) return null;
        return document.url;
    }

    // Descargar documento
    async downloadDocument(id) {
        try {
            const document = await this.getDocumentById(id);
            if (!document) return false;

            const url = this.getDocumentUrl(document);
            if (!url) {
                this.notifications.error('URL de documento no válida');
                return false;
            }

            // Crear enlace temporal
            const link = document.createElement('a');
            link.href = url;
            link.download = document.nombre;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return true;
        } catch (error) {
            console.error('Error al descargar documento:', error);
            this.notifications.error(error.message || 'Error al descargar documento');
            return false;
        }
    }

    // Previsualizar documento
    async previewDocument(id) {
        try {
            const document = await this.getDocumentById(id);
            if (!document) return false;

            const url = this.getDocumentUrl(document);
            if (!url) {
                this.notifications.error('URL de documento no válida');
                return false;
            }

            // Abrir en nueva ventana
            window.open(url, '_blank');
            return true;
        } catch (error) {
            console.error('Error al previsualizar documento:', error);
            this.notifications.error(error.message || 'Error al previsualizar documento');
            return false;
        }
    }
} 