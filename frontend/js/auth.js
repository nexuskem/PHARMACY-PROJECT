/**
 * MediCare Pharmacy - Authentication & User Management
 * Handles login, registration, and user session with ID-based authentication
 */

const API_BASE_URL = 'http://localhost:3000/api';

const Auth = {
  STORAGE_KEY: 'medicare_user',
  TOKEN_KEY: 'medicare_token',

  /**
   * Get current logged-in user
   * @returns {Object|null} User object or null
   */
  getCurrentUser() {
    try {
      const user = localStorage.getItem(this.STORAGE_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
      return null;
    }
  },

  /**
   * Get stored authentication token
   * @returns {string|null} JWT token or null
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Check if user is logged in
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null && this.getToken() !== null;
  },

  /**
   * Patient Login
   * @param {string} patientId - Patient ID
   * @param {string} password - User password
   * @returns {Promise<Object>} Result object with success status
   */
  async loginPatient(patientId, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: patientId,
          password: password,
          role: 'patient'
        })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(this.TOKEN_KEY, data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Admin/Pharmacist Login
   * @param {string} pharmacistId - Pharmacist ID
   * @param {string} password - User password
   * @returns {Promise<Object>} Result object with success status
   */
  async loginPharmacist(pharmacistId, password, role = 'pharmacist') {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: pharmacistId,
          password: password,
          role
        })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(this.TOKEN_KEY, data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Doctor Login (shares admin portal)
   * @param {string} doctorId - Doctor ID
   * @param {string} password - User password
   * @returns {Promise<Object>} Result object with success status
   */
  async loginDoctor(doctorId, password) {
    // Doctors use the same admin portal/role on the backend
    return this.loginPharmacist(doctorId, password, 'pharmacist');
  },

  /**
   * Patient Registration
   * @param {Object} userData - Patient registration data
   * @returns {Promise<Object>} Result object with success status
   */
  async registerPatient(userData) {
    const { firstName, lastName, patientId, password, confirmPassword, phone, email } = userData;

    // Client-side validation
    if (!firstName || !lastName || !patientId || !password || !confirmPassword) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          patientId,
          password,
          phone: phone || null,
          email: email || null
        })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(this.TOKEN_KEY, data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Pharmacist Registration
   * @param {Object} userData - Pharmacist registration data
   * @returns {Promise<Object>} Result object with success status
   */
  async registerPharmacist(userData) {
    const { firstName, lastName, pharmacistId, password, confirmPassword, phone, email } = userData;

    // Client-side validation
    if (!firstName || !lastName || !pharmacistId || !password || !confirmPassword) {
      return { success: false, message: 'Please fill in all required fields' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/pharmacist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          pharmacistId,
          password,
          phone: phone || null,
          email: email || null
        })
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(this.TOKEN_KEY, data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  /**
   * Request password reset
   * @param {string} userId - Patient or Pharmacist ID
   */
  async forgotPassword(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });
      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  /**
   * Logout current user
   */
  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    showToast('Logged out successfully', 'success');
    window.location.href = 'index.html';
  },

  /**
   * Update header based on auth state
   */
  updateHeader() {
    const authLinks = document.querySelector('.nav-actions');
    if (!authLinks) return;

    const user = this.getCurrentUser();

    if (user) {
      const userName = user.name || `${user.firstName} ${user.lastName}`;
      authLinks.innerHTML = `
        <a href="cart.html" class="cart-btn">
          🛒 Cart
          <span class="cart-count" style="display: none;">0</span>
        </a>
        <a href="${user.role === 'pharmacist' ? 'pharmacist.html' : 'dashboard.html'}" class="btn btn-outline">${userName}</a>
        <button class="btn btn-primary" onclick="Auth.logout()">Logout</button>
      `;
    } else {
      authLinks.innerHTML = `
        <a href="cart.html" class="cart-btn">
          🛒 Cart
          <span class="cart-count" style="display: none;">0</span>
        </a>
        <a href="patient-login.html" class="btn btn-outline">Patient Login</a>
        <a href="doctor-login.html" class="btn btn-outline">Doctor/Admin Login</a>
      `;
    }

    // Update cart count
    if (typeof Cart !== 'undefined') {
      Cart.updateCartCount();
    }
  }
};

/**
 * Handle patient login form submission
 * @param {Event} event - Form submit event
 */
async function handlePatientLogin(event) {
  event.preventDefault();

  const patientId = document.getElementById('patientId').value;
  const password = document.getElementById('password').value;

  const result = await Auth.loginPatient(patientId, password);

  if (result.success) {
    showToast('Login successful!', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Handle admin/pharmacist login form submission
 * @param {Event} event - Form submit event
 */
async function handleAdminLogin(event) {
  event.preventDefault();

  const pharmacistId = document.getElementById('pharmacistId').value;
  const password = document.getElementById('password').value;

  const result = await Auth.loginPharmacist(pharmacistId, password);

  if (result.success) {
    showToast('Login successful!', 'success');
    setTimeout(() => {
      window.location.href = 'pharmacist.html';
    }, 1000);
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Handle doctor login form submission
 * @param {Event} event - Form submit event
 */
async function handleDoctorLogin(event) {
  event.preventDefault();

  const doctorId = document.getElementById('doctorId').value;
  const password = document.getElementById('password').value;

  const result = await Auth.loginDoctor(doctorId, password);

  if (result.success) {
    showToast('Login successful!', 'success');
    setTimeout(() => {
      window.location.href = 'pharmacist.html';
    }, 1000);
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Handle patient registration form submission
 * @param {Event} event - Form submit event
 */
async function handlePatientRegister(event) {
  event.preventDefault();

  const userData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    patientId: document.getElementById('patientId').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    confirmPassword: document.getElementById('confirmPassword').value
  };

  const result = await Auth.registerPatient(userData);

  if (result.success) {
    showToast('Registration successful!', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Handle pharmacist registration form submission
 * @param {Event} event - Form submit event
 */
async function handleAdminRegister(event) {
  event.preventDefault();

  const userData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    pharmacistId: document.getElementById('pharmacistId').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    confirmPassword: document.getElementById('confirmPassword').value
  };

  const result = await Auth.registerPharmacist(userData);

  if (result.success) {
    showToast('Registration successful!', 'success');
    setTimeout(() => {
      window.location.href = 'pharmacist.html';
    }, 1000);
  } else {
    showToast(result.message, 'error');
  }
}

/**
 * Handle appointment booking form
 * @param {Event} event - Form submit event
 */
function handleAppointmentBooking(event) {
  event.preventDefault();

  const date = document.getElementById('appointmentDate').value;
  const selectedTime = document.querySelector('.time-slot.selected');
  const reason = document.getElementById('reason').value;

  if (!date) {
    showToast('Please select a date', 'error');
    return;
  }

  if (!selectedTime) {
    showToast('Please select a time slot', 'error');
    return;
  }

  // Mock save appointment
  const appointment = {
    id: 'APT-' + Date.now().toString().slice(-6),
    date: date,
    time: selectedTime.textContent,
    reason: reason,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };

  let appointments = JSON.parse(localStorage.getItem('medicare_appointments') || '[]');
  appointments.push(appointment);
  localStorage.setItem('medicare_appointments', JSON.stringify(appointments));

  showToast('Appointment booked successfully!', 'success');

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

/**
 * Initialize time slot selection
 */
function initTimeSlots() {
  const container = document.getElementById('time-slots');
  if (!container) return;

  container.innerHTML = TIME_SLOTS.map(time => `
    <div class="time-slot" onclick="selectTimeSlot(this)">${time}</div>
  `).join('');
}

/**
 * Handle time slot selection
 * @param {HTMLElement} element - Clicked time slot element
 */
function selectTimeSlot(element) {
  // Remove previous selection
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.remove('selected');
  });

  // Add selection to clicked slot
  element.classList.add('selected');
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const menu = document.querySelector('.nav-menu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateHeader();

  // Initialize time slots if on appointment page
  if (document.getElementById('time-slots')) {
    initTimeSlots();
  }

  // Set minimum date for appointment to today
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
});
