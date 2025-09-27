// Notification Management Functions for Admin Dashboard

// Setup notification event listeners
function setupNotificationButtonListener() {
    const addNotificationBtn = document.getElementById('add-notification-btn');
    console.log('Setting up notification button listener, button found:', !!addNotificationBtn);
    
    if (addNotificationBtn) {
        // Remove any existing listeners
        addNotificationBtn.replaceWith(addNotificationBtn.cloneNode(true));
        const newBtn = document.getElementById('add-notification-btn');
        
        console.log('Adding click listener to notification button');
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Create notification button clicked!');
            showAddNotificationModal();
        });
    } else {
        console.error('Add notification button not found when setting up listener!');
    }
}

// Load admin notifications data
async function loadAdminNotifications() {
    try {
        // Fix: Use getNotifications() instead of getAllNotifications()
        const response = await notificationsAPI.getNotifications();
        const notificationsData = response.data || response;
        
        if (Array.isArray(notificationsData)) {
            adminData.notifications = notificationsData;
            console.log('Loaded admin notifications:', adminData.notifications.length);
            
            // Update notifications display if on notifications tab
            const currentTabId = getCurrentTab();
            if (currentTabId === 'notifications') {
                populateAdminNotifications();
            }
        }
    } catch (error) {
        console.error('Error loading admin notifications:', error);
        adminData.notifications = [];
    }
}

// Populate admin notifications table
function populateAdminNotifications() {
    const container = document.getElementById('notifications-container');
    if (!container) {
        console.error('Notifications container not found!');
        return;
    }
    
    console.log('Populating notifications with', adminData.notifications.length, 'notifications');
    
    if (adminData.notifications.length === 0) {
        container.innerHTML = '<div class="card"><div class="card-content"><p style="text-align: center; padding: 2rem; color: #64748b;">No notifications found</p></div></div>';
        return;
    }

    container.innerHTML = adminData.notifications.map(notification => `
        <div class="card">
            <div class="card-content">
                <div class="notification-header">
                    <h3 class="notification-title">${notification.title}</h3>
                    <div class="notification-meta">
                        <span class="badge notification-type-${notification.type.toLowerCase()}">${notification.type}</span>
                        <span class="notification-date">${new Date(notification.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="notification-details">
                    <p class="notification-message">${notification.message}</p>
                </div>
                <div class="notification-actions">
                    <button class="btn-outline small btn-green" onclick="editNotification('${notification.id}')">Edit</button>
                    <button class="btn-outline small btn-red" onclick="deleteNotification('${notification.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show add notification modal
function showAddNotificationModal() {
    console.log('showAddNotificationModal called!');
    
    try {
        // Remove any existing modal first
        const existingModal = document.getElementById('add-notification-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create notification modal content
        const modalContent = `
            <div class="modal-overlay" id="add-notification-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Notification</h3>
                        <button class="close-modal" onclick="closeAddNotificationModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="add-notification-form">
                            <div class="form-group">
                                <label for="notification-title">Title</label>
                                <input type="text" id="notification-title" name="title" required>
                            </div>
                            <div class="form-group">
                                <label for="notification-message">Message</label>
                                <textarea id="notification-message" name="message" rows="4" required></textarea>
                            </div>
                            <div class="form-group">
                                <label for="notification-type">Type</label>
                                <select id="notification-type" name="type" required>
                                    <option value="">Select notification type</option>
                                    <option value="GENERAL">General</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="ACADEMIC">Academic</option>
                                    <option value="SYSTEM">System</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-outline" onclick="closeAddNotificationModal()">Cancel</button>
                        <button class="btn-primary" onclick="createNotification()">Create Notification</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalContent);
        console.log('Modal added to page successfully');
        
        // Focus on the title field after a brief delay to ensure DOM is ready
        setTimeout(() => {
            const titleField = document.getElementById('notification-title');
            if (titleField) {
                titleField.focus();
                console.log('Title field focused');
            }
        }, 100);
        
    } catch (error) {
        console.error('Error showing add notification modal:', error);
        alert('Error opening notification modal: ' + error.message);
    }
}

