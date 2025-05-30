// Gestión de la tabla de partidas en Crear/Editar Partida

window.partidasPorContrato = window.partidasPorContrato || {};
window.selectedContractId = window.selectedContractId || null;

window.renderPartidasTable = function() {
    const table = document.getElementById('partidas-management-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    let partidas = window.partidasPorContrato[window.selectedContractId] || [];
    // Eliminar duplicados de GA antes de renderizar
    partidas = partidas.filter((p, idx, arr) => p.codigo !== 'GA-1' || arr.findIndex(x => x.codigo === 'GA-1') === idx);
    window.partidasPorContrato[window.selectedContractId] = partidas;
    partidas.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td contenteditable="true" data-field="descripcion">${p.descripcion}</td>
            <td contenteditable="true" data-field="cantidad">${p.cantidad}</td>
            <td contenteditable="true" data-field="umd">${p.umd}</td>
            <td contenteditable="true" data-field="precio">${p.precio}</td>
            <td data-field="total">${p.total}</td>
            <td>
                <button class="btn btn-danger btn-sm btn-del-partida" data-id="${p.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    // Eventos para eliminar partida
    tbody.querySelectorAll('.btn-del-partida').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            window.partidasPorContrato[window.selectedContractId] = (window.partidasPorContrato[window.selectedContractId] || []).filter(p => p.id != id);
            window.renderPartidasTable();
            window.notifyAction && window.notifyAction('info', 'Partida eliminada.');
        });
    });
    // Eventos para editar en línea y recalcular total
    tbody.querySelectorAll('td[contenteditable]').forEach(td => {
        td.addEventListener('input', (e) => {
            const row = td.parentElement;
            const idx = Array.from(tbody.children).indexOf(row);
            const field = td.getAttribute('data-field');
            const value = td.textContent;
            if (window.partidasPorContrato[window.selectedContractId] && window.partidasPorContrato[window.selectedContractId][idx]) {
                window.partidasPorContrato[window.selectedContractId][idx][field] = value;
                // Recalcular total si cambia cantidad o precio
                if (field === 'cantidad' || field === 'precio') {
                    const cantidad = parseFloat(row.querySelector('td[data-field="cantidad"]').textContent) || 0;
                    const precio = parseFloat(row.querySelector('td[data-field="precio"]').textContent) || 0;
                    const total = cantidad * precio;
                    row.querySelector('td[data-field="total"]').textContent = total > 0 ? total : '';
                    window.partidasPorContrato[window.selectedContractId][idx]['total'] = total > 0 ? total : '';
                }
                // Recalcular totales siempre que se edite
                actualizarTotalesContrato(window.selectedContractId);
            }
        });
    });
    // Recalcular totales al renderizar
    actualizarTotalesContrato(window.selectedContractId);
}

window.crearPartidaGastoAdministrativo = function(contractId, totalContrato) {
    if (!window.gastoAdministrativoDatos) return;
    const { monto, porcentaje } = window.gastoAdministrativoDatos;
    let montoFinal = monto;
    if (porcentaje > 0) {
        montoFinal += (totalContrato * porcentaje / 100);
    }
    // Crear partida #1 de gasto administrativo
    const partida = {
        id: 'GA-1',
        codigo: 'GA-1',
        descripcion: 'Gasto administrativo',
        cantidad: 1,
        umd: '',
        precio: montoFinal.toFixed(2),
        total: montoFinal.toFixed(2),
        editable: true
    };
    window.partidasPorContrato[contractId] = window.partidasPorContrato[contractId] || [];
    // Evitar duplicados
    if (!window.partidasPorContrato[contractId].some(p => p.codigo === 'GA-1')) {
        window.partidasPorContrato[contractId].unshift(partida);
    }
    window.renderPartidasTable();
    window.notifyAction && window.notifyAction('success', 'Partida añadida correctamente.');
};

// Función para cargar partidas por SICAC
function cargarPartidasPorSICAC(sicac) {
    const contrato = window.contracts.find(c => c.numeroSicac === sicac);
    if (!contrato) return;
    window.selectedContractId = contrato.id;
    // Renderizar partidas aunque esté vacío
    window.renderPartidasTable();
    // Si tiene GA, agregarlo automáticamente
    if (window.gastoAdministrativoDatos && contrato.gastoAdministrativo) {
        window.crearPartidaGastoAdministrativo(contrato.id, contrato.montoTotal || 0);
    }
    // Actualizar totales
    actualizarTotalesContrato(contrato.id);
}

// Función para actualizar totales
function actualizarTotalesContrato(contractId) {
    const contrato = window.contracts.find(c => c.id === contractId);
    if (!contrato) return;

    const partidas = window.partidasPorContrato[contractId] || [];
    let total = 0;

    // Sumar gasto administrativo si existe
    if (window.gastoAdministrativoDatos && contrato.gastoAdministrativo) {
        const { monto, porcentaje } = window.gastoAdministrativoDatos;
        total += monto;
        if (porcentaje > 0) {
            total += (contrato.montoTotal * porcentaje / 100);
        }
    }

    // Sumar resto de partidas
    partidas.forEach(partida => {
        total += parseFloat(partida.total) || 0;
    });

    // Actualizar monto total en el contrato
    contrato.montoTotal = total;
    document.getElementById('monto-total-contrato').value = total.toFixed(2);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const selectContrato = document.getElementById('select-contract-for-partidas');
    
    // Cargar contratos en el select
    if (window.contracts) {
        window.contracts.forEach(contrato => {
            const option = document.createElement('option');
            option.value = contrato.numeroSicac;
            option.text = `${contrato.numeroSicac} - ${contrato.objetoContractual}`;
            selectContrato.add(option);
        });
    }

    // Event listener para cambio de contrato
    selectContrato.addEventListener('change', function() {
        if (this.value) {
            cargarPartidasPorSICAC(this.value);
        }
    });
});

function agregarPartida() {
    // ... lógica previa ...
    window.notifyAction && window.notifyAction('success', 'Partida añadida correctamente.');
}

function eliminarPartida() {
    // ... lógica previa ...
    window.notifyAction && window.notifyAction('info', 'Partida eliminada.');
}

function errorPartida(msg) {
    window.notifyAction && window.notifyAction('error', msg);
} 