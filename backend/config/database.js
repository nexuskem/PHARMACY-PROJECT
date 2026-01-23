const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medicare_pharmacy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

const init = async () => {
  try {
    // First, create database if it doesn't exist
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConnection.end();

    // Create connection pool
    pool = mysql.createPool(dbConfig);

    console.log('✅ Connected to MySQL database');

    // Create tables
    await createTables();

    // Seed products if needed
    await seedProductsIfNeeded();

    return pool;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const createTables = async () => {
  try {
    // Tables are created if they don't exist. Existing data is preserved.

    // 1. Doctors Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pharmacist_id VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'pharmacist',
        reset_token VARCHAR(255) DEFAULT NULL,
        reset_token_expires DATETIME DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Patients Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'patient',
        assigned_doctor_id INT,
        reset_token VARCHAR(255) DEFAULT NULL,
        reset_token_expires DATETIME DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
      )
    `);

    // Products table (Schema check only, assume exists or created by previous run logic if not dropped)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        icon VARCHAR(10),
        requiresApproval TINYINT(1) DEFAULT 0,
        stock INT DEFAULT 0,
        image VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cart items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_patient_product (patient_id, product_id)
      )
    `);

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id INT NOT NULL,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        requiresApproval TINYINT(1) DEFAULT 0,
        payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        mpesa_receipt VARCHAR(50),
        checkout_request_id VARCHAR(100),
        approvedBy INT,
        approvedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (approvedBy) REFERENCES doctors(id) ON DELETE SET NULL
      )
    `);

    // Order items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id INT NOT NULL,
        doctor_id INT, 
        date DATE NOT NULL,
        time TIME NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id INT, 
        doctor_id INT,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        appointment_id INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Database tables created (Fresh Schema)');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const seedProductsIfNeeded = async () => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM products');

    if (rows[0].count === 0) {
      await seedProducts();
    }
  } catch (error) {
    console.error('Error checking products:', error);
  }
};

const seedProducts = async () => {
  const products = [
    // Prescription drugs
    { name: "Amoxicillin 500mg", description: "Broad-spectrum antibiotic for bacterial infections. Requires prescription.", price: 24.99, category: "Antibiotics", icon: "💊", requiresApproval: 1, stock: 50 },
    { name: "Metformin 850mg", description: "Oral diabetes medication for type 2 diabetes management.", price: 18.50, category: "Diabetes", icon: "💊", requiresApproval: 1, stock: 100 },
    { name: "Lisinopril 10mg", description: "ACE inhibitor for high blood pressure and heart failure treatment.", price: 22.00, category: "Cardiovascular", icon: "❤️", requiresApproval: 1, stock: 75 },
    { name: "Omeprazole 20mg", description: "Proton pump inhibitor for acid reflux and stomach ulcers.", price: 15.99, category: "Gastrointestinal", icon: "💊", requiresApproval: 1, stock: 120 },
    { name: "Atorvastatin 40mg", description: "Statin medication for lowering cholesterol levels.", price: 28.50, category: "Cardiovascular", icon: "💊", requiresApproval: 1, stock: 80 },
    { name: "Sertraline 50mg", description: "SSRI antidepressant for depression and anxiety disorders.", price: 32.00, category: "Mental Health", icon: "🧠", requiresApproval: 1, stock: 60 },
    { name: "Azithromycin 250mg", description: "Macrolide antibiotic for respiratory and skin infections.", price: 35.99, category: "Antibiotics", icon: "💊", requiresApproval: 1, stock: 45 },
    { name: "Levothyroxine 100mcg", description: "Thyroid hormone replacement for hypothyroidism.", price: 12.50, category: "Hormones", icon: "💊", requiresApproval: 1, stock: 90 },
    // OTC products
    { name: "Pregnancy Test Kit", description: "Early detection home pregnancy test. 99% accuracy. Results in 3 minutes.", price: 8.99, category: "Diagnostics", icon: "🤰", requiresApproval: 0, stock: 200 },
    { name: "HIV Self-Test Kit", description: "Confidential at-home HIV screening. FDA approved with 99.9% accuracy.", price: 29.99, category: "Diagnostics", icon: "🔬", requiresApproval: 0, stock: 150 },
    { name: "Condoms (12 Pack)", description: "Latex condoms with reservoir tip. Lubricated for comfort.", price: 12.99, category: "Sexual Health", icon: "🛡️", requiresApproval: 0, stock: 300 },
    { name: "Vitamin D3 1000IU", description: "Daily vitamin D supplement for bone health and immunity. 60 tablets.", price: 14.50, category: "Vitamins", icon: "☀️", requiresApproval: 0, stock: 180 },
    { name: "Multivitamin Complex", description: "Complete daily multivitamin with minerals. 90 tablets.", price: 19.99, category: "Vitamins", icon: "💊", requiresApproval: 0, stock: 220 },
    { name: "Paracetamol 500mg", description: "Pain reliever and fever reducer. Pack of 20 tablets.", price: 5.99, category: "Pain Relief", icon: "💊", requiresApproval: 0, stock: 500 },
    { name: "Ibuprofen 400mg", description: "Anti-inflammatory pain relief. Pack of 24 tablets.", price: 7.49, category: "Pain Relief", icon: "💊", requiresApproval: 0, stock: 400 },
    { name: "Vitamin C 1000mg", description: "High-potency vitamin C for immune support. 30 effervescent tablets.", price: 11.99, category: "Vitamins", icon: "🍊", requiresApproval: 0, stock: 250 },
    { name: "Antihistamine Tablets", description: "Non-drowsy allergy relief. 30 tablets.", price: 9.99, category: "Allergy", icon: "🌸", requiresApproval: 0, stock: 180 },
    { name: "First Aid Kit", description: "Complete 100-piece emergency first aid kit for home use.", price: 24.99, category: "First Aid", icon: "🩹", requiresApproval: 0, stock: 100 },
    { name: "Digital Thermometer", description: "Fast and accurate digital thermometer with fever alert.", price: 15.99, category: "Devices", icon: "🌡️", requiresApproval: 0, stock: 120 },
    { name: "Blood Pressure Monitor", description: "Automatic upper arm blood pressure monitor with memory function.", price: 45.99, category: "Devices", icon: "💓", requiresApproval: 0, stock: 60 }
  ];

  try {
    const query = `INSERT INTO products (name, description, price, category, icon, requiresApproval, stock) VALUES ?`;
    const values = products.map(p => [
      p.name,
      p.description,
      p.price,
      p.category,
      p.icon,
      p.requiresApproval,
      p.stock
    ]);

    await pool.query(query, [values]);
    console.log('✅ Seeded initial products');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};

const getDb = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return pool;
};

const close = async () => {
  if (pool) {
    await pool.end();
    console.log('Database connection pool closed');
  }
};

module.exports = {
  init,
  getDb,
  close
};
