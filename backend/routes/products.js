const db = require('../config/database');
const { sendJSON } = require('../utils/request');
const { authenticateToken, requirePharmacist } = require('../middleware/auth');

// Get all products
async function getAll(req, res) {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY name ASC';

    const pool = db.getDb();
    const [products] = await pool.query(query, params);

    // Convert requiresApproval from integer to boolean
    const formattedProducts = products.map(p => ({
      ...p,
      requiresApproval: p.requiresApproval === 1
    }));

    sendJSON(res, 200, { success: true, products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching products'
    });
  }
}

// Get single product
async function getOne(req, res) {
  try {
    const { id } = req.params;
    const pool = db.getDb();

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (products.length === 0) {
      return sendJSON(res, 404, {
        success: false,
        message: 'Product not found'
      });
    }

    const product = products[0];
    sendJSON(res, 200, {
      success: true,
      product: {
        ...product,
        requiresApproval: product.requiresApproval === 1
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching product'
    });
  }
}

// Get categories
async function getCategories(req, res) {
  try {
    const pool = db.getDb();
    const [rows] = await pool.query('SELECT DISTINCT category FROM products ORDER BY category ASC');

    const categories = rows.map(row => row.category);
    sendJSON(res, 200, { success: true, categories: ['All', ...categories] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'Error fetching categories'
    });
  }
}

// Create product
async function create(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;
  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { name, description, category, price, stock, image, requiresApproval } = req.body;

    if (!name || !price) {
      return sendJSON(res, 400, { success: false, message: 'Name and Price are required' });
    }

    const pool = db.getDb();
    const [result] = await pool.query(
      'INSERT INTO products (name, description, category, price, stock, image, requiresApproval) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description || '', category || 'General', price, stock || 0, image || '', requiresApproval ? 1 : 0]
    );

    sendJSON(res, 201, {
      success: true,
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Error creating product:', error);
    sendJSON(res, 500, { success: false, message: 'Error creating product' });
  }
}

// Update product
async function update(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;
  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { id } = req.params;
    const { name, description, category, price, stock, image, requiresApproval } = req.body;
    const pool = db.getDb();

    // Check if product exists
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return sendJSON(res, 404, { success: false, message: 'Product not found' });
    }

    // Dynamic update
    // For simplicity, we'll just update fields that are provided, or keep existing
    const current = existing[0];

    await pool.query(
      `UPDATE products SET 
       name = ?, description = ?, category = ?, price = ?, stock = ?, image = ?, requiresApproval = ?
       WHERE id = ?`,
      [
        name || current.name,
        description !== undefined ? description : current.description,
        category || current.category,
        price || current.price,
        stock !== undefined ? stock : current.stock,
        image !== undefined ? image : current.image,
        requiresApproval !== undefined ? (requiresApproval ? 1 : 0) : current.requiresApproval,
        id
      ]
    );

    sendJSON(res, 200, { success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    sendJSON(res, 500, { success: false, message: 'Error updating product' });
  }
}

// Remove product
async function remove(req, res) {
  const authResult = await authenticateToken(req, res);
  if (!authResult) return;
  const pharmacistResult = requirePharmacist(req, res);
  if (!pharmacistResult) return;

  try {
    const { id } = req.params;
    const pool = db.getDb();

    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return sendJSON(res, 404, { success: false, message: 'Product not found' });
    }

    sendJSON(res, 200, { success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    sendJSON(res, 500, { success: false, message: 'Error deleting product' });
  }
}

module.exports = {
  getAll,
  getOne,
  getCategories,
  create,
  update,
  remove
};
