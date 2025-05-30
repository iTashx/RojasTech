# Plan de Pruebas - SIGESCON

## 1. Pruebas de Importación/Exportación

### 1.1 Esquema de Excel para Importación de Contratos
```
Hoja: Contratos
Columnas:
- numero_proveedor (texto, requerido)
- numero_sicac (texto, requerido)
- fecha_firma (fecha, requerido)
- fecha_inicio (fecha, requerido)
- fecha_terminacion (fecha, requerido)
- division_area (texto)
- eemn (texto)
- region (texto)
- naturaleza_contratacion (texto)
- linea_servicio (texto)
- no_peticion_oferta (texto)
- modalidad_contratacion (texto)
- regimen_laboral (texto)
- objeto_contractual (texto)
- monto_original (número)
- monto_modificado (número)
- estatus (texto)
- moneda (texto)

Hoja: Partidas
Columnas:
- numero_proveedor (texto, requerido)
- numero_partida (número, requerido)
- descripcion (texto, requerido)
- cantidad (número, requerido)
- umd (texto, requerido)
- precio_unitario (número, requerido)
```

### 1.2 Esquema de Excel para Importación de HES
```
Hoja: HES
Columnas:
- numero_hes (texto, requerido)
- numero_proveedor (texto, requerido)
- fecha_inicio (fecha, requerido)
- fecha_final (fecha, requerido)
- fecha_creado (fecha)
- aprobado (texto)
- fecha_aprobado (fecha)
- texto_hes (texto)
- texto_breve (texto)
- valuacion (número)
- lugar_prestacion_servicio (texto)
- responsable_sdo (texto)
- ejecutada (booleano)
- valuado (booleano)

Hoja: Partidas_HES
Columnas:
- numero_hes (texto, requerido)
- numero_partida (número, requerido)
- cantidad_ejecutar (número, requerido)
```

## 2. Plan de Pruebas por Módulo

### 2.1 Gestión de Contratos
1. **Creación de Contrato**
   - [ ] Crear contrato con datos mínimos
   - [ ] Crear contrato con todos los datos
   - [ ] Validar campos requeridos
   - [ ] Verificar cálculos automáticos
   - [ ] Probar adjuntos de archivos

2. **Edición de Contrato**
   - [ ] Modificar datos básicos
   - [ ] Modificar montos
   - [ ] Agregar/eliminar partidas
   - [ ] Verificar historial de cambios

3. **Partidas**
   - [ ] Agregar partida
   - [ ] Editar partida
   - [ ] Eliminar partida
   - [ ] Verificar cálculos de totales

### 2.2 Gestión de HES
1. **Creación de HES**
   - [ ] Crear HES vinculada a contrato
   - [ ] Validar fechas
   - [ ] Verificar cálculos de montos
   - [ ] Probar adjuntos

2. **Partidas HES**
   - [ ] Seleccionar partidas del contrato
   - [ ] Ingresar cantidades
   - [ ] Verificar cálculos
   - [ ] Validar límites

### 2.3 Exportaciones
1. **Excel**
   - [ ] Exportar lista de contratos
   - [ ] Exportar detalle de contrato
   - [ ] Exportar HES
   - [ ] Exportar reportes

2. **PDF**
   - [ ] Exportar contrato
   - [ ] Exportar HES
   - [ ] Exportar reportes
   - [ ] Verificar formato

3. **Imágenes**
   - [ ] Exportar gráficos
   - [ ] Exportar dashboards
   - [ ] Verificar calidad

### 2.4 Importaciones
1. **Excel**
   - [ ] Importar contratos
   - [ ] Importar HES
   - [ ] Validar datos
   - [ ] Manejar errores

2. **Validaciones**
   - [ ] Campos requeridos
   - [ ] Formatos de fecha
   - [ ] Valores numéricos
   - [ ] Relaciones entre datos

## 3. Pruebas de Integración

### 3.1 Flujos Completos
1. **Ciclo de Contrato**
   - [ ] Crear contrato
   - [ ] Agregar partidas
   - [ ] Crear HES
   - [ ] Registrar avances
   - [ ] Generar reportes

2. **Ciclo de HES**
   - [ ] Crear HES
   - [ ] Registrar ejecución
   - [ ] Aprobar HES
   - [ ] Actualizar avances

### 3.2 Validaciones Cruzadas
1. **Contratos y HES**
   - [ ] Verificar montos
   - [ ] Validar fechas
   - [ ] Comprobar partidas

2. **Avances**
   - [ ] Físico vs Financiero
   - [ ] HES vs Contrato
   - [ ] Totales y subtotales

## 4. Pruebas de Rendimiento

### 4.1 Base de Datos
1. **Operaciones**
   - [ ] Carga inicial
   - [ ] Consultas
   - [ ] Actualizaciones
   - [ ] Respaldos

2. **Importación/Exportación**
   - [ ] Archivos grandes
   - [ ] Múltiples registros
   - [ ] Tiempo de respuesta

### 4.2 Interfaz
1. **Responsive**
   - [ ] Móvil
   - [ ] Tablet
   - [ ] Escritorio

2. **Rendimiento**
   - [ ] Carga de páginas
   - [ ] Animaciones
   - [ ] Gráficos

## 5. Manejo de Errores

### 5.1 Validaciones
1. **Datos**
   - [ ] Campos requeridos
   - [ ] Formatos
   - [ ] Rangos

2. **Relaciones**
   - [ ] Contratos-HES
   - [ ] Partidas
   - [ ] Montos

### 5.2 Mensajes
1. **Usuario**
   - [ ] Claridad
   - [ ] Acciones
   - [ ] Soluciones

2. **Sistema**
   - [ ] Logs
   - [ ] Trazas
   - [ ] Recuperación

## 6. Documentación de Pruebas

### 6.1 Registro
1. **Errores**
   - [ ] Descripción
   - [ ] Pasos
   - [ ] Severidad

2. **Mejoras**
   - [ ] Sugerencias
   - [ ] Prioridades
   - [ ] Impacto

### 6.2 Reportes
1. **Resultados**
   - [ ] Éxitos
   - [ ] Fallos
   - [ ] Pendientes

2. **Métricas**
   - [ ] Tiempos
   - [ ] Rendimiento
   - [ ] Calidad 