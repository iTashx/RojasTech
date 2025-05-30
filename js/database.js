import Dexie from 'dexie';

// Módulo de base de datos
export const db = new Dexie('RojasTech');

// Definir esquema
db.version(1).stores({
    // Usuarios
    users: '++id, username, email, rol, activo, fechaCreacion, ultimoAcceso',
    // Tokens
    tokens: '++id, userId, token, tipo, expiracion, usado',
    // Configuración
    settings: 'key, value, fechaCreacion',
    // Empresas
    companies: '++id, ruc, razonSocial, nombre, direccion, contacto, logo, moneda, igv, retencion, activo, fechaCreacion',
    // Clientes
    clients: '++id, tipoDocumento, numeroDocumento, nombre, direccion, contacto, email, activo, fechaCreacion',
    // Productos
    products: '++id, codigo, nombre, descripcion, categoria, unidad, precio, stock, activo, fechaCreacion',
    // Servicios
    services: '++id, codigo, nombre, descripcion, categoria, unidad, precio, activo, fechaCreacion',
    // Categorías
    categories: '++id, codigo, nombre, descripcion, tipo, activo, fechaCreacion',
    // Unidades
    units: '++id, codigo, nombre, simbolo, activo, fechaCreacion',
    // Comprobantes
    documents: '++id, tipo, serie, numero, fecha, cliente, items, subtotal, igv, total, estado, fechaCreacion',
    // Items
    items: '++id, documento, tipo, codigo, nombre, cantidad, precio, subtotal, igv, total, fechaCreacion',
    // Pagos
    payments: '++id, documento, tipo, monto, fecha, estado, fechaCreacion',
    // Cajas
    cashboxes: '++id, nombre, saldo, activo, fechaCreacion',
    // Movimientos
    movements: '++id, caja, tipo, monto, concepto, fecha, fechaCreacion',
    // Reportes
    reports: '++id, tipo, nombre, parametros, fechaCreacion',
    // Plantillas
    templates: '++id, tipo, nombre, contenido, fechaCreacion',
    // Archivos
    files: '++id, nombre, tipo, tamaño, contenido, fechaCreacion',
    // Logs
    logs: '++id, tipo, mensaje, fechaCreacion'
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

// Exportar
export default db; 
