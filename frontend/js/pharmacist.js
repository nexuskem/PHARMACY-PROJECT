/**
 * MediCare Pharmacy - Pharmacist Dashboard
 * Handles loading and processing of orders and appointments
 */

// Dashboard State
const Dashboard = {
    activeTab: 'requests',
    orders: [],
    appointments: [],

    init() {
        this.checkAuth();
        this.setupTabs();
        this.refreshData();

        // Auto-refresh every 30 seconds
        setInterval(() => this.refreshData(), 30000);
    },

    checkAuth() {
        const user = Auth.getCurrentUser();
        if (!user || user.role !== 'pharmacist') {
            window.location.href = 'doctor-login.html';
            return;
        }
        document.getElementById('pharmacist-name').textContent = `Dr. ${user.lastName}`;
    },

    setupTabs() {
        window.switchTab = (tabName) => {
            this.activeTab = tabName;

            // Update buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.closest('.tab-btn').classList.add('active');

            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        };

        // Global logout function
        window.logout = () => {
            Auth.logout();
        };
    },

    async refreshData() {
        await Promise.all([
            this.fetchPendingOrders(),
            this.fetchAppointments()
        ]);
        // Debug Feedback
        showToast(`Synced: ${this.orders.length} orders, ${this.appointments.length} appointments`, 'info');
    },

    async fetchPendingOrders() {
        try {
            const token = Auth.getToken();
            const response = await fetch('http://localhost:3000/api/pharmacist/orders/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                this.orders = data.orders;
                this.renderOrders();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            showToast('Failed to load pending requests', 'error');
        }
    },

    async fetchAppointments() {
        try {
            const token = Auth.getToken();
            const response = await fetch('http://localhost:3000/api/pharmacist/appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                this.appointments = data.appointments;
                this.renderAppointments();
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    },

    renderOrders() {
        const tbody = document.getElementById('requests-table-body');
        const emptyState = document.getElementById('requests-empty');
        const table = tbody.closest('table');

        if (this.orders.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        tbody.innerHTML = this.orders.map(order => `
      <tr>
        <td>#${order.orderNumber}</td>
        <td>
          <div style="font-weight: 500;">${order.customer || 'Unknown'}</div>
          <div style="font-size: 0.85em; color: var(--gray-600);">${order.customerEmail || ''}</div>
        </td>
        <td>
          ${order.items.map(item => `
            <div class="medication-tag">💊 ${item}</div>
          `).join('')}
        </td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td><span class="status-badge status-pending">Pending Approval</span></td>
        <td>
          <button class="action-btn btn-approve" onclick="Dashboard.approveOrder(${order.id})">Approve</button>
          <button class="action-btn btn-reject" onclick="Dashboard.rejectOrder(${order.id})">Reject</button>
        </td>
      </tr>
    `).join('');
    },

    renderAppointments() {
        const scheduledTbody = document.getElementById('appointments-table-body');
        const scheduledEmpty = document.getElementById('appointments-empty');
        const
            requestsTbody = document.getElementById('appointment-requests-body');
        const requestsEmpty = document.getElementById('appointment-requests-empty');

        const pending = this.appointments.filter(a => a.status === 'pending');
        const scheduled = this.appointments.filter(a => a.status === 'scheduled');

        // Render Pending Requests
        if (pending.length === 0) {
            requestsTbody.closest('table').style.display = 'none';
            requestsEmpty.style.display = 'block';
        } else {
            requestsTbody.closest('table').style.display = 'table';
            requestsEmpty.style.display = 'none';
            requestsTbody.innerHTML = pending.map(apt => `
                <tr>
                    <td>${new Date(apt.date).toLocaleDateString()}</td>
                    <td>${apt.time}</td>
                    <td><div style="font-weight: 500;">${apt.customer || 'Unknown'}</div></td>
                    <td>${apt.reason || '-'}</td>
                    <td><span class="status-badge status-pending">Pending</span></td>
                    <td>
                        <button class="action-btn btn-approve" onclick="Dashboard.approveAppointment(${apt.id})">v</button>
                        <button class="action-btn btn-reject" onclick="Dashboard.rejectAppointment(${apt.id})">x</button>
                    </td>
                </tr>
            `).join('');
        }

        // Render Scheduled
        if (scheduled.length === 0) {
            scheduledTbody.closest('table').style.display = 'none';
            scheduledEmpty.style.display = 'block';
        } else {
            scheduledTbody.closest('table').style.display = 'table';
            scheduledEmpty.style.display = 'none';
            scheduledTbody.innerHTML = scheduled.map(apt => `
                <tr>
                    <td>${new Date(apt.date).toLocaleDateString()}</td>
                    <td>${apt.time}</td>
                    <td><div style="font-weight: 500;">${apt.customer || 'Unknown'}</div></td>
                    <td>${apt.reason || '-'}</td>
                    <td><span class="status-badge status-approved">Scheduled</span></td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="alert('Details: ${apt.reason}')">View</button>
                         <button class="action-btn btn-reject" style="padding: 0.25rem 0.5rem; font-size: 0.8em;" onclick="Dashboard.rejectAppointment(${apt.id})">Cancel</button>
                    </td>
                </tr>
            `).join('');
        }
    },

    async approveAppointment(id) {
        if (!confirm('Confirm this appointment?')) return;
        try {
            const token = Auth.getToken();
            const response = await fetch(`http://localhost:3000/api/pharmacist/appointments/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                showToast('Appointment confirmed', 'success');
                this.fetchAppointments();
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Network error', 'error');
        }
    },

    async rejectAppointment(id) {
        if (!confirm('Reject/Cancel this appointment?')) return;
        try {
            const token = Auth.getToken();
            const response = await fetch(`http://localhost:3000/api/pharmacist/appointments/${id}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                showToast('Appointment cancelled', 'info');
                this.fetchAppointments();
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Network error', 'error');
        }
    },

    updateBadge() {
        const count = this.orders.length;
        const badge = document.getElementById('pending-count');
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    },

    async approveOrder(orderId) {
        if (!confirm('Are you sure you want to approve this request?')) return;

        try {
            const token = Auth.getToken();
            const response = await fetch(`http://localhost:3000/api/pharmacist/orders/${orderId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                showToast('Order approved successfully', 'success');
                this.fetchPendingOrders(); // Refresh list
            } else {
                showToast(data.message || 'Failed to approve order', 'error');
            }
        } catch (error) {
            console.error('Error approving order:', error);
            showToast('Network error', 'error');
        }
    },

    async rejectOrder(orderId) {
        if (!confirm('Are you sure you want to reject this request?')) return;

        try {
            const token = Auth.getToken();
            const response = await fetch(`http://localhost:3000/api/pharmacist/orders/${orderId}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                showToast('Order rejected', 'info');
                this.fetchPendingOrders(); // Refresh list
            } else {
                showToast(data.message || 'Failed to reject order', 'error');
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            showToast('Network error', 'error');
        }
    },

    async handleBookAppointment(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const token = Auth.getToken();
            const response = await fetch('http://localhost:3000/api/pharmacist/book-appointment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const result = await response.json();
                if (result.success) {
                    showToast('Appointment booked successfully', 'success');
                    document.getElementById('booking-modal').style.display = 'none';
                    form.reset();
                    this.fetchAppointments();
                } else {
                    showToast(result.message || 'Operation failed', 'error');
                }
            } else {
                // Non-JSON response (likely server error 500 with HTML)
                const text = await response.text();
                console.error('Server returned non-JSON:', text);
                showToast(`Server Error: ${response.status} - Check console`, 'error');
            }
        } catch (error) {
            console.error('Error booking:', error);
            showToast(`Error: ${error.message || 'Network or Parsing Error'}`, 'error');
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});
