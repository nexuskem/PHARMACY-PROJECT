const http = require('http');
const url = require('url');
const Router = require('./utils/router');
const { parseBody, parseQuery, sendJSON, corsHandler } = require('./utils/request');

// Import route handlers
const authHandlers = require('./routes/auth');
const productHandlers = require('./routes/products');
const cartHandlers = require('./routes/cart');
const orderHandlers = require('./routes/orders');
const appointmentHandlers = require('./routes/appointments');
const pharmacistHandlers = require('./routes/pharmacist');
const notificationHandlers = require('./routes/notifications');

// Initialize database
const db = require('./config/database');
db.init();

const PORT = process.env.PORT || 3000;

// Create router
const router = new Router();

// CORS middleware
router.use(async (req, res) => {
  return corsHandler(req, res);
});

// Request parsing middleware
router.use(async (req, res) => {
  req.query = parseQuery(req.url);
  if (req.method === 'POST' || req.method === 'PUT') {
    req.body = await parseBody(req);
  } else {
    req.body = {};
  }
  return true;
});

// Register routes
router.get('/api/health', (req, res) => {
  sendJSON(res, 200, { status: 'ok', message: 'MediCare Pharmacy API is running' });
});

// Auth routes
router.post('/api/auth/register/patient', authHandlers.registerPatient);
router.post('/api/auth/register/pharmacist', authHandlers.registerPharmacist);
router.post('/api/auth/login', authHandlers.login);
router.get('/api/auth/me', authHandlers.getMe);
router.post('/api/auth/forgot-password', authHandlers.forgotPassword);
router.post('/api/auth/reset-password', authHandlers.resetPassword);

// Product routes
// Product routes
router.get('/api/products', productHandlers.getAll);
router.get('/api/products/categories/list', productHandlers.getCategories);
router.get('/api/products/:id', productHandlers.getOne);
router.post('/api/products', productHandlers.create);
router.put('/api/products/:id', productHandlers.update);
router.delete('/api/products/:id', productHandlers.remove);

// Cart routes
router.get('/api/cart', cartHandlers.getCart);
router.post('/api/cart/add', cartHandlers.addItem);
router.put('/api/cart/update/:id', cartHandlers.updateItem);
router.delete('/api/cart/remove/:id', cartHandlers.removeItem);
router.delete('/api/cart/clear', cartHandlers.clearCart);

// Order routes
router.post('/api/orders/create', orderHandlers.create);
router.get('/api/orders', orderHandlers.getAll);
router.get('/api/orders/:id', orderHandlers.getOne);

// Appointment routes
router.post('/api/appointments/book', appointmentHandlers.book);
router.get('/api/appointments', appointmentHandlers.getAll);
router.get('/api/appointments/:id', appointmentHandlers.getOne);
router.put('/api/appointments/:id/cancel', appointmentHandlers.cancel);

// Pharmacist/Doctor routes
router.get('/api/pharmacist/orders/pending', pharmacistHandlers.getPendingOrders);
router.get('/api/pharmacist/orders/:id', pharmacistHandlers.getOrder);
router.put('/api/pharmacist/orders/:id/approve', pharmacistHandlers.approveOrder);
router.put('/api/pharmacist/orders/:id/reject', pharmacistHandlers.rejectOrder);
router.get('/api/pharmacist/appointments', pharmacistHandlers.getAppointments);
router.post('/api/pharmacist/book-appointment', pharmacistHandlers.bookAppointment);
router.put('/api/pharmacist/appointments/:id/approve', pharmacistHandlers.approveAppointment);
router.put('/api/pharmacist/appointments/:id/reject', pharmacistHandlers.rejectAppointment);

// M-Pesa routes
const mpesaHandlers = require('./routes/mpesa');
router.post('/api/mpesa/callback', mpesaHandlers.handleCallback);

// Notifications
router.get('/api/notifications', notificationHandlers.getNotifications);
router.put('/api/notifications/read', notificationHandlers.markRead);
router.delete('/api/notifications/:id', notificationHandlers.deleteNotification);

// Create server
const server = http.createServer(async (req, res) => {
  try {
    await router.handle(req, res);
  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      sendJSON(res, 500, {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

server.listen(PORT, () => {
  console.log(`🚀 MediCare Pharmacy API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Using pure Node.js (no frameworks)`);
});
