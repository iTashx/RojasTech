# Documentación Técnica - SIGESCON

## Estructura de la Base de Datos

### Tablas IndexedDB (Dexie.js)

#### 1. Contratos
```javascript
{
    id: number,
    numeroProveedor: string,
    fechaFirma: Date,
    fechaCreado: Date,
    fechaInicio: Date,
    fechaTerminacion: Date,
    periodoCulminacion: number,
    numeroSicac: string,
    divisionArea: string,
    eemn: string,
    region: string,
    naturalezaContratacion: string,
    lineaServicio: string,
    noPeticionOferta: string,
    modalidadContratacion: string,
    regimenLaboral: string,
    objetoContractual: string,
    fechaCambioAlcance: Date,
    montoOriginal: number,
    montoModificado: number,
    montoTotal: number,
    numeroContratoInterno: string,
    observaciones: string,
    estatus: string,
    moneda: string,
    archivos: Array<File>,
    fechaEliminacion: Date,
    eliminado: boolean
}
```

#### 2. Partidas
```javascript
{
    id: number,
    contratoId: number,
    descripcion: string,
    cantidad: number,
    umd: string,
    precioUnitario: number,
    total: number
}
```

#### 3. HES
```javascript
{
    id: number,
    contratoId: number,
    numeroHES: string,
    fechaInicio: Date,
    fechaFinal: Date,
    fechaCreado: Date,
    aprobado: string,
    fechaAprobado: Date,
    textoHES: string,
    textoBreve: string,
    valuacion: number,
    lugarPrestacionServicio: string,
    responsableSDO: string,
    anexos: Array<File>,
    ejecutada: boolean,
    valuado: boolean,
    subtotal: number,
    gastosAdministrativos: number,
    total: number,
    fechaEliminacion: Date,
    eliminado: boolean
}
```

#### 4. PartidasHES
```javascript
{
    id: number,
    hesId: number,
    partidaId: number,
    cantidadEjecutada: number,
    totalPartida: number
}
```

## Funcionalidades Principales

### 1. Gestión de Contratos
- **Crear Contrato**: Valida y almacena la información del contrato y sus partidas
- **Editar Contrato**: Permite modificar contratos existentes
- **Eliminar Contrato**: Marca como eliminado o elimina permanentemente
- **Listar Contratos**: Muestra contratos activos con filtros

### 2. Gestión de HES
- **Crear HES**: Asocia a un contrato y gestiona sus partidas
- **Editar HES**: Modifica información y cantidades ejecutadas
- **Eliminar HES**: Marca como eliminada o elimina permanentemente
- **Listar HES**: Muestra HES activas con filtros

### 3. Cálculos Automáticos
- **Avance Físico**: Calcula porcentajes basados en cantidades ejecutadas
- **Avance Financiero**: Calcula montos ejecutados vs. totales
- **Totales HES**: Calcula subtotales, gastos administrativos y totales

### 4. Exportación de Datos
- **Excel**: Exporta tablas a formato XLSX
- **PDF**: Genera reportes en PDF con jsPDF
- **Gráficos**: Exporta visualizaciones como PNG

## Eventos y Listeners

### Formularios
- `contract-form`: Maneja la creación/edición de contratos
- `hes-form`: Gestiona la creación/edición de HES
- `filter-form`: Controla los filtros de búsqueda

### Botones
- `save-contract-btn`: Guarda/actualiza contratos
- `save-hes-btn`: Guarda/actualiza HES
- `export-*`: Maneja exportaciones en diferentes formatos

## Funciones de Utilidad

### Cálculos
```javascript
function calcularPeriodoCulminacion(fechaInicio, fechaTerminacion) {
    // Calcula días entre fechas
}

function calcularTotalesHES(subtotal) {
    // Calcula gastos administrativos y total
}
```

### Validaciones
```javascript
function validarFechas(fechaInicio, fechaTerminacion) {
    // Valida coherencia entre fechas
}

function validarMontos(montoOriginal, montoModificado) {
    // Valida coherencia entre montos
}
```

### Exportación
```javascript
function exportarExcel(datos, nombreArchivo) {
    // Exporta a Excel
}

function exportarPDF(datos, nombreArchivo) {
    // Exporta a PDF
}
```

## Manejo de Errores

### Validaciones
- Fechas coherentes
- Montos válidos
- Campos requeridos
- Límites de cantidades

### Mensajes
- Toast notifications para feedback
- Alertas de confirmación
- Mensajes de error específicos

## Optimizaciones

### Rendimiento
- Lazy loading de datos
- Caché de cálculos frecuentes
- Paginación de listas largas

### Almacenamiento
- Compresión de archivos adjuntos
- Limpieza periódica de datos temporales
- Backup automático de datos críticos 