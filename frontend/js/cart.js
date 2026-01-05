/**
 * MediCare Pharmacy - Shopping Cart Management
 * Handles cart operations, persistence, and UI updates
 */

const Cart = {
  STORAGE_KEY: 'medicare_cart',

  /**
   * Get current cart from local storage
   * @returns {Array} Cart items
   */
  getCart() {
    try {
      const cart = localStorage.getItem(this.STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  },

  /**
   * Save cart to local storage
   * @param {Array} cart - Cart items
   */
  saveCart(cart) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    this.updateCartCount();
  },

  /**
   * Add item to cart
   * @param {Object} product - Product to add
   */
  addItem(product) {
    const cart = this.getCart();
    const existingItem = cart.find(item => item.id === product.id);

    // Check if product requires approval
    const currentUser = Auth.getCurrentUser();
    const isDoctor = currentUser && currentUser.role === 'pharmacist';

    // If user is doctor/pharmacist, they don't need approval
    if (product.requiresApproval && !isDoctor) {
      showToast('Request for product approval sent!', 'info');
      // For now, we transact approval requests as adding to cart with a flag
      // In a real app, this might go to a different "Requests" list
    } else {
      showToast('Item added to cart successfully!', 'success');
    }

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        requiresApproval: isDoctor ? false : (product.requiresApproval || false),
        quantity: 1
      });
    }

    this.saveCart(cart);
  },

  /**
   * Remove item from cart
   * @param {number|string} productId - Product ID to remove
   */
  removeItem(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.id !== productId);
    this.saveCart(cart);

    // specialized logic if we are on the cart page
    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }
  },

  /**
   * Update item quantity
   * @param {number|string} productId - Product ID
   * @param {number} quantity - New quantity
   */
  updateQuantity(productId, quantity) {
    if (quantity < 1) return;

    const cart = this.getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
      item.quantity = quantity;
      this.saveCart(cart);

      if (typeof renderCartPage === 'function') {
        renderCartPage();
      }
    }
  },

  /**
   * Clear entire cart
   */
  clearCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateCartCount();

    if (typeof renderCartPage === 'function') {
      renderCartPage();
    }
  },

  /**
   * Update cart count badge in header
   */
  updateCartCount() {
    const cart = this.getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);

    document.querySelectorAll('.cart-count').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// Expose Cart globally
window.Cart = Cart;

/**
 * Render Cart Page
 * Called by cart.html
 */
function renderCartPage() {
  const container = document.getElementById('cart-items');
  const summaryContainer = document.getElementById('cart-summary');

  if (!container || !summaryContainer) return;

  const cart = Cart.getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p class="text-muted">Browse our products to find what you need.</p>
        <a href="index.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    summaryContainer.innerHTML = '';
    return;
  }

  // Render Items
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <div class="cart-item-details">
        <h3 class="cart-item-title">
          ${item.name}
          ${item.requiresApproval ? '<span class="badge badge-warning">Approval Required</span>' : ''}
        </h3>
        <div class="cart-item-price">${typeof formatPrice === 'function' ? formatPrice(item.price) : item.price}</div>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-controls">
          <button class="qty-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
        </div>
        <button class="btn-remove" onclick="Cart.removeItem(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');

  // Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16; // 16% VAT example
  const total = subtotal + tax;

  // Render Summary
  summaryContainer.innerHTML = `
    <div class="summary-card">
      <h3 class="summary-title">Order Summary</h3>
      
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${typeof formatPrice === 'function' ? formatPrice(subtotal) : subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Tax (16%)</span>
        <span>${typeof formatPrice === 'function' ? formatPrice(tax) : tax.toFixed(2)}</span>
      </div>
      <div class="summary-total">
        <span>Total</span>
        <span>${typeof formatPrice === 'function' ? formatPrice(total) : total.toFixed(2)}</span>
      </div>
      
      <button class="btn btn-primary btn-block" onclick="checkout()">
        Proceed to Checkout
      </button>
    </div>
  `;
}

/**
 * Handle checkout process
 */
// function checkout() {
//   const cart = Cart.getCart();
//   if (cart.length === 0) return;

//   const hasRestrictedItems = cart.some(item => item.requiresApproval);

//   if (hasRestrictedItems) {
//     showToast('Your order contains items requiring approval. A pharmacist will review your request.', 'info');
//   } else {
//     showToast('Proceeding to payment...', 'success');
//   }

//   // Here we would typically redirect to a checkout page
//   // window.location.href = 'checkout.html';
// }

function checkout() {
  const cart = Cart.getCart();
  if (cart.length === 0) return;

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.16; // Inc Tax
  const hasRestrictedItems = cart.some(item => item.requiresApproval);

  // Simple modal implementation using standard interaction since we don't have a UI library
  const paymentMethod = confirm('Do you want to pay with M-Pesa now? Click Cancel for ' + (hasRestrictedItems ? 'Approval Request only' : 'Pay Later'));

  let phoneNumber = null;
  if (paymentMethod) {
    phoneNumber = prompt("Enter your M-Pesa phone number (e.g., 254712345678):");
    if (!phoneNumber) {
      showToast('Payment cancelled. Order will be created without immediate payment.', 'info');
    }
  }

  createOrder(phoneNumber);
}

async function createOrder(phoneNumber) {
  const token = Auth.getToken();
  if (!token) {
    window.location.href = 'patient-login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber
      })
    });

    const data = await response.json();

    if (data.success) {
      if (phoneNumber && data.message.includes('STK Push')) {
        showToast(data.message, 'success'); // STK Push sent
        alert(data.message); // Ensure user sees it
      } else {
        showToast('Order placed successfully!', 'success');
      }

      Cart.clearCart();

      // Redirect to orders or dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    } else {
      showToast(data.message || 'Failed to place order', 'error');
    }
  } catch (error) {
    console.error('Checkout Error:', error);
    showToast('Network error during checkout', 'error');
  }
}

// Initialize cart count on load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateCartCount();
});
