import Dexie from 'dexie';

// Define the database
const db = new Dexie('sigescon_db');

// Define the schema
db.version(3).stores({
    contratos: '++id, numeroProveedor, fechaTerminacion, estatus, modalidad, fechaCreacion, fechaModificacion',
    partidas: '++id, contratoId, descripcion',
    hes: '++id, contratoId, numeroHES, fechaFinal, estatus',
    partidasHES: '++id, hesId, partidaId',
    configuracion: '++id, clave, valor, descripcion'
}).upgrade(tx => {
    // Añadir configuración por defecto
    return tx.configuracion.add({
        clave: 'dias_alerta_vencimiento',
        valor: '20',
        descripcion: 'Número de días antes del vencimiento para mostrar alertas'
    });
});

// Open the database
db.open().catch((err) => {
    console.error("Failed to open database: " + err);
});

// Add relationships (optional but good for clarity)
db.contratos.hasMany('partidas', { foreignKey: 'contratoId' });
db.contratos.hasMany('hes', { foreignKey: 'contratoId' });
db.hes.hasMany('partidasHES', { foreignKey: 'hesId' });
db.partidas.hasMany('partidasHES', { foreignKey: 'partidaId' });

// Add sample data function (optional for testing)
async function addSampleData() {
    try {
        // Check if data already exists
        const count = await db.contratos.count();
        if (count === 0) {
            // Add sample contracts
            const contratoId1 = await db.contratos.add({
                numeroProveedor: 'C-001',
                fechaFirma: new Date('2023-01-01'),
                fechaInicio: new Date('2023-01-15'),
                fechaTerminacion: new Date('2023-12-31'),
                montoTotal: 100000,
                estatus: 'Activo',
                modalidad: 'Servicios',
                moneda: 'USD',
                observaciones: 'Contrato de consultoría anual.',
                archivos: [],
                fechaCreacion: new Date(),
                fechaModificacion: new Date()
            });

            const contratoId2 = await db.contratos.add({
                numeroProveedor: 'C-002',
                fechaFirma: new Date('2023-02-10'),
                fechaInicio: new Date('2023-03-01'),
                fechaTerminacion: new Date('2023-11-30'),
                montoTotal: 50000,
                estatus: 'Activo',
                modalidad: 'Suministros',
                moneda: 'EUR',
                observaciones: 'Contrato para suministro de materiales.',
                archivos: [],
                fechaCreacion: new Date(),
                fechaModificacion: new Date()
            });

            console.log("Sample data added successfully.");
        } else {
            console.log("Database already contains data.");
        }
    } catch (error) {
        console.error("Error adding sample data: " + error);
    }
}

// Export the database instance and sample data function
export { db, addSampleData }; 