// Close add notification modal
function closeAddNotificationModal() {
    const modal = document.getElementById('add-notification-modal');
    if (modal) {
        modal.remove();
        console.log('Notification modal closed and removed');
    }
}

// Create notification
async function createNotification() {
    console.log('createNotification function called');
    
    // Wait a tiny bit to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get form values directly by element IDs
    const titleElement = document.getElementById('notification-title');
    const messageElement = document.getElementById('notification-message');
    const typeElement = document.getElementById('notification-type');
    
    console.log('Form elements found:', {
        title: !!titleElement,
        message: !!messageElement,
        type: !!typeElement
    });
    
    if (!titleElement || !messageElement || !typeElement) {
        alert('Form elements not found. Please try again.');
        return;
    }
    
    // Log the actual values from the form
    console.log('Raw form values:', {
        title: titleElement.value,
        message: messageElement.value,
        type: typeElement.value
    });
    
    const notificationData = {
        title: titleElement.value.trim(),
        message: messageElement.value.trim(),
        type: typeElement.value
    };
    
    // Debug logging
    console.log('Processed form data:', notificationData);
    console.log('Title length:', notificationData.title.length);
    console.log('Message length:', notificationData.message.length);
    
    // Basic validation - check for empty strings and null/undefined
    if (!notificationData.title || notificationData.title === '' ||
        !notificationData.message || notificationData.message === '' ||
        !notificationData.type || notificationData.type === '') {
        
        console.log('Validation failed for:', {
            titleEmpty: !notificationData.title || notificationData.title === '',
            messageEmpty: !notificationData.message || notificationData.message === '',
            typeEmpty: !notificationData.type || notificationData.type === ''
        });
        
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        console.log('Creating notification:', notificationData);
        
        // Check if notificationsAPI is available
        console.log('notificationsAPI available:', typeof notificationsAPI);
        
        if (!notificationsAPI || typeof notificationsAPI.createNotification !== 'function') {
            throw new Error('notificationsAPI is not available. Please refresh the page and try again.');
        }
        
        // Use the notificationsAPI from api.js instead of direct fetch
        const result = await notificationsAPI.createNotification(notificationData);
        console.log('Notification created successfully:', result);
        
        // Add the new notification to local data
        if (result.data) {
            adminData.notifications.unshift(result.data);
        }
        
        // Refresh the notifications display
        populateAdminNotifications();
        
        // Close the modal
        closeAddNotificationModal();
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('Notification created successfully!');
        } else {
            alert('Notification created successfully!');
        }
        
    } catch (error) {
        console.error('Error creating notification:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // More specific error messages
        let errorMessage = 'Failed to create notification. Please try again.';
        
        if (error.message && error.message.includes('401')) {
            errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message && error.message.includes('403')) {
            errorMessage = 'You do not have permission to create notifications.';
        } else if (error.message && error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(errorMessage);
        } else {
            alert(errorMessage);
        }
        
        // Redirect to login if authentication failed
        if (error.message && error.message.includes('401')) {
            setTimeout(() => {
                window.location.href = '../LoginPage.html';
            }, 2000);
        }
    }
}

// Edit notification
function editNotification(notificationId) {
    console.log('Edit notification:', notificationId);
    
    // Find the notification in the current data
    const notification = adminData.notifications.find(n => n.id == notificationId);
    
    if (!notification) {
        console.error('Notification not found:', notificationId);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Notification not found.');
        } else {
            alert('Notification not found.');
        }
        return;
    }
    
    // Show edit modal
    showEditNotificationModal(notification);
}

