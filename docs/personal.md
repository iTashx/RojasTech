# Documentación Técnica SIGESCON

## Estructura del Proyecto

```
SIGESCON/
├── index.html          # Página principal de la aplicación
├── ayuda.html          # Documentación para usuarios finales
├── css/
│   ├── style.css      # Estilos generales de la aplicación
│   └── ayuda.css      # Estilos específicos de la página de ayuda
├── js/
│   └── script.js      # Lógica principal de la aplicación
└── docs/
    └── personal.md    # Documentación técnica (este archivo)
```

## Tecnologías Utilizadas

- **Frontend**:
  - HTML5
  - CSS3 (Bootstrap 5.3.0)
  - JavaScript (ES6+)
  - Dexie.js (IndexedDB)
  - Chart.js (Gráficos)
  - XLSX.js (Exportación a Excel)
  - jsPDF (Exportación a PDF)

## Base de Datos (IndexedDB)

### Tablas

1. **Contratos**
   ```javascript
   {
     id: number,
     numeroProveedor: string,
     fechaFirma: Date,
     fechaInicio: Date,
     fechaTerminacion: Date,
     montoTotal: number,
     estatus: string,
     // ... otros campos
   }
   ```

2. **Partidas**
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

3. **HES**
   ```javascript
   {
     id: number,
     contratoId: number,
     numeroHES: string,
     fechaInicio: Date,
     fechaFinal: Date,
     total: number,
     estatus: string
   }
   ```

4. **PartidasHES**
   ```javascript
   {
     id: number,
     hesId: number,
     partidaId: number,
     cantidadEjecutada: number,
     totalPartida: number
   }
   ```

## Componentes de la UI

### 1. Header
- Logo y título de la aplicación
- Botón de ayuda que abre `ayuda.html` en nueva pestaña

### 2. Sidebar
- Navegación principal con iconos de Font Awesome
- Secciones:
  - Resumen General
  - Nuevo/Editar Contrato
  - Lista de Contratos
  - Gestión de HES
  - Avance Físico
  - Avance Financiero
  - Resumen Gráfico
  - Informes
  - Papelera de Reciclaje

### 3. Contenido Principal
Cada sección se carga dinámicamente en el área de contenido principal.

## Funcionalidades Principales

### Gestión de Contratos
- Creación y edición de contratos
- Gestión de partidas
- Cálculos automáticos de montos
- Validaciones de fechas y montos

### Gestión de HES
- Creación y edición de HES
- Asociación con contratos
- Cálculo automático de subtotales y totales
- Control de cantidades ejecutadas

### Avances
- Cálculo de avance físico por partida
- Cálculo de avance financiero global
- Visualización de progreso con barras
- Exportación de reportes

### Gráficos
- Gráficos de estado de contratos
- Gráficos por modalidad
- Exportación a PNG
- Diferentes tipos de visualización

## Eventos y Listeners

### Formularios
- `contract-form`: Gestión de contratos
- `hes-form`: Gestión de HES
- Validación y cálculo automático de campos

### Botones
- Navegación entre secciones
- Acciones CRUD
- Exportación de datos
- Filtros y búsquedas

## Funciones de Utilidad

### Cálculos
```javascript
// Cálculo de período
function calcularPeriodo(fechaInicio, fechaFin) {
    // Implementación
}

// Cálculo de montos
function calcularMontos(partidas) {
    // Implementación
}
```

### Validaciones
```javascript
// Validación de fechas
function validarFechas(fechaInicio, fechaFin) {
    // Implementación
}

// Validación de montos
function validarMontos(monto) {
    // Implementación
}
```

### Exportación
```javascript
// Exportar a Excel
function exportarExcel(datos) {
    // Implementación
}

// Exportar a PDF
function exportarPDF(datos) {
    // Implementación
}
```

## Manejo de Errores

- Validación de formularios
- Mensajes de error en toasts
- Confirmaciones para acciones críticas
- Manejo de errores de base de datos

## Optimizaciones

### Rendimiento
- Carga lazy de secciones
- Caché de datos frecuentes
- Optimización de consultas IndexedDB

### Almacenamiento
- Limpieza periódica de datos temporales
- Compresión de archivos adjuntos
- Backup automático de datos críticos

## Consideraciones de Seguridad

- Validación de datos en cliente
- Sanitización de entradas
- Protección contra XSS
- Manejo seguro de archivos

## Mantenimiento

### Actualizaciones
- Control de versiones
- Migración de datos
- Actualización de dependencias

### Depuración
- Logs de errores
- Herramientas de desarrollo
- Testing de funcionalidades

## Contacto

Para soporte técnico o desarrollo:
- Email: angeljrojasm@gmail.com
- Desarrollado por: RojasTech 