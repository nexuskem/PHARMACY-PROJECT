/**
 * Utility script to create a pharmacist account
 * Usage: node scripts/create-pharmacist.js <email> <password> <firstName> <lastName>
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Usage: node scripts/create-pharmacist.js <email> <password> <firstName> <lastName>');
  process.exit(1);
}

const [email, password, firstName, lastName] = args;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medicare_pharmacy'
};

(async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Check if user exists
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      console.log('User already exists. Updating to pharmacist role...');
      await connection.query('UPDATE users SET role = ? WHERE email = ?', ['pharmacist', email]);
      console.log('✅ User role updated to pharmacist');
    } else {
      // Create new pharmacist
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await connection.query(
        'INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName, 'pharmacist']
      );

      console.log('✅ Pharmacist account created successfully!');
      console.log(`   ID: ${result.insertId}`);
      console.log(`   Email: ${email}`);
      console.log(`   Name: ${firstName} ${lastName}`);
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
