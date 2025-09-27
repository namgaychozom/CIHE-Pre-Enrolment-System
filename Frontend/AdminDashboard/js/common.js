// Common Admin Dashboard Functions
// Authentication and Initialization

// Initialize admin dashboard
function initializeAdminDashboard() {
    console.log('Initializing Admin Dashboard...');
    
    // Setup tab switching
    setupTabSwitching();
    
    // Load initial data
    loadAdminStats();
    loadRecentEnrollments();
    loadAdminEnrollments();
    
    console.log('Admin Dashboard initialized successfully from common.js');
}

// Load admin data from token/localStorage
async function loadAdminData() {
    try {
        const user = getCurrentUser();
        if (user) {
            const firstName = user.firstName || user.email?.split('@')[0] || 'Admin';
            const lastName = user.lastName || '';
            const displayName = `${firstName} ${lastName}`.trim();
            
            // Fix the element ID - it should be 'admin-user-name' not 'admin-name'
            const adminNameElement = document.getElementById('admin-user-name');
            if (adminNameElement) {
                adminNameElement.textContent = displayName || 'Admin';
            }
        }
        
        // Try to get fresh profile data
        try {
            const profile = await authAPI.getProfile();
            if (profile) {
                loadAdminProfileData(profile);
            }
        } catch (profileError) {
            console.log('Could not fetch fresh profile, using cached data');
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
        const adminNameElement = document.getElementById('admin-user-name');
        if (adminNameElement) {
            adminNameElement.textContent = 'Admin';
        }
    }
}

// Load admin profile data
function loadAdminProfileData(user) {
    try {
        // Update name elements
        const adminNameElements = document.querySelectorAll('.admin-name, .admin-user-name, #admin-user-name');
        adminNameElements.forEach(element => {
            element.textContent = user.email?.split('@')[0] || 'Admin';
        });
        
        // Update email elements
        const adminEmailElements = document.querySelectorAll('.admin-email');
        adminEmailElements.forEach(element => {
            element.textContent = user.email || 'admin@example.com';
        });
        
        // Update role elements
        const adminRoleElements = document.querySelectorAll('.admin-role');
        adminRoleElements.forEach(element => {
            element.textContent = user.role || 'ADMIN';
        });
        
    } catch (error) {
        console.error('Error loading admin profile data:', error);
    }
}

// Initialize admin app
async function initializeAdminApp() {
    console.log('🚀 Starting Admin Dashboard...');
    
    try {
        // Load admin statistics and recent enrollments first
        await loadAdminStats();
        await loadRecentEnrollments();
        
        // Setup event listeners
        setupTabSwitching();
        
        // Setup module-specific event listeners (check if functions exist)
        if (typeof setupEnrollmentEventListeners === 'function') {
            setupEnrollmentEventListeners();
        }
        if (typeof setupSemesterEventListeners === 'function') {
            setupSemesterEventListeners();
        }
        if (typeof setupUnitEventListeners === 'function') {
            setupUnitEventListeners();
        }
        if (typeof setupNotificationButtonListener === 'function') {
            setupNotificationButtonListener();
        }
        
        setupLogout();
        
        // Initialize module-specific listeners
        if (typeof setupUnitsListeners === 'function') {
            setupUnitsListeners();
        }
        if (typeof setupSemesterListeners === 'function') {
            setupSemesterListeners();
        }
        if (typeof setupEnrollmentListeners === 'function') {
            setupEnrollmentListeners();
        }
        if (typeof setupNotificationListeners === 'function') {
            setupNotificationListeners();
        }
        
        // Initialize icons
        initializeAdminIcons();
        
        console.log('✅ Admin Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing admin app:', error);
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        console.log('🔄 Loading additional data...');
        // Add any additional loading here
    }, 100);
}

// Setup tab switching functionality
function setupTabSwitching() {
    // Tab switching functionality
    document.querySelectorAll('.tab-trigger').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Tab switching function
function switchTab(tabId) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-trigger').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to current tab and content
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
        // Load data based on tab
    switch (tabId) {
        case 'enrollment':
            if (typeof loadAdminEnrollments === 'function') {
                loadAdminEnrollments();
            }
            if (typeof loadSemesterFilterOptions === 'function') {
                loadSemesterFilterOptions();
            }
            break;
        case 'units':
            if (typeof loadAdminUnits === 'function') {
                loadAdminUnits();
            }
            break;
        case 'semesters':
            if (typeof loadSemesters === 'function') {
                loadSemesters();
            }
            break;
        case 'notifications':
            if (typeof loadAdminNotifications === 'function') {
                loadAdminNotifications();
            }
            break;
    }
    
    // Update current tab state
    setCurrentTab(tabId);
}

