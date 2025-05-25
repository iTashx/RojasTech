document.addEventListener('DOMContentLoaded', async () => {
    const db = new Dexie('SigesconDB');
    db.version(1).stores({
        contracts: '++id,numeroProveedor,fechaFirmaContrato,fechaInicio,montoTotalContrato,modalidadContratacion',
        hes: '++id,contractId,numeroHES,fechaInicioHES,fechaFinalHES'
    });

    try {
        await db.open();
    } catch (err) {
        console.error("Error al abrir la base de datos:", err);
        showToast("Error al cargar la base de datos local.", "error");
        return;
    }

    // Elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.content-section');

    // Función para mostrar mensajes emergentes
    window.showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    // Manejar pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Cargar lista inicial de contratos
    loadContractList();

    // Función para cargar la lista de contratos
    async function loadContractList() {
        const contracts = await db.contracts.toArray();
        const contractListBody = document.getElementById('contract-list-body');
        contractListBody.innerHTML = '';

        if (contracts.length === 0) {
            contractListBody.innerHTML = `<tr><td colspan="8" class="text-center">No hay contratos registrados.</td></tr>`;
            return;
        }

        contracts.forEach(contract => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.numeroProveedor}</td>
                <td>${contract.numeroSICAC || '-'}</td>
                <td>${contract.fechaInicio}</td>
                <td>${contract.montoTotalContrato.toFixed(2)}</td>
                <td>${contract.estatusContrato || '-'}</td>
                <td>${contract.modalidadContratacion || '-'}</td>
                <td>${contract.objetoContractual || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            `;
            contractListBody.appendChild(row);
        });
    }

    // Limpiar formulario de contratos
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        document.getElementById('filter-proveedor').value = '';
        document.getElementById('filter-sicac').value = '';
    });

    // Guardar contrato
    document.getElementById('contract-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const lineaServicio = document.getElementById('linea-servicio').value;
        const modalidadContratacion = document.getElementById('modalidad-contratacion').value;

        if (!lineaServicio || !modalidadContratacion) {
            showToast("Por favor, complete todos los campos.", "warning");
            return;
        }

        try {
            await db.contracts.add({
                numeroProveedor: 'PROV-123',
                fechaFirmaContrato: new Date().toISOString(),
                fechaInicio: new Date().toISOString(),
                montoTotalContrato: 10000,
                modalidadContratacion: modalidadContratacion
            });
            showToast("Contrato guardado exitosamente.", "success");
            loadContractList();
        } catch (error) {
            console.error("Error al guardar el contrato:", error);
            showToast("Error al guardar el contrato.", "error");
        }
    });
});