-- ============================================
-- MediCare Pharmacy Database Schema
-- MySQL Database Setup Script
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS medicare_pharmacy;
USE medicare_pharmacy;

-- ============================================
-- Tables
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id VARCHAR(50) UNIQUE,
  pharmacist_id VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'patient',
  assigned_doctor_id INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_id CHECK (
    (role = 'patient' AND patient_id IS NOT NULL) OR
    (role = 'pharmacist' AND pharmacist_id IS NOT NULL)
  ),
  FOREIGN KEY (assigned_doctor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  requiresApproval TINYINT(1) DEFAULT 0,
  stock INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requiresApproval TINYINT(1) DEFAULT 0,
  approvedBy INT,
  approvedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requiresApproval TINYINT(1) DEFAULT 0,
  payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  mpesa_receipt VARCHAR(50),
  checkout_request_id VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  appointment_id INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Indexes for better performance
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_patient_id ON users(patient_id);
CREATE INDEX idx_users_pharmacist_id ON users(pharmacist_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(date);

-- ============================================
-- Sample Products Data
-- ============================================

INSERT INTO products (name, description, price, category, icon, requiresApproval, stock) VALUES
-- Prescription Drugs (requiresApproval: 1)
('Amoxicillin 500mg', 'Broad-spectrum antibiotic for bacterial infections. Requires prescription.', 24.99, 'Antibiotics', '💊', 1, 50),
('Metformin 850mg', 'Oral diabetes medication for type 2 diabetes management.', 18.50, 'Diabetes', '💊', 1, 100),
('Lisinopril 10mg', 'ACE inhibitor for high blood pressure and heart failure treatment.', 22.00, 'Cardiovascular', '❤️', 1, 75),
('Omeprazole 20mg', 'Proton pump inhibitor for acid reflux and stomach ulcers.', 15.99, 'Gastrointestinal', '💊', 1, 120),
('Atorvastatin 40mg', 'Statin medication for lowering cholesterol levels.', 28.50, 'Cardiovascular', '💊', 1, 80),
('Sertraline 50mg', 'SSRI antidepressant for depression and anxiety disorders.', 32.00, 'Mental Health', '🧠', 1, 60),
('Azithromycin 250mg', 'Macrolide antibiotic for respiratory and skin infections.', 35.99, 'Antibiotics', '💊', 1, 45),
('Levothyroxine 100mcg', 'Thyroid hormone replacement for hypothyroidism.', 12.50, 'Hormones', '💊', 1, 90),

-- Over-the-Counter Products (requiresApproval: 0)
('Pregnancy Test Kit', 'Early detection home pregnancy test. 99% accuracy. Results in 3 minutes.', 8.99, 'Diagnostics', '🤰', 0, 200),
('HIV Self-Test Kit', 'Confidential at-home HIV screening. FDA approved with 99.9% accuracy.', 29.99, 'Diagnostics', '🔬', 0, 150),
('Condoms (12 Pack)', 'Latex condoms with reservoir tip. Lubricated for comfort.', 12.99, 'Sexual Health', '🛡️', 0, 300),
('Vitamin D3 1000IU', 'Daily vitamin D supplement for bone health and immunity. 60 tablets.', 14.50, 'Vitamins', '☀️', 0, 180),
('Multivitamin Complex', 'Complete daily multivitamin with minerals. 90 tablets.', 19.99, 'Vitamins', '💊', 0, 220),
('Paracetamol 500mg', 'Pain reliever and fever reducer. Pack of 20 tablets.', 5.99, 'Pain Relief', '💊', 0, 500),
('Ibuprofen 400mg', 'Anti-inflammatory pain relief. Pack of 24 tablets.', 7.49, 'Pain Relief', '💊', 0, 400),
('Vitamin C 1000mg', 'High-potency vitamin C for immune support. 30 effervescent tablets.', 11.99, 'Vitamins', '🍊', 0, 250),
('Antihistamine Tablets', 'Non-drowsy allergy relief. 30 tablets.', 9.99, 'Allergy', '🌸', 0, 180),
('First Aid Kit', 'Complete 100-piece emergency first aid kit for home use.', 24.99, 'First Aid', '🩹', 0, 100),
('Digital Thermometer', 'Fast and accurate digital thermometer with fever alert.', 15.99, 'Devices', '🌡️', 0, 120),
('Blood Pressure Monitor', 'Automatic upper arm blood pressure monitor with memory function.', 45.99, 'Devices', '💓', 0, 60);

-- ============================================
-- Notes
-- ============================================
-- 
-- Database: medicare_pharmacy
-- 
-- Tables:
-- - users: Stores user accounts (customers and pharmacists)
-- - products: Stores pharmacy products (prescription and OTC)
-- - cart_items: Stores items in user shopping carts
-- - orders: Stores order information
-- - order_items: Stores individual items within orders
-- - appointments: Stores pharmacist appointment bookings
--
-- User Roles:
-- - 'customer': Regular customer (default)
-- - 'pharmacist': Pharmacist with approval privileges
--
-- Order Status:
-- - 'pending': Order awaiting approval
-- - 'approved': Order approved by pharmacist
-- - 'rejected': Order rejected by pharmacist
-- - 'completed': Order completed
--
-- Appointment Status:
-- - 'scheduled': Appointment is scheduled
-- - 'cancelled': Appointment was cancelled
-- - 'completed': Appointment completed
--
-- To create a pharmacist account, update a user's role:
-- UPDATE users SET role = 'pharmacist' WHERE email = 'pharmacist@example.com';
--
-- ============================================