// Setup logout functionality
function setupLogout() {
    const logoutButton = document.getElementById('admin-logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Initialize admin icons
function initializeAdminIcons() {
    console.log('🎨 Initializing admin icons...');
    // Icon initialization logic here
}

// Load admin statistics
async function loadAdminStats() {
    try {
        console.log('🔄 Loading admin stats...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://localhost:5001/api/dashboard/admin/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const stats = await response.json();
        console.log('📊 Admin stats loaded:', stats);

        // Update dashboard statistics
        updateStatElement('total-units', stats.data?.totalUnits || 0);
        updateStatElement('total-users', stats.data?.totalUsers || 0);
        updateStatElement('total-enrollments', stats.data?.totalEnrollments || 0);
        updateStatElement('pending-enrollments', stats.data?.pendingEnrollments || 0);

    } catch (error) {
        console.error('❌ Error loading admin stats:', error);
        // Set default values on error
        updateStatElement('total-units', 0);
        updateStatElement('total-users', 0);
        updateStatElement('total-enrollments', 0);
        updateStatElement('pending-enrollments', 0);
    }
}

// Load recent enrollments for dashboard
async function loadRecentEnrollments() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/enrollment', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            handleTokenExpiration();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const enrollments = result.data || [];
        console.log('📥 Recent enrollments fetched:', enrollments);
        
        // Get recent 5 enrollments, sorted by creation date
        const recentEnrollments = enrollments
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        displayRecentEnrollments(recentEnrollments);

    } catch (error) {
        console.error('❌ Error loading recent enrollments:', error);
        displayRecentEnrollmentsError();
    }
}

// Display recent enrollments in the dashboard
function displayRecentEnrollments(enrollments) {
    const container = document.getElementById('recent-enrollments-list');
    if (!container) return;

    if (enrollments.length === 0) {
        container.innerHTML = '<div class="no-data">No recent enrollments found</div>';
        return;
    }

    const enrollmentsList = enrollments.map(enrollment => {
        const createdDate = new Date(enrollment.createdAt).toLocaleDateString();
        const statusClass = enrollment.status?.toLowerCase() || 'pending';
        const studentName = enrollment.studentProfile?.user?.firstName 
            ? `${enrollment.studentProfile.user.firstName} ${enrollment.studentProfile.user.lastName || ''}`.trim()
            : enrollment.studentProfile?.user?.email || 'Unknown Student';
        
        return `
            <div class="submission-item">
                <div class="submission-info">
                    <div class="student-name">${studentName}</div>
                    <div class="submission-details">
                        <span class="unit-code">${enrollment.unit?.code || 'N/A'}</span>
                        <span class="submission-date">${createdDate}</span>
                    </div>
                </div>
                <div class="submission-status ${statusClass}">
                    ${enrollment.status || 'Pending'}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = enrollmentsList;
}

// Display error state for recent enrollments
function displayRecentEnrollmentsError() {
    const container = document.getElementById('recent-enrollments-list');
    if (container) {
        container.innerHTML = '<div class="error-state">Failed to load recent enrollments</div>';
    }
}

// Helper function to update stat elements
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
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

// Highlight search terms
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Main DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard DOMContentLoaded');
    
    // Debug: Check if functions are available
    console.log('isAuthenticated function available:', typeof isAuthenticated);
    console.log('getCurrentUser function available:', typeof getCurrentUser);
    
    // Debug: Check token and user data
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!userStr);
    
    if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
    }
    
    if (userStr) {
        try {
            const userData = JSON.parse(userStr);
            console.log('User role:', userData.role);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        console.warn('User is not authenticated, redirecting to login');
        window.location.href = '../LoginPage.html';
        return;
    }
    
    const user = getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
        console.warn('User is not admin:', user);
        alert('Access denied. Admin privileges required.');
        logout();
        return;
    }
    
    console.log('Authentication successful for admin user:', user.email);
    
    // Load admin data
    loadAdminData();
    
    // Initialize the admin dashboard (if you want to use this instead of initializeAdminApp)
    // initializeAdminDashboard();
    // Or, if you want both, call both:
    initializeAdminDashboard();
    // initializeAdminApp();
    // By default, call initializeAdminApp (current logic)
    // If you want to switch to initializeAdminDashboard, uncomment above and comment out below
    initializeAdminApp();
});
