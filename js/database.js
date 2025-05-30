import Dexie from 'dexie';
import { openDB } from 'idb';
import XLSX from 'xlsx';

// Sistema de Base de Datos SIGESCON
const db = new Dexie('SIGESCON');

// Definir esquema
db.version(1).stores({
    contracts: '++id, numeroProveedor, numeroSicac, fechaInicio, fechaTerminacion, estatus',
    partidas: '++id, contratoId, descripcion, cantidad, precio, total',
    hes: '++id, numeroHes, contratoId, fechaInicio, fechaFinal, estatus',
    notifications: '++id, type, message, read, timestamp',
    settings: 'key, value',
    backups: '++id, timestamp, metadata'
});

// Índices
db.users.hook('creating', function (primKey, obj) {
    // Índice por username
    db.users.where('username').equals(obj.username).first().then(existing => {
        if (existing) {
            throw new Error('El usuario ya existe');
        }
    });

    // Índice por email
    db.users.where('email').equals(obj.email).first().then(existing => {
        if (existing) {
            throw new Error('El email ya está registrado');
        }
    });
});

db.companies.hook('creating', function (primKey, obj) {
    // Índice por RUC
    db.companies.where('ruc').equals(obj.ruc).first().then(existing => {
        if (existing) {
            throw new Error('El RUC ya está registrado');
        }
    });
});

db.clients.hook('creating', function (primKey, obj) {
    // Índice por documento
    db.clients.where('numeroDocumento').equals(obj.numeroDocumento).first().then(existing => {
        if (existing) {
            throw new Error('El documento ya está registrado');
        }
    });
});

db.products.hook('creating', function (primKey, obj) {
    // Índice por código
    db.products.where('codigo').equals(obj.codigo).first().then(existing => {
        if (existing) {
            throw new Error('El código ya está registrado');
        }
    });
});

db.services.hook('creating', function (primKey, obj) {
    // Índice por código
    db.services.where('codigo').equals(obj.codigo).first().then(existing => {
        if (existing) {
            throw new Error('El código ya está registrado');
        }
    });
});

db.categories.hook('creating', function (primKey, obj) {
    // Índice por código
    db.categories.where('codigo').equals(obj.codigo).first().then(existing => {
        if (existing) {
            throw new Error('El código ya está registrado');
        }
    });
});

db.units.hook('creating', function (primKey, obj) {
    // Índice por código
    db.units.where('codigo').equals(obj.codigo).first().then(existing => {
        if (existing) {
            throw new Error('El código ya está registrado');
        }
    });
});

db.documents.hook('creating', function (primKey, obj) {
    // Índice por serie y número
    db.documents.where(['serie', 'numero']).equals([obj.serie, obj.numero]).first().then(existing => {
        if (existing) {
            throw new Error('El comprobante ya existe');
        }
    });
});

db.cashboxes.hook('creating', function (primKey, obj) {
    // Índice por nombre
    db.cashboxes.where('nombre').equals(obj.nombre).first().then(existing => {
        if (existing) {
            throw new Error('La caja ya existe');
        }
    });
});

// Hooks
db.documents.hook('creating', function (primKey, obj) {
    // Validar cliente
    if (!obj.cliente) {
        throw new Error('El cliente es requerido');
    }

    // Validar items
    if (!obj.items || obj.items.length === 0) {
        throw new Error('Los items son requeridos');
    }

    // Calcular totales
    obj.subtotal = obj.items.reduce((acc, item) => acc + item.subtotal, 0);
    obj.igv = obj.items.reduce((acc, item) => acc + item.igv, 0);
    obj.total = obj.subtotal + obj.igv;
});

db.movements.hook('creating', function (primKey, obj) {
    // Validar caja
    if (!obj.caja) {
        throw new Error('La caja es requerida');
    }

    // Validar monto
    if (!obj.monto || obj.monto <= 0) {
        throw new Error('El monto es requerido');
    }

    // Actualizar saldo
    db.cashboxes.get(obj.caja).then(caja => {
        if (!caja) {
            throw new Error('La caja no existe');
        }

        if (obj.tipo === 'ingreso') {
            caja.saldo += obj.monto;
        } else {
            if (caja.saldo < obj.monto) {
                throw new Error('Saldo insuficiente');
            }
            caja.saldo -= obj.monto;
        }

        db.cashboxes.put(caja);
    });
});

