# SIGESCON - Sistema de Gestión de Contratos Empresariales

## Descripción
SIGESCON es un sistema integral para la gestión de contratos empresariales que permite administrar contratos, HES (Hojas de Estimación de Servicios), realizar seguimiento de avances físicos y financieros, y gestionar notificaciones y base de datos de manera avanzada.

## Estructura del Proyecto

```
SIGESCON/
├── css/
│   ├── core/
│   │   ├── variables.css
│   │   └── reset.css
│   ├── components/
│   │   ├── tabs.css
│   │   ├── buttons.css
│   │   └── forms.css
│   ├── modules/
│   │   ├── contracts.css
│   │   ├── suppliers.css
│   │   └── reports.css
│   └── themes/
│       ├── theme-light.css
│       └── theme-dark.css
├── js/
│   ├── modules/
│   │   ├── contracts/
│   │   ├── suppliers/
│   │   ├── reports/
│   │   └── utils/
│   └── app.js
├── docs/
│   ├── MDP.md
│   ├── modulos.md
│   └── technical.md
└── assets/
    ├── images/
    └── icons/
├── bd/
│   ├── contratos/
│   ├── partidas/
│   ├── hes/
│   └── backups/
```

## Características Principales
- Gestión completa de contratos y partidas
- Importación masiva de contratos desde Excel
- Administración de HES
- Seguimiento de avances físicos y financieros
- Sistema de notificaciones avanzado (eventos, errores, sistema)
- Exportación de reportes en múltiples formatos
- Papelera de reciclaje
- Interfaz responsiva y moderna
- Gestor de base de datos: crear/cambiar base de datos desde la interfaz
- Caché local para modalidades y contratos

## Requisitos del Sistema
- Navegador web moderno (Chrome, Firefox, Edge)
- JavaScript habilitado
- Almacenamiento local disponible

## Instalación y Uso
1. Clonar el repositorio
2. Abrir `index.html` en el navegador
3. No se requiere configuración adicional

### Gestor de Base de Datos
- Puedes crear una nueva base de datos desde la interfaz (menú "Gestión de Base de Datos").
- Puedes importar contratos desde un archivo Excel usando el botón "Importar Contratos".
- Exporta y respalda tu base de datos desde el mismo menú.

### Importación de Contratos desde Excel
- Haz clic en "Importar Contratos" y selecciona tu archivo Excel.
- El sistema validará y cargará los contratos automáticamente.
- Si hay errores, se mostrarán en la campanita de notificaciones con detalles y posibles soluciones.

### Notificaciones
- La campanita muestra hasta 15 mensajes recientes (eventos, errores, avisos del sistema).
- Al seleccionar una notificación, verás el mensaje completo y, si es error, detalles y posibles soluciones.
- Puedes marcar todas las notificaciones como leídas con un solo clic.

## Línea de Tiempo de Versiones
- Consulta el archivo `notas/actualizaciones.txt` para ver la línea de tiempo consolidada desde la v1 hasta la versión actual.

## Documentación
- [Guía de Usuario](docs/ayuda.html)
- [Documentación Técnica](docs/documentacion.html)
- [Manual de Desarrollo](docs/MDP.md)

## Soporte
Para asistencia técnica:
- Email: angeljrojasm@gmail.com
- Desarrollado por: RojasTech

## Versión
2.0.0

## Licencia
Todos los derechos reservados © 2025 RojasTech

## Tecnologías Utilizadas
- Frontend: HTML5, CSS3, JavaScript
- Base de Datos: IndexedDB
- UI Framework: Bootstrap 5.3
- Iconos: Font Awesome
- Gráficos: Chart.js
- Exportación/Importación: XLSX, jsPDF

## Próximas Actualizaciones
1. Integración con Electron para aplicación de escritorio
2. Sistema de sincronización en la nube
3. API REST para integración con otros sistemas
4. Módulo de facturación
5. Sistema de alertas por correo electrónico

## Desarrollo
- Desarrollado por: RojasTech
- Contacto: angeljrojasm@gmail.com
- Versión actual: 1.0.0

## Notas de Desarrollo
- Sistema modular para fácil mantenimiento
- Código documentado y comentado
- Implementación de patrones de diseño
- Optimización de rendimiento
- Interfaz responsiva

## Estado Actual del Proyecto
- ✅ Base de datos implementada
- ✅ Sistema de notificaciones
- ✅ Gestión de contratos
- ✅ Gestión de HES
- ✅ Reportes básicos
- ⏳ Integración con Electron
- ⏳ Empaquetado de aplicación
- ⏳ Documentación completa

## Próximos Pasos
1. Pruebas de integración
2. Depuración de errores
3. Implementación de Electron
4. Empaquetado de la aplicación
5. Documentación técnica completa

## Requisitos del Sistema

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Conexión a Internet
- Resolución mínima: 1024x768

## Documentación

- [Manual de Usuario](docs/user-guide.md)
- [Documentación Técnica](docs/technical.md)
- [Guía de Desarrollo](docs/development.md)
- [API Reference](docs/api.md)

## Contribución

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Soporte

Para soporte técnico, contactar a:
- Email: soporte@rojastech.com
- Teléfono: +1234567890
- Horario: Lunes a Viernes 9:00 - 18:00

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## Créditos

Desarrollado por:
- RojasTech
- Equipo de Desarrollo
- Contribuidores

## Actualizaciones Recientes

Ver el archivo [actualizaciones.txt](actualizaciones.txt) para un registro detallado de los cambios.

## Uso del Gestor de Base de Datos

```javascript
// Inicializar
const db = new DatabaseManager();
await db.init();

// Guardar archivo
const filePath = await db.saveFile(archivo, 'contrato', id);

// Obtener archivo
const archivo = await db.getFile(filePath);

// Exportar backup
const backupPath = await db.export();

// Importar backup
await db.import(backupPath);
```

## Pruebas Automáticas

Para verificar el correcto funcionamiento del sistema, ejecuta el script de pruebas automáticas ubicado en `js/tests/autoTestGESCON.js`.

### ¿Qué prueba este script?
- Creación y cambio de base de datos
- Importación de contratos desde Excel
- Visualización y funcionamiento de la campanita de notificaciones (incluyendo errores y soluciones)
- Exportación de contratos y visualización de gráficos
- Funcionamiento de la caché y sincronización

### ¿Cómo ejecutarlo?
1. Abre la consola del navegador en la página principal de SIGESCON.
2. Ejecuta:
```js
import('/js/tests/autoTestGESCON.js').then(m => m.runAllTests());
```
3. Observa los resultados y notificaciones en la interfaz y consola.

Si alguna prueba falla, revisa la campanita de notificaciones para ver detalles y posibles soluciones.

## Novedades (junio 2024)
- Nuevo: Checkbox de Gasto Administrativo (GA) en el formulario de contratos.
- Modal para configurar monto fijo y/o porcentaje de GA, con validación y desactivación automática.
- Creación automática de la partida GA al guardar el contrato si el checkbox está activo.
- El total del contrato se actualiza automáticamente incluyendo GA.
- Todos los selectores, tablas y filtros ahora usan SICAC como identificador principal.
- El carrusel, resumen y avances muestran los contratos por SICAC y se actualizan tras crear/editar contratos.
- El gráfico de resumen se vació, dejando solo los botones de exportar. 