const INIT_DB_SCHEMA = `
CREATE DATABASE IF NOT EXISTS supplier_management_module;
USE supplier_management_module;

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    salutation VARCHAR(10) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    company_name VARCHAR(225) NOT NULL UNIQUE,
    display_company_name VARCHAR(225) NOT NULL UNIQUE,

    email VARCHAR(225) NOT NULL UNIQUE,
    work_phone_country_code VARCHAR(5),
    work_phone VARCHAR(20) UNIQUE,
    mobile_phone_country_code VARCHAR(5),
    mobile_phone VARCHAR(20),

    gst VARCHAR(20),
    pan VARCHAR(20),

    is_msme_registered TINYINT(1) DEFAULT 0,
    tds_tax_code VARCHAR(50),

    currency ENUM('INR', 'USD', 'EUR', 'GBP') DEFAULT 'INR',
    payment_terms VARCHAR(50),

    is_active TINYINT(1) DEFAULT 1,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_suppliers_active_deleted (is_active, deleted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS supplier_address (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,

    address_type ENUM('billing', 'shipping', 'warehouse', 'office') NOT NULL,
    address_line1 VARCHAR(225) NOT NULL,
    address_line VARCHAR(225),

    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,

    phone_dial_code VARCHAR(5),
    phone_number VARCHAR(20),

    is_primary TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_supplier_address_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers (supplier_id)
        ON DELETE CASCADE,

    INDEX idx_supplier_address_supplier_id (supplier_id)
) ENGINE=InnoDB;
`;

export default INIT_DB_SCHEMA;
