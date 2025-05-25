document.addEventListener('DOMContentLoaded', async () => {
    const db = new Dexie('SigesconDB');
    db.version(1).stores({
        contracts: '++id,numeroContratoSICAC,fechaFirma,fechaCreado,fechaInicio,fechaTerminacion,periodoCulminacion,montoOriginal,montoModificado,montoTotal,partidas',
        hes: '++id,contractId,numeroHES,fechaInicioHES,fechaFinalHES,valuacion,partidasHES'
    });

    try {
        await db.open();
    } catch (err) {
        console.error("Error al abrir la base de datos:", err);
        showToast("Error al cargar la base de datos local.", "error");
        return;
    }

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
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.content-section');

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
        const contractListBody = document.getElementById('contracts-table-body');
        contractListBody.innerHTML = '';

        if (contracts.length === 0) {
            contractListBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay contratos registrados.</td></tr>`;
            return;
        }

        contracts.forEach(contract => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.numeroContratoSICAC}</td>
                <td>${contract.fechaInicio}</td>
                <td>${contract.fechaTerminacion}</td>
                <td>${contract.montoTotal.toFixed(2)}</td>
                <td>${contract.estatusContrato || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            `;
            contractListBody.appendChild(row);
        });
    }

    // Guardar contrato
    document.getElementById('contract-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const numeroContratoSICAC = document.getElementById('numero-contrato-sicac').value;

        if (!numeroContratoSICAC) {
            showToast("Por favor, complete todos los campos.", "warning");
            return;
        }

        try {
            await db.contracts.add({
                numeroContratoSICAC: numeroContratoSICAC,
                fechaFirma: document.getElementById('fecha-firma').value,
                fechaCreado: document.getElementById('fecha-creado').value,
                fechaInicio: document.getElementById('fecha-inicio').value,
                fechaTerminacion: document.getElementById('fecha-terminacion').value,
                periodoCulminacion: parseInt(document.getElementById('periodo-culminacion').value),
                montoOriginal: parseFloat(document.getElementById('monto-original').value),
                montoModificado: parseFloat(document.getElementById('monto-modificado').value),
                montoTotal: parseFloat(document.getElementById('monto-total').value),
                partidas: []
            });
            showToast("Contrato guardado exitosamente.", "success");
            loadContractList();
        } catch (error) {
            console.error("Error al guardar el contrato:", error);
            showToast("Error al guardar el contrato.", "error");
        }
    });
});