// Show edit notification modal
function showEditNotificationModal(notification) {
    try {
        // Remove any existing modal first
        const existingModal = document.getElementById('edit-notification-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create edit notification modal content
        const modalContent = `
            <div class="modal-overlay" id="edit-notification-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Notification</h3>
                        <button class="close-modal" onclick="closeEditNotificationModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-notification-form" data-notification-id="${notification.id}">
                            <div class="form-group">
                                <label for="edit-notification-title">Title</label>
                                <input type="text" id="edit-notification-title" name="title" value="${notification.title}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit-notification-message">Message</label>
                                <textarea id="edit-notification-message" name="message" rows="4" required>${notification.message}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="edit-notification-type">Type</label>
                                <select id="edit-notification-type" name="type" required>
                                    <option value="GENERAL" ${notification.type === 'GENERAL' ? 'selected' : ''}>General</option>
                                    <option value="URGENT" ${notification.type === 'URGENT' ? 'selected' : ''}>Urgent</option>
                                    <option value="ACADEMIC" ${notification.type === 'ACADEMIC' ? 'selected' : ''}>Academic</option>
                                    <option value="SYSTEM" ${notification.type === 'SYSTEM' ? 'selected' : ''}>System</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-outline" onclick="closeEditNotificationModal()">Cancel</button>
                        <button class="btn-primary" onclick="updateNotification()">Update Notification</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        // Focus on the title field
        setTimeout(() => {
            const titleField = document.getElementById('edit-notification-title');
            if (titleField) {
                titleField.focus();
            }
        }, 100);
        
    } catch (error) {
        console.error('Error showing edit notification modal:', error);
        alert('Error opening edit modal: ' + error.message);
    }
}

// Close edit notification modal
function closeEditNotificationModal() {
    const modal = document.getElementById('edit-notification-modal');
    if (modal) {
        modal.remove();
    }
}

// Update notification
async function updateNotification() {
    console.log('updateNotification function called');
    
    const form = document.getElementById('edit-notification-form');
    if (!form) {
        alert('Form not found. Please try again.');
        return;
    }
    
    const notificationId = form.getAttribute('data-notification-id');
    const titleElement = document.getElementById('edit-notification-title');
    const messageElement = document.getElementById('edit-notification-message');
    const typeElement = document.getElementById('edit-notification-type');
    
    if (!titleElement || !messageElement || !typeElement) {
        alert('Form elements not found. Please try again.');
        return;
    }
    
    const notificationData = {
        title: titleElement.value.trim(),
        message: messageElement.value.trim(),
        type: typeElement.value
    };
    
    // Validation
    if (!notificationData.title || !notificationData.message || !notificationData.type) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        console.log('Updating notification:', notificationId, notificationData);
        
        if (!notificationsAPI || typeof notificationsAPI.updateNotification !== 'function') {
            throw new Error('notificationsAPI is not available. Please refresh the page and try again.');
        }
        
        const result = await notificationsAPI.updateNotification(notificationId, notificationData);
        console.log('Notification updated successfully:', result);
        
        // Update the notification in local data
        const index = adminData.notifications.findIndex(n => n.id == notificationId);
        if (index !== -1) {
            adminData.notifications[index] = { ...adminData.notifications[index], ...notificationData };
        }
        
        // Refresh the notifications display
        populateAdminNotifications();
        
        // Close the modal
        closeEditNotificationModal();
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('Notification updated successfully!');
        } else {
            alert('Notification updated successfully!');
        }
        
    } catch (error) {
        console.error('Error updating notification:', error);
        
        let errorMessage = 'Failed to update notification. Please try again.';
        if (error.message) {
            errorMessage = error.message;
        }
        
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(errorMessage);
        } else {
            alert(errorMessage);
        }
    }
}

// Delete notification
async function deleteNotification(notificationId) {
    console.log('Delete notification:', notificationId);
    
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
        return;
    }
    
    try {
        if (!notificationsAPI || typeof notificationsAPI.deleteNotification !== 'function') {
            throw new Error('notificationsAPI is not available. Please refresh the page and try again.');
        }
        
        await notificationsAPI.deleteNotification(notificationId);
        console.log('Notification deleted successfully');
        
        // Remove the notification from local data
        adminData.notifications = adminData.notifications.filter(n => n.id != notificationId);
        
        // Refresh the notifications display
        populateAdminNotifications();
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('Notification deleted successfully!');
        } else {
            alert('Notification deleted successfully!');
        }
        
    } catch (error) {
        console.error('Error deleting notification:', error);
        
        let errorMessage = 'Failed to delete notification. Please try again.';
        if (error.message) {
            errorMessage = error.message;
        }
        
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(errorMessage);
        } else {
            alert(errorMessage);
        }
    }
}

// Filter notifications based on search and type
function filterNotifications() {
    const searchTerm = document.getElementById('notification-search')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('notification-type-filter')?.value || '';
    
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;
    
    const notificationItems = notificationsList.querySelectorAll('.notification-item');
    
    notificationItems.forEach(item => {
        const title = item.querySelector('.notification-title')?.textContent.toLowerCase() || '';
        const message = item.querySelector('.notification-message')?.textContent.toLowerCase() || '';
        const type = item.dataset.type || '';
        
        const matchesSearch = title.includes(searchTerm) || message.includes(searchTerm);
        const matchesType = !typeFilter || type === typeFilter;
        
        if (matchesSearch && matchesType) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Toggle notification active status
async function toggleNotificationStatus(notificationId) {
    console.log('Toggle notification status:', notificationId);
    
    const notification = adminData.notifications.find(n => n.id == notificationId);
    if (!notification) {
        console.error('Notification not found:', notificationId);
        return;
    }
    
    try {
        const updatedData = {
            ...notification,
            isActive: !notification.isActive
        };
        
        if (!notificationsAPI || typeof notificationsAPI.updateNotification !== 'function') {
            throw new Error('notificationsAPI is not available. Please refresh the page and try again.');
        }
        
        await notificationsAPI.updateNotification(notificationId, updatedData);
        
        // Update local data
        const index = adminData.notifications.findIndex(n => n.id == notificationId);
        if (index !== -1) {
            adminData.notifications[index].isActive = updatedData.isActive;
        }
        
        // Refresh display
        populateAdminNotifications();
        
        const statusText = updatedData.isActive ? 'activated' : 'deactivated';
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage(`Notification ${statusText} successfully!`);
        }
        
    } catch (error) {
        console.error('Error toggling notification status:', error);
        
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to update notification status. Please try again.');
        }
    }
}

// Get notification type badge class
function getNotificationTypeBadgeClass(type) {
    switch(type) {
        case 'URGENT': return 'badge-danger';
        case 'ACADEMIC': return 'badge-info';
        case 'SYSTEM': return 'badge-warning';
        case 'GENERAL':
        default: return 'badge-secondary';
    }
}

// Setup notification module event listeners
function setupNotificationListeners() {
    console.log('Setting up notification module listeners...');
    
    // Setup create notification form
    const createForm = document.getElementById('create-notification-form');
    if (createForm) {
        createForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createNotification();
        });
    }
    
    // Setup add notification button
    const addBtn = document.getElementById('add-notification-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddNotificationModal);
    }
    
    // Setup search functionality - if exists
    const searchInput = document.getElementById('notification-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterNotifications, 300));
    }
    
    console.log('Notification module listeners setup complete');
}

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.loadAdminNotifications = loadAdminNotifications;
    window.editNotification = editNotification;
    window.deleteNotification = deleteNotification;
    window.showAddNotificationModal = showAddNotificationModal;
    window.closeAddNotificationModal = closeAddNotificationModal;
    window.createNotification = createNotification;
    window.showEditNotificationModal = showEditNotificationModal;
    window.closeEditNotificationModal = closeEditNotificationModal;
    window.updateNotification = updateNotification;
    window.setupNotificationListeners = setupNotificationListeners;
}
