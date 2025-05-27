# SIGESCON - Sistema de Gestión de Contratos

## Descripción
SIGESCON es un sistema integral para la gestión de contratos empresariales, desarrollado por RojasTech. El sistema permite gestionar contratos, partidas, proveedores y generar reportes de manera eficiente.

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
```

## Características Principales

### 1. Gestión de Contratos
- Creación y edición de contratos
- Gestión de partidas
- Seguimiento de estados
- Historial de modificaciones

### 2. Sistema de Notificaciones
- Notificaciones en tiempo real
- Filtrado por tipo (error, advertencia, info)
- Detalles expandibles
- Marcado de leídas/no leídas

### 3. Interfaz de Usuario
- Diseño responsive
- Temas claro/oscuro
- Componentes reutilizables
- Accesibilidad mejorada

### 4. Reportes y Exportación
- Generación de PDF
- Exportación a Excel
- Gráficos y estadísticas
- Filtros personalizados

## Requisitos del Sistema

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Conexión a Internet
- Resolución mínima: 1024x768

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/rojastech/sigescon.git
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Uso

1. Acceder al sistema:
   - URL: http://localhost:3000
   - Usuario: admin
   - Contraseña: admin123

2. Crear un nuevo contrato:
   - Hacer clic en "Nuevo Contrato"
   - Completar los datos requeridos
   - Agregar partidas
   - Guardar el contrato

3. Gestionar notificaciones:
   - Ver notificaciones en el icono de campana
   - Filtrar por tipo
   - Marcar como leídas
   - Ver detalles expandidos

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