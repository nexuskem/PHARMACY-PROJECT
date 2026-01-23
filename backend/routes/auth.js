const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendJSON } = require('../utils/request');

// Register Patient
// Register Patient
async function registerPatient(req, res) {
  try {
    const { firstName, lastName, patientId, password, phone, email } = req.body;

    // Validation
    if (!firstName || !lastName || !patientId || !password) {
      return sendJSON(res, 400, { success: false, message: 'Please fill in all required fields' });
    }

    const pool = db.getDb();

    // Check if patient ID already exists
    const [existing] = await pool.query('SELECT id FROM patients WHERE patient_id = ?', [patientId]);
    if (existing.length > 0) {
      return sendJSON(res, 400, { success: false, message: 'Patient ID already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-Assign Doctor (Load Balancing)
    let assignedDoctorId = null;
    try {
      const [doctors] = await pool.query(`
        SELECT d.id, COUNT(p.id) as patient_count 
        FROM doctors d 
        LEFT JOIN patients p ON d.id = p.assigned_doctor_id 
        GROUP BY d.id 
        ORDER BY patient_count ASC, d.createdAt ASC 
        LIMIT 1
      `);
      if (doctors.length > 0) {
        assignedDoctorId = doctors[0].id;
      }
    } catch (err) {
      console.error('Error assigning doctor:', err);
    }

    // Create Patient
    const [result] = await pool.query(
      'INSERT INTO patients (patient_id, password, firstName, lastName, phone, email, assigned_doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patientId, hashedPassword, firstName, lastName, phone || null, email || null, assignedDoctorId]
    );

    const userId = result.insertId;
    const token = jwt.sign(
      { id: userId, patientId, role: 'patient' },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    sendJSON(res, 201, {
      success: true,
      message: 'Patient registration successful',
      user: { id: userId, patientId, firstName, lastName, role: 'patient' },
      token
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    sendJSON(res, 500, { success: false, message: 'Registration failed' });
  }
}

// Register Pharmacist/Doctor
async function registerPharmacist(req, res) {
  try {
    const { firstName, lastName, pharmacistId, password, phone, email } = req.body;

    if (!firstName || !lastName || !pharmacistId || !password) {
      return sendJSON(res, 400, { success: false, message: 'Please fill in all required fields' });
    }

    const pool = db.getDb();
    const [existing] = await pool.query('SELECT id FROM doctors WHERE pharmacist_id = ?', [pharmacistId]);

    if (existing.length > 0) {
      return sendJSON(res, 400, { success: false, message: 'Pharmacist ID already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO doctors (pharmacist_id, password, firstName, lastName, phone, email, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [pharmacistId, hashedPassword, firstName, lastName, phone || null, email || null, 'pharmacist']
    );

    const userId = result.insertId;
    const token = jwt.sign(
      { id: userId, pharmacistId, role: 'pharmacist' },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    sendJSON(res, 201, {
      success: true,
      message: 'Pharmacist registration successful',
      user: { id: userId, pharmacistId, firstName, lastName, role: 'pharmacist' },
      token
    });
  } catch (error) {
    console.error('Pharmacist registration error:', error);
    sendJSON(res, 500, { success: false, message: 'Registration failed' });
  }
}

// Login
async function login(req, res) {
  try {
    const { userId, password, role } = req.body;

    if (!userId || !password || !role) {
      return sendJSON(res, 400, { success: false, message: 'ID, Password, and Role are required' });
    }

    const pool = db.getDb();
    let query, user;

    if (role === 'patient') {
      const [patients] = await pool.query('SELECT * FROM patients WHERE patient_id = ?', [userId]);
      if (patients.length === 0) return sendJSON(res, 401, { success: false, message: 'Invalid ID or password' });
      user = patients[0];
    } else if (role === 'pharmacist' || role === 'doctor') {
      const [doctors] = await pool.query('SELECT * FROM doctors WHERE pharmacist_id = ?', [userId]);
      if (doctors.length === 0) return sendJSON(res, 401, { success: false, message: 'Invalid ID or password' });
      user = doctors[0];
    } else {
      return sendJSON(res, 400, { success: false, message: 'Invalid role' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendJSON(res, 401, { success: false, message: 'Invalid ID or password' });
    }

    const tokenPayload = { id: user.id, role: user.role };
    if (role === 'patient') tokenPayload.patientId = user.patient_id;
    if (role === 'pharmacist') tokenPayload.pharmacistId = user.pharmacist_id;

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', { expiresIn: '7d' });

    sendJSON(res, 200, {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        ...(role === 'patient' ? { patientId: user.patient_id } : { pharmacistId: user.pharmacist_id })
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    sendJSON(res, 500, { success: false, message: 'Login failed' });
  }
}

// Get Me
// Get Me
// Get Me
async function getMe(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  const pool = db.getDb();
  try {
    let user;
    let assignedDoctor = null;

    if (req.user.role === 'patient') {
      const [patients] = await pool.query(`
        SELECT p.*, d.firstName as docFirstName, d.lastName as docLastName 
        FROM patients p 
        LEFT JOIN doctors d ON p.assigned_doctor_id = d.id 
        WHERE p.id = ?`,
        [req.user.id]
      );
      user = patients[0];

      // Auto-assign if missing
      if (user && !user.assigned_doctor_id) {
        try {
          const [doctors] = await pool.query(`
            SELECT d.id, d.firstName, d.lastName, COUNT(p.id) as patient_count 
            FROM doctors d 
            LEFT JOIN patients p ON d.id = p.assigned_doctor_id 
            GROUP BY d.id 
            ORDER BY patient_count ASC, d.createdAt ASC 
            LIMIT 1
          `);

          if (doctors.length > 0) {
            const doc = doctors[0];
            await pool.query('UPDATE patients SET assigned_doctor_id = ? WHERE id = ?', [doc.id, user.id]);

            // Update local object
            user.assigned_doctor_id = doc.id;
            user.docFirstName = doc.firstName;
            user.docLastName = doc.lastName;
          }
        } catch (assignErr) {
          console.error('Error in lazy assignment:', assignErr);
        }
      }

      if (user && user.docFirstName) {
        assignedDoctor = `Dr. ${user.docFirstName} ${user.docLastName}`;
      }
    } else {
      const [doctors] = await pool.query('SELECT * FROM doctors WHERE id = ?', [req.user.id]);
      user = doctors[0];
    }

    if (!user) return sendJSON(res, 404, { success: false, message: 'User not found' });

    sendJSON(res, 200, {
      success: true,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedDoctor: assignedDoctor, // For patients
        ...(user.patient_id ? { patientId: user.patient_id } : { pharmacistId: user.pharmacist_id })
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    sendJSON(res, 500, { success: false, message: 'Error fetching user' });
  }
}

const crypto = require('crypto');
// Forgot Password
async function forgotPassword(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return sendJSON(res, 400, { success: false, message: 'User ID is required' });
    }

    const pool = db.getDb();
    let user;
    let table;
    let idColumn;

    // Check patients first
    const [patients] = await pool.query('SELECT * FROM patients WHERE patient_id = ?', [userId]);
    if (patients.length > 0) {
      user = patients[0];
      table = 'patients';
      idColumn = 'patient_id';
    } else {
      // Check doctors/pharmacists
      const [doctors] = await pool.query('SELECT * FROM doctors WHERE pharmacist_id = ?', [userId]);
      if (doctors.length > 0) {
        user = doctors[0];
        table = 'doctors';
        idColumn = 'pharmacist_id';
      }
    }

    if (!user) {
      return sendJSON(res, 404, { success: false, message: 'User not found' });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Save token to DB
    await pool.query(
      `UPDATE ${table} SET reset_token = ?, reset_token_expires = ? WHERE id = ?`,
      [token, expires, user.id]
    );

    // In a real app, send email here. For now, return link.
    const resetLink = `http://${req.headers.host}/reset-password.html?token=${token}`;
    console.log(`[SIMULATED EMAIL] Reset Link for ${userId}: ${resetLink}`);

    sendJSON(res, 200, {
      success: true,
      message: 'Password reset link generated',
      resetLink // Returning for testing purposes
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    sendJSON(res, 500, { success: false, message: 'Error generating reset link' });
  }
}

// Reset Password
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendJSON(res, 400, { success: false, message: 'Token and new password required' });
    }

    const pool = db.getDb();

    // Find user with valid token
    let user;
    let table;

    // effective way to check both tables
    const [patients] = await pool.query(
      'SELECT * FROM patients WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (patients.length > 0) {
      user = patients[0];
      table = 'patients';
    } else {
      const [doctors] = await pool.query(
        'SELECT * FROM doctors WHERE reset_token = ? AND reset_token_expires > NOW()',
        [token]
      );
      if (doctors.length > 0) {
        user = doctors[0];
        table = 'doctors';
      }
    }

    if (!user) {
      return sendJSON(res, 400, { success: false, message: 'Password reset token is invalid or has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await pool.query(
      `UPDATE ${table} SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    sendJSON(res, 200, { success: true, message: 'Password has been updated' });

  } catch (error) {
    console.error('Reset password error:', error);
    sendJSON(res, 500, { success: false, message: 'Error updating password' });
  }
}

module.exports = {
  registerPatient,
  registerPharmacist,
  login,
  forgotPassword,
  resetPassword,
  getMe
};
