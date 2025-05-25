// script.js

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar base de datos con Dexie
    const db = new Dexie('SigesconDB');
    db.version(1).stores({
        contracts: '++id,numeroProveedor,fechaFirmaContrato,fechaCreado,fechaInicio,fechaTerminacion,periodoCulminacion,numeroContratoSICAC,descripcionContrato,montoTotalContrato,estatusContrato'
    });

    // Elementos del DOM
    const contractForm = document.getElementById('contract-form');
    const contractListBody = document.getElementById('contract-list-body');
    const addModalityBtn = document.getElementById('add-modality-btn');
    const removeModalityBtn = document.getElementById('remove-modality-btn');
    const modalidadContratacion = document.getElementById('modalidad-contratacion');
    const toastElement = document.getElementById('toast');

    // Función para mostrar mensajes emergentes (toast)
    window.showToast = (message, type = 'success') => {
        if (!toastElement) return;

        toastElement.textContent = message;
        toastElement.className = `toast show ${type}`;

        setTimeout(() => {
            toastElement.classList.remove('show');
        }, 3000);
    };

    // Manejar pestañas
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Cargar contratos desde Dexie
    const loadContractList = async () => {
        try {
            const contracts = await db.contracts.toArray();
            contractListBody.innerHTML = '';
            contracts.forEach(contract => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contract.numeroProveedor || ''}</td>
                    <td>${contract.numeroContratoSICAC || ''}</td>
                    <td>${contract.fechaInicio || ''}</td>
                    <td>${contract.fechaTerminacion || ''}</td>
                    <td>${contract.montoTotalContrato || ''}</td>
                    <td>
                        <button class="btn btn-primary btn-sm edit-btn" data-id="${contract.id}">Editar</button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${contract.id}">Eliminar</button>
                    </td>
                `;
                contractListBody.appendChild(row);
            });

            // Eventos para botones de editar/eliminar
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    const contract = await db.contracts.get(id);
                    fillForm(contract);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    if (confirm("¿Estás seguro de eliminar este contrato?")) {
                        await db.contracts.delete(id);
                        showToast('Contrato eliminado correctamente.', 'success');
                        loadContractList();
                    }
                });
            });

        } catch (error) {
            console.error("Error al cargar los contratos:", error);
            showToast("Error al cargar los contratos.", "error");
        }
    };

    // Guardar contrato
    if (contractForm) {
        contractForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const contractData = {
                numeroProveedor: document.getElementById('numero-proveedor').value,
                fechaFirmaContrato: document.getElementById('fecha-firma-contrato').value,
                fechaCreado: document.getElementById('fecha-creacion').value,
                fechaInicio: document.getElementById('fecha-inicio').value,
                fechaTerminacion: document.getElementById('fecha-terminacion').value,
                periodoCulminacion: document.getElementById('duracion-dias').value,
                numeroContratoSICAC: document.getElementById('numero-contrato-sicac').value,
                descripcionContrato: document.getElementById('objeto-contractual').value,
                montoTotalContrato: parseFloat(document.getElementById('monto-total-contrato').value) || 0,
                estatusContrato: document.getElementById('estatus-contrato').value
            };

            const contractId = document.getElementById('contract-id').value;

            try {
                if (contractId) {
                    await db.contracts.update(parseInt(contractId), contractData);
                    showToast("Contrato actualizado correctamente.", "success");
                } else {
                    await db.contracts.add(contractData);
                    showToast("Contrato guardado correctamente.", "success");
                }

                contractForm.reset();
                document.getElementById('contract-id').value = '';
                loadContractList();

            } catch (error) {
                console.error("Error al guardar el contrato:", error);
                showToast("Error al guardar el contrato. Verifique los datos.", "error");
            }
        });
    }

    // Llenar formulario para edición
    const fillForm = (contract) => {
        document.getElementById('contract-id').value = contract.id;
        document.getElementById('numero-proveedor').value = contract.numeroProveedor || '';
        document.getElementById('fecha-firma-contrato').value = contract.fechaFirmaContrato || '';
        document.getElementById('fecha-creacion').value = contract.fechaCreado || '';
        document.getElementById('fecha-inicio').value = contract.fechaInicio || '';
        document.getElementById('fecha-terminacion').value = contract.fechaTerminacion || '';
        document.getElementById('duracion-dias').value = contract.periodoCulminacion || '';
        document.getElementById('numero-contrato-sicac').value = contract.numeroContratoSICAC || '';
        document.getElementById('objeto-contractual').value = contract.descripcionContrato || '';
        document.getElementById('monto-total-contrato').value = contract.montoTotalContrato || '';
        document.getElementById('estatus-contrato').value = contract.estatusContrato || '';
    };

    // Añadir modalidad dinámica
    if (addModalityBtn && modalidadContratacion) {
        addModalityBtn.addEventListener('click', () => {
            const modalidad = prompt("Ingrese una nueva modalidad:");
            if (modalidad && !Array.from(modalidadContratacion.options).some(opt => opt.value === modalidad)) {
                const option = document.createElement('option');
                option.value = modalidad;
                option.textContent = modalidad;
                modalidadContratacion.appendChild(option);
            }
        });
    }

    // Eliminar modalidad
    if (removeModalityBtn && modalidadContratacion) {
        removeModalityBtn.addEventListener('click', () => {
            const selected = modalidadContratacion.selectedOptions[0];
            if (selected) {
                selected.remove();
            } else {
                alert("Seleccione una modalidad para eliminar.");
            }
        });
    }

    // Cálculo automático de duración
    const calcularDuracion = () => {
        const inicio = document.getElementById('fecha-inicio').value;
        const fin = document.getElementById('fecha-terminacion').value;
        if (inicio && fin) {
            const start = new Date(inicio);
            const end = new Date(fin);
            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            document.getElementById('duracion-dias').value = diffDays >= 0 ? diffDays : 0;
        }
    };

    document.getElementById('fecha-inicio')?.addEventListener('change', calcularDuracion);
    document.getElementById('fecha-terminacion')?.addEventListener('change', calcularDuracion);

    // Actualización automática de monto total
    const updateMontoTotal = () => {
        const original = parseFloat(document.getElementById('monto-original').value) || 0;
        const modificado = parseFloat(document.getElementById('monto-modificado').value) || 0;
        document.getElementById('monto-total-contrato').value = (original + modificado).toFixed(2);
    };

    document.getElementById('monto-original')?.addEventListener('input', updateMontoTotal);
    document.getElementById('monto-modificado')?.addEventListener('input', updateMontoTotal);

    // Exportar a Excel
    document.getElementById('export-excel-btn')?.addEventListener('click', async () => {
        const ws = XLSX.utils.table_to_sheet(document.querySelector('#contract-list-body').closest('table'));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contratos");
        XLSX.writeFile(wb, "contratos.xlsx");
        showToast("Datos exportados a Excel.", "success");
    });

    // Exportar a PDF
    document.getElementById('export-pdf-btn')?.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const table = document.querySelector('#contract-list-body').closest('table');
        const rows = [];
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText);

        table.querySelectorAll('tbody tr').forEach(tr => {
            const cells = Array.from(tr.children).map(td => td.innerText);
            rows.push(cells);
        });

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 9 },
        });

        doc.save("contratos.pdf");
        showToast("Datos exportados a PDF.", "success");
    });

    // Cargar lista inicial de contratos
    if (contractListBody) {
        loadContractList();
    }

    // Manejo de archivos adjuntos
    document.getElementById('adjuntar-archivos')?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const list = document.getElementById('attached-files-list');
        list.innerHTML = files.map(f => `<div>📎 ${f.name}</div>`).join('');
    });

    // Mostrar ayuda
    document.querySelectorAll('[data-bs-toggle="modal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-bs-target');
            const modal = document.querySelector(modalId);
            if (modal) {
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();
            }
        });
    });

    // Iniciar gráfico básico
    const chartCanvas = document.getElementById('modalityChart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        let chartInstance = null;

        const renderChart = async () => {
            if (chartInstance) {
                chartInstance.destroy();
            }

            const contracts = await db.contracts.toArray();
            const modalidades = {};

            contracts.forEach(c => {
                const key = c.modalidadContratacion || 'Sin Modalidad';
                modalidades[key] = (modalidades[key] || 0) + 1;
            });

            const labels = Object.keys(modalidades);
            const data = Object.values(modalidades);

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Contratos por Modalidad',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        };

        renderChart();

        document.getElementById('chart-type-select')?.addEventListener('change', renderChart);
    }

    // Carga inicial
    document.querySelectorAll('.tab-btn')[0]?.click();

    // Mostrar mensaje de éxito al iniciar
    showToast("SIGESCON cargado correctamente", "success");
});