const jwt = require('jsonwebtoken');
const { sendJSON } = require('../utils/request');

const authenticateToken = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    sendJSON(res, 401, { success: false, message: 'Access token required' });
    return false;
  }

  try {
    const user = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    );
    req.user = user;
    return true;
  } catch (err) {
    sendJSON(res, 403, { success: false, message: 'Invalid or expired token' });
    return false;
  }
};

const requirePharmacist = (req, res) => {
  if (!req.user || (req.user.role !== 'pharmacist' && req.user.role !== 'doctor')) {
    sendJSON(res, 403, { success: false, message: 'Pharmacist/Doctor access required' });
    return false;
  }
  return true;
};

module.exports = {
  authenticateToken,
  requirePharmacist
};
