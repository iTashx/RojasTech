// js/graficos.js
// Lógica de gráficos y visualizaciones

// Módulo de gráficos
class GraficosManager {
    constructor() {
        this.statusChart = null;
        this.modalityChart = null;
        this.financialLineChart = null;
        this.initializeCharts();
        this.setupExportButtons();
    }

    initializeCharts() {
        const statusCtx = document.getElementById('contractStatusChart').getContext('2d');
        const modalityCtx = document.getElementById('contractModalityChart').getContext('2d');
        const financialLineCtx = document.getElementById('avanceFinancieroChart').getContext('2d');

        // Gráfico de estatus
        this.statusChart = new Chart(statusCtx, {
            type: 'bar',
            data: {
                labels: ['Activo', 'Cerrado', 'Suspendido'],
                datasets: [{
                    label: 'Contratos',
                    data: [0, 0, 0],
                    backgroundColor: ['#4A90E2', '#28a745', '#ffc107']
                }]
            }
        });

        // Gráfico de modalidad
        this.modalityChart = new Chart(modalityCtx, {
            type: 'bar',
            data: {
                labels: ['Licitación', 'Directo', 'Otro'],
                datasets: [{
                    label: 'Modalidad',
                    data: [0, 0, 0],
                    backgroundColor: ['#6c757d', '#17a2b8', '#dc3545']
                }]
            }
        });

        // Gráfico de avance financiero
        this.financialLineChart = new Chart(financialLineCtx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr'],
                datasets: [{
                    label: 'Avance Financiero',
                    data: [0, 0, 0, 0],
                    borderColor: '#2980b9',
                    backgroundColor: 'rgba(41,128,185,0.1)',
                    fill: true,
                    tension: 0.3
                }]
            }
        });
    }

    setupExportButtons() {
        // Exportar como PNG
        document.getElementById('export-chart-png').addEventListener('click', () => {
            const url = this.statusChart.toBase64Image();
            const a = document.createElement('a');
            a.href = url;
            a.download = 'contratos-por-estatus.png';
            a.click();
        });

        // Exportar a Excel
        document.getElementById('export-chart-excel').addEventListener('click', () => {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([
                ['Estatus', 'Cantidad'],
                ['Activo', 5],
                ['Cerrado', 2],
                ['Suspendido', 1]
            ]);
            XLSX.utils.book_append_sheet(wb, ws, 'Estatus');
            XLSX.writeFile(wb, 'contratos-por-estatus.xlsx');
        });

        // Exportar a PDF
        document.getElementById('export-chart-pdf').addEventListener('click', () => {
            const canvas = document.getElementById('contractStatusChart');
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF();
            pdf.text('Contratos por Estatus', 10, 10);
            pdf.addImage(imgData, 'PNG', 10, 20, 180, 80);
            pdf.save('contratos-por-estatus.pdf');
        });
    }

    updateCharts(data) {
        // Actualizar datos de los gráficos
        if (data.status) {
            this.statusChart.data.datasets[0].data = data.status;
            this.statusChart.update();
        }
        if (data.modality) {
            this.modalityChart.data.datasets[0].data = data.modality;
            this.modalityChart.update();
        }
        if (data.financial) {
            this.financialLineChart.data.datasets[0].data = data.financial;
            this.financialLineChart.update();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.graficosManager = new GraficosManager();
}); 