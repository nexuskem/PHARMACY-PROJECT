/**
 * MediCare Pharmacy - Product Display & Filtering
 * Handles product listing, filtering, and search functionality
 */

// Global state
let allProducts = [];
let currentCategory = 'All';

/**
 * Fetch products from API
 */
async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products');
    const data = await response.json();

    if (data.success) {
      allProducts = data.products;
      renderProducts(allProducts);
      renderCategoryFilters();
    } else {
      showToast(data.message || 'Failed to load products', 'error');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    showToast('Failed to connect to server. Is the backend running?', 'error');
  }
}

/**
 * Render product grid on home page
 * @param {Array} products - Products to display
 */
function renderProducts(products) {
  const container = document.getElementById('products-grid');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-cart" style="grid-column: 1 / -1;">
        <div class="empty-cart-icon">🔍</div>
        <h3>No products found</h3>
        <p class="text-muted">Try adjusting your search or filter</p>
      </div>
    `;
    return;
  }

  const currentUser = Auth.getCurrentUser();
  const isDoctor = currentUser && currentUser.role === 'pharmacist';

  container.innerHTML = products.map(product => `
    <article class="product-card fade-in" data-id="${product.id}">
      <div class="product-image">
        <img src="${product.image || 'images/products/placeholder.png'}" alt="${product.name}" loading="lazy" onerror="this.src='images/products/placeholder.png'">
        <span class="product-badge ${product.requiresApproval ? 'badge-prescription' : 'badge-otc'}">
          ${product.requiresApproval ? 'Prescription' : 'OTC'}
        </span>
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-price">${typeof formatPrice === 'function' ? formatPrice(product.price) : `$${product.price}`}</div>
        
        ${isDoctor ? `
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline btn-block" onclick="editProduct(${product.id})" style="flex: 1; border-color: var(--primary); color: var(--primary);">Edit</button>
            <button class="btn btn-outline btn-block" onclick="deleteProduct(${product.id})" style="flex: 1; border-color: var(--danger); color: var(--danger);">Delete</button>
          </div>
        ` : (product.requiresApproval ? `
          <div class="product-warning">
            <span class="product-warning-icon">⚠️</span>
            <span>This medication requires pharmacist approval before purchase.</span>
          </div>
          <button class="btn btn-request btn-block" onclick="addToCart(${product.id})">
            Request Approval
          </button>
        ` : `
          <button class="btn btn-success btn-block" onclick="addToCart(${product.id})">
            Add to Cart
          </button>
        `)}
      </div>
    </article>
  `).join('');
}

/**
 * Filter products by category
 * @param {string} category - Category name or 'All'
 */
function filterByCategory(category) {
  currentCategory = category;

  // Update active state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.trim() === category) {
      btn.classList.add('active');
    }
  });

  if (category === 'All') {
    renderProducts(allProducts);
  } else {
    const filtered = allProducts.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

/**
 * Search products by name or description
 * @param {string} query - Search query
 */
function searchProducts(query) {
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    filterByCategory(currentCategory); // Restore current category view
    return;
  }

  const filtered = allProducts.filter(product =>
    (product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)) &&
    (currentCategory === 'All' || product.category === currentCategory)
  );

  renderProducts(filtered);
}

/**
 * Add product to cart
 * @param {number} productId - Product ID
 */
function addToCart(productId) {
  if (!Auth.isLoggedIn()) {
    showToast('Please login to add items to cart', 'info');
    setTimeout(() => {
      window.location.href = 'patient-login.html';
    }, 1500);
    return;
  }

  const product = allProducts.find(p => p.id === productId);
  if (product) {
    if (window.Cart) {
      window.Cart.addItem(product);
      // Success message is handled in Cart.addItem
    } else {
      console.error('Cart module not loaded');
    }
  }
}

/**
 * Render category filter buttons
 */
function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  if (!container) return;

  // Get unique categories with products
  const usedCategories = [...new Set(allProducts.map(p => p.category))];
  const categories = ['All', ...usedCategories.sort()];

  container.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === 'All' ? 'active' : ''}" onclick="filterByCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

/**
 * Initialize product page
 */
function initProductPage() {
  // Initial fetch
  fetchProducts();

  // Setup search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchProducts(e.target.value);
      }, 300);
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-grid')) {
    initProductPage();
  }
});

// Helper: Delete Product
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to remove this product?')) return;

  const token = Auth.getToken();
  if (!token) return;

  try {
    const response = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
      showToast('Product removed', 'success');
      fetchProducts(); // Refresh list
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    showToast('Network error', 'error');
  }
}

// Helper: Edit Product (Simple Prompt Implementation for MVP)
async function editProduct(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  // For a proper UI, we would use a modal. Using prompts for simplicity as requested.
  const newPrice = prompt(`Enter new price for ${product.name}:`, product.price);
  if (newPrice === null) return;

  const newStock = prompt(`Enter new stock level for ${product.name}:`, product.stock || 0);
  if (newStock === null) return;

  const token = Auth.getToken();
  if (!token) return;

  try {
    const response = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        price: parseFloat(newPrice),
        stock: parseInt(newStock)
      })
    });
    const data = await response.json();

    if (data.success) {
      showToast('Product updated', 'success');
      fetchProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showToast('Network error', 'error');
  }
}

// Expose to window
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