// Hooks para contratos
db.contracts.hook('creating', function (primKey, obj) {
    // Validar número de contrato
    if (!obj.numeroProveedor || !obj.numeroSicac) {
        throw new Error('El número de contrato es requerido');
    }

    // Validar cliente
    if (!obj.contratoId) {
        throw new Error('El contrato es requerido');
    }

    // Validar monto
    if (!obj.montoTotal || obj.montoTotal <= 0) {
        throw new Error('El monto debe ser mayor a 0');
    }
});

// Hooks para partidas
db.partidas.hook('creating', function (primKey, obj) {
    // Validar contrato
    if (!obj.contrato) {
        throw new Error('El contrato es requerido');
    }

    // Validar descripción
    if (!obj.descripcion) {
        throw new Error('La descripción es requerida');
    }

    // Validar cantidad y precio
    if (!obj.cantidad || obj.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
    }

    if (!obj.precio || obj.precio <= 0) {
        throw new Error('El precio debe ser mayor a 0');
    }

    // Calcular total
    obj.total = obj.cantidad * obj.precio;
});

// Hooks para HES
db.hes.hook('creating', function (primKey, obj) {
    // Validar contrato
    if (!obj.contratoId) {
        throw new Error('El contrato es requerido');
    }

    // Validar número de HES
    if (!obj.numeroHes) {
        throw new Error('El número de HES es requerido');
    }

    // Validar monto
    if (!obj.montoTotal || obj.montoTotal <= 0) {
        throw new Error('El monto debe ser mayor a 0');
    }
});

// Métodos
db.users.getByUsername = function (username) {
    return this.where('username').equals(username).first();
};

db.users.getByEmail = function (email) {
    return this.where('email').equals(email).first();
};

db.companies.getByRUC = function (ruc) {
    return this.where('ruc').equals(ruc).first();
};

db.clients.getByDocument = function (numeroDocumento) {
    return this.where('numeroDocumento').equals(numeroDocumento).first();
};

db.products.getByCode = function (codigo) {
    return this.where('codigo').equals(codigo).first();
};

db.services.getByCode = function (codigo) {
    return this.where('codigo').equals(codigo).first();
};

db.categories.getByCode = function (codigo) {
    return this.where('codigo').equals(codigo).first();
};

db.units.getByCode = function (codigo) {
    return this.where('codigo').equals(codigo).first();
};

db.documents.getByNumber = function (serie, numero) {
    return this.where(['serie', 'numero']).equals([serie, numero]).first();
};

db.cashboxes.getByName = function (nombre) {
    return this.where('nombre').equals(nombre).first();
};

// Configuración inicial
db.on('ready', async () => {
    try {
        // Verificar si existe configuración inicial
        const config = await db.config.get('system');
        if (!config) {
            // Crear configuración inicial
            await db.config.add({
                id: 'system',
                value: {
                    seguridad: {
                        intentosMaximosLogin: 3,
                        tiempoBloqueo: 30, // minutos
                        longitudMinimaPassword: 8,
                        sesionTimeout: 60, // minutos
                        adminUniversalPassword: 'RojasTech2024' // Contraseña universal para administradores
                    },
                    backup: {
                        interval: 24, // horas
                        maxBackups: 30,
                        autoBackup: true
                    },
                    notificaciones: {
                        mostrarToast: true,
                        sonido: true,
                        duracion: 5000 // milisegundos
                    }
                },
                lastModified: new Date()
            });
        }
    } catch (error) {
        console.error('Error al inicializar configuración:', error);
    }
});

// Clase para manejar la base de datos
class DatabaseManager {
    constructor() {
        this.db = db;
        this.initialized = false;
    }

