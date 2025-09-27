// Global variables and shared state for Admin Dashboard
// This file should be loaded before other modules

// Admin data storage
let adminData = {
    user: null,
    statistics: {}
};

// Data arrays for different entities
let units = [];
let semesters = [];
let enrollments = [];
let notifications = [];
let students = [];
let days = [];
let timeSlots = [];

// UI state variables
let currentTab = 'dashboard';
let isLoading = false;

// Pagination state
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;

// Search and filter state
let currentSearchTerm = '';
let currentFilter = 'all';

// Form state
let editingItemId = null;
let isSubmitting = false;

// Modal state
let activeModal = null;

// Utility functions for shared state management
function setCurrentTab(tab) {
    currentTab = tab;
    console.log('Current tab set to:', tab);
}

function getCurrentTab() {
    return currentTab;
}

function setLoading(loading) {
    isLoading = loading;
    
    // Update loading indicators
    const loadingIndicators = document.querySelectorAll('.loading-indicator');
    loadingIndicators.forEach(indicator => {
        if (loading) {
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    });
}

function getLoading() {
    return isLoading;
}

// Shared utility functions
function getCurrentUser() {
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
    return null;
}

function isAuthenticated() {
    return !!localStorage.getItem('token') && !!getCurrentUser();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    } catch (error) {
        console.error('Error formatting datetime:', error);
        return 'Invalid Date';
    }
}

function showSuccessMessage(message) {
    // You can implement a toast/notification system here
    console.log('Success:', message);
    
    // For now, just show an alert - you can enhance this later
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 3000);
    } else {
        alert('Success: ' + message);
    }
}

function showErrorMessage(message) {
    console.error('Error:', message);
    
    // Check if this is a token-related error
    if (message.includes('token') || message.includes('unauthorized') || message.includes('401')) {
        handleTokenExpiration();
        return;
    }
    
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        // Create a temporary error message
        createToastMessage(message, 'error');
    }
}

// Handle token expiration by redirecting to login
function handleTokenExpiration() {
    console.log('Token expired, redirecting to login...');
    
    // Clear stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show message before redirect
    alert('Your session has expired. Please log in again.');
    
    // Redirect to login page
    window.location.href = '../LoginPage.html';
}

// Create temporary toast messages
function createToastMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    switch (type) {
        case 'success':
            toast.style.backgroundColor = '#10b981';
            break;
        case 'error':
            toast.style.backgroundColor = '#ef4444';
            break;
        default:
            toast.style.backgroundColor = '#3b82f6';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, type === 'error' ? 5000 : 3000);
}

function showInfoMessage(message) {
    console.log('Info:', message);
    
    const infoElement = document.getElementById('info-message');
    if (infoElement) {
        infoElement.textContent = message;
        infoElement.style.display = 'block';
        setTimeout(() => {
            infoElement.style.display = 'none';
        }, 3000);
    } else {
        alert('Info: ' + message);
    }
}

// Initialize Lucide icons
function initializeIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.log('Lucide not available');
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export functions to global scope for backward compatibility
if (typeof window !== 'undefined') {
    window.getCurrentUser = getCurrentUser;
    window.isAuthenticated = isAuthenticated;
    window.formatDate = formatDate;
    window.formatDateTime = formatDateTime;
    window.showSuccessMessage = showSuccessMessage;
    window.showErrorMessage = showErrorMessage;
    window.showInfoMessage = showInfoMessage;
    window.initializeIcons = initializeIcons;
    window.debounce = debounce;
    window.isValidEmail = isValidEmail;
    window.generateId = generateId;
    window.setCurrentTab = setCurrentTab;
    window.getCurrentTab = getCurrentTab;
    window.setLoading = setLoading;
    window.getLoading = getLoading;
    window.handleTokenExpiration = handleTokenExpiration;
    window.createToastMessage = createToastMessage;
}

console.log('Admin Dashboard globals loaded');
