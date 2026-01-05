const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const { sendJSON } = require('../utils/request');

// Get cart items
async function getCart(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const pool = db.getDb();

    const [items] = await pool.query(
      `SELECT 
        ci.id,
        ci.quantity,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.category,
        p.icon,
        p.requiresApproval,
        p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.patient_id = ?`,
      [userId]
    );

    const formattedItems = items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        category: item.category,
        icon: item.icon,
        requiresApproval: item.requiresApproval === 1,
        stock: item.stock
      }
    }));

    sendJSON(res, 200, { success: true, items: formattedItems });
  } catch (error) {
    console.error('Error fetching cart:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching cart'
    });
  }
}

// Add item to cart
async function addItem(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Product ID is required'
      });
    }

    const pool = db.getDb();

    // Check if product exists and has stock
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);

    if (products.length === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Product not found'
      });
    }

    const product = products[0];

    if (product.stock < quantity) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Check if item already in cart
    const [existingItems] = await pool.query(
      'SELECT * FROM cart_items WHERE patient_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return sendJSON(res, 400, {
          success: false,
          message: 'Insufficient stock'
        });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItem.id]
      );

      sendJSON(res, 200, {
        success: true,
        message: 'Cart updated successfully'
      });
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart_items (patient_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );

      sendJSON(res, 200, {
        success: true,
        message: 'Item added to cart'
      });
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error updating cart'
    });
  }
}

// Update cart item quantity
async function updateItem(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const pool = db.getDb();

    // Check if item belongs to user and get product stock
    const [items] = await pool.query(
      `SELECT ci.*, p.stock 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND ci.patient_id = ?`,
      [id, userId]
    );

    if (items.length === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Cart item not found'
      });
    }

    const item = items[0];

    if (quantity > item.stock) {
      return sendJSON(res, 400, {
        success: false,
        message: 'Insufficient stock'
      });
    }

    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    sendJSON(res, 200, {
      success: true,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error updating cart'
    });
  }
}

// Remove item from cart
async function removeItem(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const { id } = req.params;
    const pool = db.getDb();

    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND patient_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Cart item not found'
      });
    }

    sendJSON(res, 200, {
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing item:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error removing item'
    });
  }
}

// Clear cart
async function clearCart(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;

  try {
    const userId = req.user.id;
    const pool = db.getDb();

    await pool.query('DELETE FROM cart_items WHERE patient_id = ?', [userId]);

    sendJSON(res, 200, {
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error clearing cart'
    });
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
};