    async init() {
        try {
            // Verificar si la base de datos está abierta
            if (!this.db.isOpen()) {
                await this.db.open();
            }

            // Crear índices necesarios
            await this.createIndexes();
            
            // Verificar y crear tablas si no existen
            await this.verifyTables();
            
            this.initialized = true;
            console.log('Base de datos inicializada correctamente');
            return true;
        } catch (error) {
            console.error('Error al inicializar la base de datos:', error);
            return false;
        }
    }

    async createIndexes() {
        try {
            // Índices para contratos
            await this.db.contracts.hook('creating', function(primKey, obj) {
                if (!obj.numeroSicac) {
                    throw new Error('El número SICAC es requerido');
                }
            });

            // Índices para HES
            await this.db.hes.hook('creating', function(primKey, obj) {
                if (!obj.numeroHes) {
                    throw new Error('El número HES es requerido');
                }
            });

            // Índices para notificaciones
            await this.db.notifications.hook('creating', function(primKey, obj) {
                obj.timestamp = new Date();
                obj.read = false;
            });
        } catch (error) {
            console.error('Error al crear índices:', error);
            throw error;
        }
    }

    async verifyTables() {
        try {
            // Verificar si las tablas existen
            const tables = await this.db.tables;
            const requiredTables = ['contracts', 'partidas', 'hes', 'notifications', 'settings', 'backups'];
            
            for (const table of requiredTables) {
                if (!tables.find(t => t.name === table)) {
                    console.warn(`Tabla ${table} no encontrada, creando...`);
                    await this.db[table].toCollection().count();
                }
            }
        } catch (error) {
            console.error('Error al verificar tablas:', error);
            throw error;
        }
    }

    // Métodos para notificaciones
    async saveNotification(notification) {
        try {
            if (!this.initialized) await this.init();
            return await this.db.notifications.add(notification);
        } catch (error) {
            console.error('Error al guardar notificación:', error);
            throw error;
        }
    }

    async getNotifications() {
        try {
            if (!this.initialized) await this.init();
            return await this.db.notifications.orderBy('timestamp').reverse().toArray();
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            throw error;
        }
    }

    async getUnreadNotifications() {
        try {
            if (!this.initialized) await this.init();
            return await this.db.notifications.where('read').equals(false).toArray();
        } catch (error) {
            console.error('Error al obtener notificaciones no leídas:', error);
            throw error;
        }
    }

    async markNotificationAsRead(id) {
        try {
            if (!this.initialized) await this.init();
            await this.db.notifications.update(id, { read: true });
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw error;
        }
    }

    // Métodos para contratos
    async saveContract(contract) {
        try {
            if (!this.initialized) await this.init();
            return await this.db.contracts.add(contract);
        } catch (error) {
            console.error('Error al guardar contrato:', error);
            throw error;
        }
    }

    async getContracts() {
        try {
            if (!this.initialized) await this.init();
            return await this.db.contracts.toArray();
        } catch (error) {
            console.error('Error al obtener contratos:', error);
            throw error;
        }
    }

    // Métodos para HES
    async saveHES(hes) {
        try {
            if (!this.initialized) await this.init();
            return await this.db.hes.add(hes);
        } catch (error) {
            console.error('Error al guardar HES:', error);
            throw error;
        }
    }

    async getHES() {
        try {
            if (!this.initialized) await this.init();
            return await this.db.hes.toArray();
        } catch (error) {
            console.error('Error al obtener HES:', error);
            throw error;
        }
    }

    // Métodos para respaldos
    async createBackup() {
        try {
            if (!this.initialized) await this.init();
            const backup = {
                timestamp: new Date(),
                metadata: {
                    version: '1.0',
                    tables: await this.db.tables.map(t => t.name)
                }
            };
            return await this.db.backups.add(backup);
        } catch (error) {
            console.error('Error al crear respaldo:', error);
            throw error;
        }
    }
}

// Crear y exportar una instancia única
const databaseManager = new DatabaseManager();
export default databaseManager; 