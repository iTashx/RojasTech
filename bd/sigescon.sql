-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sigescon;
USE sigescon;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user', 'guest') NOT NULL DEFAULT 'user',
    permissions JSON,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_access TIMESTAMP NULL,
    failed_attempts INT DEFAULT 0,
    blocked BOOLEAN DEFAULT FALSE,
    block_date TIMESTAMP NULL,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de contratos
CREATE TABLE IF NOT EXISTS contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_number VARCHAR(50) NOT NULL,
    sicac_number VARCHAR(50),
    contract_date DATE NOT NULL,
    created_date DATE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    completion_period INT,
    division_area VARCHAR(100),
    eemn VARCHAR(50),
    region VARCHAR(100),
    nature VARCHAR(100),
    service_line VARCHAR(100),
    offer_request_number VARCHAR(50),
    modality VARCHAR(100),
    labor_regime VARCHAR(100),
    description TEXT,
    scope_change_date DATE,
    original_amount DECIMAL(15,2) DEFAULT 0.00,
    modified_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    internal_number VARCHAR(50),
    observations TEXT,
    status ENUM('active', 'inactive', 'closed', 'suspended') DEFAULT 'active',
    currency ENUM('USD', 'EUR', 'VES') DEFAULT 'USD',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla de partidas de contrato
CREATE TABLE IF NOT EXISTS contract_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id INT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Tabla de HES
CREATE TABLE IF NOT EXISTS hes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id INT NOT NULL,
    hes_number VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_date DATE NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    approval_date DATE,
    description TEXT,
    brief_text VARCHAR(255),
    valuation DECIMAL(15,2) DEFAULT 0.00,
    service_location VARCHAR(255),
    sdo_responsible VARCHAR(100),
    executed BOOLEAN DEFAULT FALSE,
    valued BOOLEAN DEFAULT FALSE,
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    administrative_expenses DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla de partidas de HES
CREATE TABLE IF NOT EXISTS hes_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hes_id INT NOT NULL,
    contract_item_id INT NOT NULL,
    executed_quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hes_id) REFERENCES hes(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_item_id) REFERENCES contract_items(id)
);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('contract', 'hes') NOT NULL,
    entity_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value JSON NOT NULL,
    description TEXT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insertar usuarios iniciales
INSERT INTO users (username, password, email, name, role, permissions) VALUES
('angel', '$2a$10$YourHashedPasswordHere', 'angeljrojasm@gmail.com', 'Angel Rojas', 'admin', '["all"]'),
('rojastech782', '$2a$10$YourHashedPasswordHere', '', 'RojasTech Admin', 'admin', '["all"]');

-- Insertar configuración inicial del sistema
INSERT INTO system_config (key, value, description) VALUES
('security', '{
    "sessionTimeout": 30,
    "maxLoginAttempts": 3,
    "blockTime": 30,
    "minPasswordLength": 8,
    "requireSpecialChars": true,
    "requireNumbers": true,
    "requireUppercase": true
}', 'Configuración de seguridad del sistema'),
('backup', '{
    "autoBackup": true,
    "backupInterval": 24,
    "retentionDays": 90,
    "backupLocation": "local"
}', 'Configuración de respaldos'); 
