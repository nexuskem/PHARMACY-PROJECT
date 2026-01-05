const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { sendJSON } = require('../utils/request');
const { stkPush } = require('../utils/mpesa');

// Create order from cart
async function create(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    console.log('Order Create Request Body:', req.body);
    const { phoneNumber } = req.body; // Expect phone number
    const pool = db.getDb();

    // Get cart items
    const [cartItems] = await pool.query(
      `SELECT 
        ci.id,
        ci.quantity,
        p.id as product_id,
        p.name,
        p.price,
        p.requiresApproval,
        p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.patient_id = ?`,
      [userId]
    );

    // ... (intermediate logic unchanged)

    // Create order
    const [orderResult] = await pool.query(
      `INSERT INTO orders (patient_id, order_number, total, requiresApproval, status, payment_status, checkout_request_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, orderNumber, total, requiresApproval, orderStatus, paymentStatus, checkoutRequestId]
    );

    // ...

    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE patient_id = ?', [userId]);

    // ...

    sendJSON(res, 201, {
      success: true,
      message: paymentMessage || 'Order created successfully. Please arrange payment.',
      order: {
        id: orderId,
        orderNumber,
        total,
        status: orderStatus,
        paymentStatus,
        requiresApproval: requiresApproval === 1
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error creating order'
    });
  }
}

// Get user orders
async function getAll(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const pool = db.getDb();

    const [orders] = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.total,
        o.status,
        o.requiresApproval,
        o.createdAt,
        GROUP_CONCAT(p.name SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.patient_id = ?
      GROUP BY o.id
      ORDER BY o.createdAt DESC`,
      [userId]
    );

    const formattedOrders = orders.map(order => ({
      id: order.order_number,
      orderNumber: order.order_number,
      date: order.createdAt.toISOString().split('T')[0],
      items: order.items ? order.items.split(', ') : [],
      total: parseFloat(order.total),
      status: order.status,
      requiresApproval: order.requiresApproval === 1,
      createdAt: order.createdAt
    }));

    sendJSON(res, 200, { success: true, orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching orders'
    });
  }
}

// Get single order with details
async function getOne(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const pool = db.getDb();

    // Get order
    const [orders] = await pool.query(
      `SELECT * FROM orders 
       WHERE (id = ? OR order_number = ?) AND patient_id = ?`,
      [id, id, userId]
    );

    if (orders.length === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.query(
      `SELECT 
        oi.quantity,
        oi.price,
        p.id,
        p.name,
        p.description,
        p.category,
        p.icon
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [order.id]
    );

    sendJSON(res, 200, {
      success: true,
      order: {
        id: order.order_number,
        orderNumber: order.order_number,
        total: parseFloat(order.total),
        status: order.status,
        requiresApproval: order.requiresApproval === 1,
        createdAt: order.createdAt,
        items: items.map(item => ({
          ...item,
          price: parseFloat(item.price)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching order'
    });
  }
}

module.exports = {
  create,
  getAll,
  getOne
};
