/**
 * Interactive Toast Notification System
 * Handles displaying and managing toast notifications
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Create container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (default 3000)
     */
    show(message, type = 'info', duration = 3000) {
        const id = Date.now();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.id = id;

        // Icon based on type
        let icon = '';
        switch (type) {
            case 'success': icon = '✓'; break;
            case 'error': icon = '✕'; break;
            case 'warning': icon = '⚠️'; break;
            default: icon = 'ℹ️';
        }

        toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close">&times;</button>
      <div class="toast-progress"></div>
    `;

        // Close button event
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => this.dismiss(toast);

        // Auto dismiss logic
        let timeout;
        const startTimer = () => {
            timeout = setTimeout(() => {
                this.dismiss(toast);
            }, duration);
            toast.querySelector('.toast-progress').style.animationPlayState = 'running';
        };

        const pauseTimer = () => {
            clearTimeout(timeout);
            toast.querySelector('.toast-progress').style.animationPlayState = 'paused';
        };

        // Pause on hover
        toast.onmouseenter = pauseTimer;
        toast.onmouseleave = startTimer;

        // Start timer
        startTimer();

        // Set progress animation duration
        const progress = toast.querySelector('.toast-progress');
        progress.style.animationDuration = `${duration}ms`;

        this.container.appendChild(toast);
        this.toasts.push(toast);
    }

    dismiss(toast) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        toast.addEventListener('animationend', () => {
            if (toast.parentElement) {
                toast.remove();
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        });
    }
}

// Initialize and expose as global function
const toastManager = new ToastManager();

window.showToast = (message, type, duration) => {
    toastManager.show(message, type, duration);
};
