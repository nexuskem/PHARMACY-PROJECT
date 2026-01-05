const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medicare_pharmacy'
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        console.log('Adding assigned_doctor_id column...');
        try {
            await connection.query(`
        ALTER TABLE users 
        ADD COLUMN assigned_doctor_id INT NULL,
        ADD CONSTRAINT fk_assigned_doctor 
        FOREIGN KEY (assigned_doctor_id) REFERENCES users(id) ON DELETE SET NULL
      `);
            console.log('✅ Migration successful');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Column already exists, skipping.');
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
