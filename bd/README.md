# Configuración de Base de Datos SIGESCON

Este directorio contiene los archivos necesarios para la configuración de la base de datos MySQL para el sistema SIGESCON.

## Requisitos Previos

1. MySQL Server instalado (versión 8.0 o superior)
2. Node.js instalado (versión 14 o superior)
3. Paquete mysql2 instalado (`npm install mysql2`)

## Estructura de Archivos

- `sigescon.sql`: Script SQL para crear la base de datos y sus tablas
- `config.js`: Configuración de conexión a MySQL
- `README.md`: Este archivo

## Pasos para la Configuración

1. **Crear la Base de Datos**
   ```bash
   mysql -u root -p < sigescon.sql
   ```

2. **Configurar la Conexión**
   - Editar el archivo `config.js`
   - Modificar los siguientes parámetros según tu configuración:
     ```javascript
     const dbConfig = {
         host: 'localhost',
         user: 'root',
         password: 'tu_contraseña',
         database: 'sigescon'
     };
     ```

3. **Probar la Conexión**
   ```javascript
   const { testConnection } = require('./config');
   
   async function test() {
       const connected = await testConnection();
       console.log('Conexión exitosa:', connected);
   }
   
   test();
   ```

## Estructura de la Base de Datos

La base de datos incluye las siguientes tablas:

1. `users`: Usuarios del sistema
2. `contracts`: Contratos
3. `contract_items`: Partidas de contratos
4. `hes`: Hojas de Estimación de Servicios
5. `hes_items`: Partidas de HES
6. `documents`: Documentos adjuntos
7. `audit_logs`: Registros de auditoría
8. `notifications`: Notificaciones del sistema
9. `system_config`: Configuración del sistema

## Usuarios Iniciales

Se crean dos usuarios administradores por defecto:

1. Usuario: `angel`
clave: itash1008
   - Email: angeljrojasm@gmail.com
   - Rol: Administrador

2. Usuario: `rojastech782`
   clave: jlrojas782 
   - Rol: Administrador

## Notas Importantes

1. Asegúrate de cambiar las contraseñas de los usuarios iniciales después de la primera instalación.
2. Realiza respaldos regulares de la base de datos.
3. Mantén actualizado el sistema de gestión de base de datos.
4. Configura correctamente los permisos de acceso a la base de datos.

## Soporte

Para cualquier problema o consulta, contactar a:
- Email: angeljrojasm@gmail.com
- Desarrollador: Angel Rojas 