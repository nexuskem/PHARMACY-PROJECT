const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medicare_pharmacy'
};

const products = [
    { name: "Amoxicillin 500mg", description: "Broad-spectrum antibiotic for bacterial infections. Requires prescription.", price: 24.99, category: "Antibiotics", image: "images/products/antibiotic.png", requiresApproval: 1, stock: 50 },
    { name: "Metformin 850mg", description: "Oral diabetes medication for type 2 diabetes management.", price: 18.50, category: "Diabetes", image: "images/products/antibiotic.png", requiresApproval: 1, stock: 100 },
    { name: "Lisinopril 10mg", description: "ACE inhibitor for high blood pressure and heart failure treatment.", price: 22.00, category: "Cardiovascular", image: "images/products/pain-relief.png", requiresApproval: 1, stock: 75 },
    { name: "Omeprazole 20mg", description: "Proton pump inhibitor for acid reflux and stomach ulcers.", price: 15.99, category: "Gastrointestinal", image: "images/products/antibiotic.png", requiresApproval: 1, stock: 120 },
    { name: "Atorvastatin 40mg", description: "Statin medication for lowering cholesterol levels.", price: 28.50, category: "Cardiovascular", image: "images/products/pain-relief.png", requiresApproval: 1, stock: 80 },
    { name: "Sertraline 50mg", description: "SSRI antidepressant for depression and anxiety disorders.", price: 32.00, category: "Mental Health", image: "images/products/supplement.png", requiresApproval: 1, stock: 60 },
    { name: "Azithromycin 250mg", description: "Macrolide antibiotic for respiratory and skin infections.", price: 35.99, category: "Antibiotics", image: "images/products/antibiotic.png", requiresApproval: 1, stock: 45 },
    { name: "Levothyroxine 100mcg", description: "Thyroid hormone replacement for hypothyroidism.", price: 12.50, category: "Hormones", image: "images/products/pain-relief.png", requiresApproval: 1, stock: 90 },
    { name: "Pregnancy Test Kit", description: "Early detection home pregnancy test. 99% accuracy. Results in 3 minutes.", price: 8.99, category: "Diagnostics", image: "images/products/device.png", requiresApproval: 0, stock: 200 },
    { name: "HIV Self-Test Kit", description: "Confidential at-home HIV screening. FDA approved with 99.9% accuracy.", price: 29.99, category: "Diagnostics", image: "images/products/first-aid.png", requiresApproval: 0, stock: 150 },
    { name: "Condoms (12 Pack)", description: "Latex condoms with reservoir tip. Lubricated for comfort.", price: 12.99, category: "Sexual Health", image: "images/products/first-aid.png", requiresApproval: 0, stock: 300 },
    { name: "Vitamin D3 1000IU", description: "Daily vitamin D supplement for bone health and immunity. 60 tablets.", price: 14.50, category: "Vitamins", image: "images/products/supplement.png", requiresApproval: 0, stock: 180 },
    { name: "Multivitamin Complex", description: "Complete daily multivitamin with minerals. 90 tablets.", price: 19.99, category: "Vitamins", image: "images/products/supplement.png", requiresApproval: 0, stock: 220 },
    { name: "Paracetamol 500mg", description: "Pain reliever and fever reducer. Pack of 20 tablets.", price: 5.99, category: "Pain Relief", image: "images/products/pain-relief.png", requiresApproval: 0, stock: 500 },
    { name: "Ibuprofen 400mg", description: "Anti-inflammatory pain relief. Pack of 24 tablets.", price: 7.49, category: "Pain Relief", image: "images/products/pain-relief.png", requiresApproval: 0, stock: 400 },
    { name: "Vitamin C 1000mg", description: "High-potency vitamin C for immune support. 30 effervescent tablets.", price: 11.99, category: "Vitamins", image: "images/products/supplement.png", requiresApproval: 0, stock: 250 },
    { name: "Antihistamine Tablets", description: "Non-drowsy allergy relief. 30 tablets.", price: 9.99, category: "Allergy", image: "images/products/antibiotic.png", requiresApproval: 0, stock: 180 },
    { name: "First Aid Kit", description: "Complete 100-piece emergency first aid kit for home use.", price: 24.99, category: "First Aid", image: "images/products/first-aid.png", requiresApproval: 0, stock: 100 },
    { name: "Digital Thermometer", description: "Fast and accurate digital thermometer with fever alert.", price: 15.99, category: "Devices", image: "images/products/device.png", requiresApproval: 0, stock: 120 },
    { name: "Blood Pressure Monitor", description: "Automatic upper arm blood pressure monitor with memory function.", price: 45.99, category: "Devices", image: "images/products/device.png", requiresApproval: 0, stock: 60 }
];

async function resetProducts() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        console.log('Dropping products table...');
        await connection.query('DROP TABLE IF EXISTS order_items'); // Drop dependent table first
        await connection.query('DROP TABLE IF EXISTS cart_items'); // Drop dependent table first
        await connection.query('DROP TABLE IF EXISTS products');

        console.log('Recreating products table...');
        await connection.query(`
      CREATE TABLE products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image VARCHAR(255),
        requiresApproval TINYINT(1) DEFAULT 0,
        stock INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Recreate dependent tables
        await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id)
      )
    `);

        await connection.query(`
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


        console.log('Seeding products...');
        const query = `INSERT INTO products (name, description, price, category, image, requiresApproval, stock) VALUES ?`;
        const values = products.map(p => [
            p.name,
            p.description,
            p.price,
            p.category,
            p.image,
            p.requiresApproval,
            p.stock
        ]);

        await connection.query(query, [values]);
        console.log('✅ Products reset and seeded successfully');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

resetProducts();
