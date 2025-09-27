// Admin Dashboard Script
// Authentication Check
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
    
    // Initialize the admin app
    initializeAdminApp();
});

// Initialize admin dashboard
function initializeAdminDashboard() {
    console.log('Initializing Admin Dashboard...');
    
    // Setup tab switching
    setupTabSwitching();
    
    // Load initial enrollment data
    loadAdminEnrollments();
    
    console.log('Admin Dashboard initialized successfully');
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
    if (!user) return;
    
    try {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Admin';
        const adminNameElements = document.querySelectorAll('.admin-name');
        adminNameElements.forEach(element => {
            element.textContent = fullName;
        });
        
        const adminEmailElements = document.querySelectorAll('.admin-email');
        adminEmailElements.forEach(element => {
            element.textContent = user.email || 'Not provided';
        });
        
        const adminRoleElements = document.querySelectorAll('.admin-role');
        adminRoleElements.forEach(element => {
            element.textContent = user.role || 'Administrator';
        });
    } catch (error) {
        console.error('Error loading admin profile data:', error);
    }
}

// Admin Application State
let currentAdminView = 'dashboard';
let currentAdminTab = 'overview';
let adminData = {
    units: [],
    enrollments: [],
    notifications: [],
    users: [],
    stats: {}
};

// Initialize the admin application
async function initializeAdminApp() {
    console.log('Initializing admin app...');
    
    // Setup essential event listeners
    setupTabSwitching();
    setupLogout();
    
    // Initialize admin event listeners (including Add Unit button)
    initializeAdminEventListeners();
    
    // Load all admin data
    await loadAdminUnits();
    await loadAdminEnrollments();
    await loadAdminNotifications();
    await loadAdminUsers();
    await loadRecentEnrollments();
    
    // Load and update dashboard statistics
    await loadAdminStats();
    
    // Initialize semester management
    initializeSemesterManagement();
    
    // Setup notification button listener
    setTimeout(() => {
        setupNotificationButtonListener();
        console.log('Testing if showAddNotificationModal is accessible:', typeof window.showAddNotificationModal);
    }, 500);
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
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(tabId);
    
    if (selectedTab && selectedContent) {
        selectedTab.classList.add('active');
        selectedContent.classList.add('active');
        currentAdminTab = tabId;
        console.log('Switched to tab:', tabId);
        
        // Populate data when switching to specific tabs
        if (tabId === 'enrollment') {
            populateAdminEnrollments();
            setupEnrollmentEventListeners();
        } else if (tabId === 'units') {
            populateAdminUnits();
        } else if (tabId === 'notifications') {
            populateAdminNotifications();
            // Setup notification button listener when tab is active
            setupNotificationButtonListener();
        } else if (tabId === 'semesters') {
            loadSemesters();
            setupSemesterEventListeners();
        } else if (tabId === 'units') {
            populateAdminUnits();
            setupUnitEventListeners();
        }
    }
}

// Setup enrollment event listeners
function setupEnrollmentEventListeners() {
    // Load semester data for filter dropdown
    loadSemesterFilter();
    
    // Setup filters
    const semesterFilter = document.getElementById('semester-filter');
    
    if (semesterFilter) {
        semesterFilter.removeEventListener('change', filterEnrollments);
        semesterFilter.addEventListener('change', filterEnrollments);
    }
}

// Setup semester event listeners
function setupSemesterEventListeners() {
    // Setup form submission
    const semesterForm = document.getElementById('semester-form');
    if (semesterForm) {
        semesterForm.removeEventListener('submit', handleSemesterSubmit);
        semesterForm.addEventListener('submit', handleSemesterSubmit);
    }
    
    // Setup search and filter
    const searchInput = document.getElementById('semester-search');
    const clearSearchBtn = document.getElementById('clear-semester-search');
    
    if (searchInput) {
        searchInput.removeEventListener('input', debounce(filterSemesters, 300));
        searchInput.addEventListener('input', debounce(filterSemesters, 300));
        
        // Show/hide clear button
        searchInput.addEventListener('input', function() {
            if (clearSearchBtn) {
                clearSearchBtn.style.display = this.value.trim() ? 'flex' : 'none';
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                this.style.display = 'none';
                filterSemesters();
            }
        });
    }
}

// Setup unit event listeners
function setupUnitEventListeners() {
    console.log('🔧 Setting up unit event listeners...');
    
    // Setup form submission
    const unitForm = document.getElementById('unit-form');
    console.log('📝 Unit form found:', !!unitForm);
    
    if (unitForm) {
        // Remove any existing listeners
        unitForm.removeEventListener('submit', handleUnitSubmit);
        
        // Add new listener with capture phase to ensure we catch it first
        unitForm.addEventListener('submit', handleUnitSubmit, true);
        
        // Also add it in the bubble phase as backup
        unitForm.addEventListener('submit', handleUnitSubmit);
        
        console.log('✅ Unit form submit listeners attached');
        
        // Also prevent any default form action by setting onsubmit
        unitForm.onsubmit = function(e) {
            console.log('⚠️ Form onsubmit triggered - redirecting to handleUnitSubmit');
            return handleUnitSubmit(e);
        };
    } else {
        console.error('❌ Unit form not found!');
    }
    
    // Setup search functionality
    const unitsSearchInput = document.getElementById('units-search');
    const clearUnitsSearchBtn = document.getElementById('clear-units-search');
    
    if (unitsSearchInput) {
        unitsSearchInput.removeEventListener('input', debounce(filterUnits, 300));
        unitsSearchInput.addEventListener('input', debounce(filterUnits, 300));
        
        // Show/hide clear button
        unitsSearchInput.addEventListener('input', function() {
            if (clearUnitsSearchBtn) {
                clearUnitsSearchBtn.style.display = this.value.trim() ? 'flex' : 'none';
            }
        });
    }
    
    if (clearUnitsSearchBtn) {
        clearUnitsSearchBtn.addEventListener('click', function() {
            if (unitsSearchInput) {
                unitsSearchInput.value = '';
                this.style.display = 'none';
                filterUnits();
            }
        });
    }
}

// Setup notification button listener
function setupNotificationButtonListener() {
    const addNotificationBtn = document.getElementById('add-notification-btn');
    console.log('Setting up notification button listener, button found:', addNotificationBtn);
    
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

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await authAPI.logout();
            } catch (error) {
                console.error('Logout error:', error);
            }
            logout(); // This will clear localStorage and redirect
        });
    }
}

function initializeAdminIcons() {
    if (typeof lucide !== 'undefined') {
        try {
            lucide.createIcons();
            console.log('Admin icons initialized successfully');
        } catch (e) {
            console.log('Error initializing admin icons:', e);
        }
    }
}

// Load admin units data
async function loadAdminUnits() {
    console.log('🔄 loadAdminUnits called');
    try {
        const token = localStorage.getItem('token');
        console.log('🔄 Making API call to fetch units...');
        const response = await fetch('http://localhost:5001/api/units?limit=1000', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📦 Units API response:', result);
        const unitsData = result.data || [];
        
        if (Array.isArray(unitsData)) {
            adminData.units = unitsData;
            console.log('✅ Loaded admin units:', adminData.units.length);
            console.log('📋 Units data:', adminData.units);
            console.log('🏷️ Current admin tab:', currentAdminTab);
            
            // Always update units display when units are loaded
            console.log('🔄 Calling populateAdminUnits...');
            populateAdminUnits();
        }
    } catch (error) {
        console.error('❌ Error loading admin units:', error);
        adminData.units = [];
    }
}

// Load admin enrollments data
async function loadAdminEnrollments() {
    try {
        // Fix: Use getEnrollments() instead of getAllEnrollments()
        const response = await enrollmentAPI.getEnrollments();
        const enrollmentsData = response.data?.enrollments || response.data || response;
        
        if (Array.isArray(enrollmentsData)) {
            adminData.enrollments = enrollmentsData;
            console.log('Loaded admin enrollments:', adminData.enrollments.length);
            
            // Update enrollments display if on enrollment tab (note: singular "enrollment", not "enrollments")
            if (currentAdminTab === 'enrollment') {
                populateAdminEnrollments();
            }
        } else {
            console.log('No enrollments data or data is not an array:', enrollmentsData);
            adminData.enrollments = [];
        }
    } catch (error) {
        console.error('Error loading admin enrollments:', error);
        adminData.enrollments = [];
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
            if (currentAdminTab === 'notifications') {
                populateAdminNotifications();
            }
        }
    } catch (error) {
        console.error('Error loading admin notifications:', error);
        adminData.notifications = [];
    }
}

// Load admin users data
async function loadAdminUsers() {
    try {
        // Fix: Use usersAPI.getUsers() instead of userAPI.getAllUsers()
        const response = await usersAPI.getUsers();
        const usersData = response.data || response;
        
        if (Array.isArray(usersData)) {
            adminData.users = usersData;
            console.log('Loaded admin users:', adminData.users.length);
            
            // Update users display if on users tab
            if (currentAdminTab === 'users') {
                populateAdminUsers();
            }
        }
    } catch (error) {
        console.error('Error loading admin users:', error);
        adminData.users = [];
    }
}

// Load recent students for dashboard overview
async function loadRecentEnrollments() {
    try {
        // Get recent enrollments from existing data or fetch fresh data
        if (adminData.enrollments && adminData.enrollments.length > 0) {
            // Get the most recent 5 enrollments
            const recentEnrollments = adminData.enrollments
                .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
                .slice(0, 5);
            
            console.log('Loaded recent enrollments:', recentEnrollments.length);
            populateRecentEnrollments(recentEnrollments);
        } else {
            // If no enrollment data, try to load it
            await loadAdminData();
            if (adminData.enrollments && adminData.enrollments.length > 0) {
                const recentEnrollments = adminData.enrollments
                    .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
                    .slice(0, 5);
                populateRecentEnrollments(recentEnrollments);
            } else {
                populateRecentEnrollments([]);
            }
        }
    } catch (error) {
        console.error('Error loading recent enrollments:', error);
        populateRecentEnrollments([]);
    }
}

// Populate recent enrollments display
function populateRecentEnrollments(enrollments) {
    const container = document.getElementById('recent-enrollments-list');
    if (!container) {
        console.error('Recent enrollments container not found!');
        return;
    }
    
    if (enrollments.length === 0) {
        container.innerHTML = '<div class="no-data">No recent enrollments found</div>';
        return;
    }
    
    container.innerHTML = enrollments.map(enrollment => {
        // Calculate days since enrollment
        let daysText = 'Recently';
        if (enrollment.enrolledAt) {
            try {
                const enrolledDate = new Date(enrollment.enrolledAt);
                const currentDate = new Date();
                
                // Check if the date is valid
                if (!isNaN(enrolledDate.getTime())) {
                    const daysSince = Math.floor((currentDate - enrolledDate) / (1000 * 60 * 60 * 24));
                    if (daysSince === 0) {
                        daysText = 'Today';
                    } else if (daysSince > 0) {
                        daysText = `${daysSince} day${daysSince === 1 ? '' : 's'} ago`;
                    } else {
                        daysText = 'Recently';
                    }
                }
            } catch (error) {
                console.warn('Error parsing enrollment date:', enrollment.id, error);
                daysText = 'Recently';
            }
        }
        
        // Get student and unit information
        const student = enrollment.studentProfile;
        const unit = enrollment.unit;
        
        const studentName = student 
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown Student';
            
        const unitName = unit ? unit.title : 'Unknown Unit';
        const studentId = student ? (student.studentId || student.id) : 'N/A';
        
        return `
            <div class="submission-item">
                <div class="submission-info">
                    <p class="student-name">${studentName} (${studentId})</p>
                    <p class="course-count">Enrolled in ${unitName}</p>
                </div>
                <div class="submission-badges">
                    <span class="badge outline">${daysText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load admin statistics
async function loadAdminStats() {
    try {
        console.log('📊 Loading admin statistics from backend...');
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/dashboard/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch admin statistics: ${response.status}`);
        }

        const result = await response.json();
        const stats = result.data;
        
        console.log('✅ Fetched admin stats from backend:', stats);
        
        adminData.stats = stats;
        
        // Update dashboard stats
        updateAdminDashboardStats();
        
    } catch (error) {
        console.error('❌ Error loading admin stats from backend:', error);
        
        // Fallback to calculating from local data
        console.log('📊 Falling back to local calculation...');
        console.log('📊 Current adminData units length:', adminData.units?.length || 0);
        console.log('📊 Current adminData users length:', adminData.users?.length || 0);
        console.log('📊 Current adminData enrollments length:', adminData.enrollments?.length || 0);
        
        const fallbackStats = {
            totalUnits: adminData.units?.length || 0,
            totalEnrollments: adminData.enrollments?.length || 0,
            totalUsers: adminData.users?.length || 0,
            pendingEnrollments: adminData.enrollments?.filter(e => e.status === 'PENDING').length || 0,
            approvedEnrollments: adminData.enrollments?.filter(e => e.status === 'APPROVED').length || 0,
            activeNotifications: adminData.notifications?.filter(n => n.isActive).length || 0
        };
        
        adminData.stats = fallbackStats;
        console.log('✅ Calculated fallback admin stats:', fallbackStats);
        
        // Update dashboard stats
        updateAdminDashboardStats();
    }
}

// Utility function for debouncing search input
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

// Utility function for highlighting search terms
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Utility function for normalizing text for search
function normalizeSearchText(text) {
    return text ? text.toLowerCase().trim().replace(/\s+/g, ' ') : '';
}

// Function to filter units
async function filterUnits() {
    const searchInput = document.getElementById('units-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    console.log('🔍 Filtering units with search term:', searchTerm);
    
    if (!searchTerm) {
        // If no search term, reload all units
        await loadAdminUnits();
        updateSearchResultsCount('units', 0, '');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/units?limit=1000&search=${encodeURIComponent(searchTerm)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const unitsData = result.data || [];
        
        console.log(`📊 Found ${unitsData.length} units matching search`);
        
        // Update adminData temporarily for this search
        const originalUnits = adminData.units;
        adminData.units = unitsData;
        
        // Display filtered units with highlighting
        populateFilteredUnits(unitsData, searchTerm);
        
        // Restore original data
        adminData.units = originalUnits;
        
    } catch (error) {
        console.error('❌ Error searching units:', error);
        showErrorMessage('Failed to search units. Please try again.');
    }
}

// Function to populate filtered units with highlighting
function populateFilteredUnits(units, searchTerm = '') {
    const container = document.getElementById('units-container');
    
    if (!container) {
        console.error('❌ Units container not found!');
        return;
    }
    
    if (units.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <p style="text-align: center; padding: 2rem; color: #64748b;">
                        No units found matching "${searchTerm}". Try a different search term.
                    </p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = units.map(unit => {
        const unitCode = highlightSearchTerm(unit.unitCode, searchTerm);
        const title = highlightSearchTerm(unit.title, searchTerm);
        const description = highlightSearchTerm(unit.description || 'N/A', searchTerm);
        
        return `
            <div class="card">
                <div class="card-content">
                    <div class="unit-header">
                        <h3 class="unit-title">${title}</h3>
                    </div>
                    <div class="unit-details">
                        <p><strong>Unit Code:</strong> ${unitCode}</p>
                        <p><strong>Credits:</strong> ${unit.credits}</p>
                        <p><strong>Description:</strong> ${description}</p>
                    </div>
                    <div class="unit-actions">
                        <button class="btn secondary small" onclick="editUnit(${unit.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn danger small" onclick="deleteUnit(${unit.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update search results count
    updateSearchResultsCount('units', units.length, searchTerm);
}

// Function to update search results count
function updateSearchResultsCount(type, count, searchTerm) {
    const searchBox = document.querySelector(`#${type === 'units' ? 'units-search' : 'semester-search'}`).parentElement;
    let countElement = searchBox.querySelector('.search-results-count');
    
    if (!countElement) {
        countElement = document.createElement('div');
        countElement.className = 'search-results-count';
        searchBox.appendChild(countElement);
    }
    
    if (searchTerm) {
        countElement.textContent = `Found ${count} ${type} matching "${searchTerm}"`;
        countElement.style.display = 'block';
    } else {
        countElement.style.display = 'none';
    }
}

// Initialize admin event listeners
function initializeAdminEventListeners() {
    console.log('Setting up admin event listeners...');
    
    // Navigation
    const adminNavButtons = document.querySelectorAll('[data-admin-tab], .admin-nav-item');
    adminNavButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.currentTarget.getAttribute('data-admin-tab') || 
                        e.currentTarget.textContent.toLowerCase().trim();
            
            if (tab) {
                showAdminTab(tab);
            }
        });
    });
    
    // Logout functionality
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await authAPI.logout();
            } catch (error) {
                console.error('Logout error:', error);
            }
            logout();
        });
    }
    
    // Add buttons for CRUD operations
    setupAdminCRUDListeners();
    
    console.log('Admin event listeners setup complete');
}

// Setup CRUD operation listeners
function setupAdminCRUDListeners() {
    // Units CRUD
    const addUnitBtn = document.getElementById('add-unit-btn');
    console.log('Setting up add unit button listener, button found:', addUnitBtn);
    
    if (addUnitBtn) {
        // Remove any existing listeners
        addUnitBtn.replaceWith(addUnitBtn.cloneNode(true));
        const newBtn = document.getElementById('add-unit-btn');
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Add unit button clicked');
            showAddUnitModal();
        });
        
        console.log('Add unit button listener attached successfully');
    } else {
        console.error('Add unit button not found!');
    }
    
    // Enrollments management
    const enrollmentActions = document.querySelectorAll('.enrollment-action');
    enrollmentActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const enrollmentId = e.target.dataset.enrollmentId;
            handleEnrollmentAction(action, enrollmentId);
        });
    });
    
    // Notifications CRUD
    const addNotificationBtn = document.getElementById('add-notification-btn');
    console.log('Looking for add-notification-btn:', addNotificationBtn);
    if (addNotificationBtn) {
        console.log('Add notification button found, adding event listener');
        addNotificationBtn.addEventListener('click', () => {
            console.log('Add notification button clicked!');
            showAddNotificationModal();
        });
    } else {
        console.error('Add notification button not found!');
    }
    
    // Users management
    const userActions = document.querySelectorAll('.user-action');
    userActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const userId = e.target.dataset.userId;
            handleUserAction(action, userId);
        });
    });
}

// Admin view management
function showAdminView(view) {
    console.log('Showing admin view:', view);
    currentAdminView = view;
    
    // Hide all views
    document.querySelectorAll('.admin-view').forEach(v => {
        v.classList.remove('active');
    });
    
    // Show target view
    const targetView = document.getElementById(`admin-${view}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }
}

function showAdminTab(tab) {
    console.log('Showing admin tab:', tab);
    currentAdminTab = tab;
    
    // Update navigation
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().trim() === tab.toLowerCase()) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-admin-tab') === tab) {
            btn.classList.add('active');
        }
    });
    
    // Hide all tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show target tab
    const targetTab = document.getElementById(`admin-${tab}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Load tab-specific data
        switch(tab) {
            case 'overview':
                updateAdminDashboardStats();
                break;
            case 'units':
                populateAdminUnits();
                break;
            case 'enrollments':
                populateAdminEnrollments();
                break;
            case 'notifications':
                populateAdminNotifications();
                break;
            case 'users':
                populateAdminUsers();
                break;
        }
    }
    
    setTimeout(initializeAdminIcons, 100);
}

// Update admin dashboard statistics
function updateAdminDashboardStats() {
    console.log('🔄 Updating dashboard statistics...');
    const stats = adminData.stats;
    console.log('📊 Stats object:', stats);
    
    // Update stat cards
    const statElements = {
        'total-units': stats.totalUnits || 0,
        'total-enrollments': stats.totalEnrollments || 0,
        'total-users': stats.totalUsers || 0,
        'pending-enrollments': stats.pendingEnrollments || 0,
        'approved-enrollments': stats.approvedEnrollments || 0,
        'active-notifications': stats.activeNotifications || 0
    };
    
    console.log('📊 Stat elements to update:', statElements);
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        console.log(`📊 Updating element ${id} with value ${value}, element found:`, !!element);
        if (element) {
            element.textContent = value;
            console.log(`✅ Set ${id} to ${value}`);
        } else {
            console.error(`❌ Element not found: ${id}`);
        }
    });
    
    console.log('✅ Admin dashboard stats updated');
}

// Populate admin units table
function populateAdminUnits() {
    console.log('🏗️ populateAdminUnits called');
    const container = document.getElementById('units-container');
    console.log('📦 Units container found:', !!container);
    
    if (!container) {
        console.error('❌ Units container not found!');
        return;
    }
    
    console.log('📊 Populating units with', adminData.units.length, 'units');
    console.log('📋 Units data:', adminData.units);
    
    if (adminData.units.length === 0) {
        console.log('❌ No units to display');
        container.innerHTML = '<div class="card"><div class="card-content"><p style="text-align: center; padding: 2rem; color: #64748b;">No units found</p></div></div>';
        return;
    }

    console.log('✅ Generating HTML for units...');
    container.innerHTML = adminData.units.map(unit => `
        <div class="card">
            <div class="card-content">
                <div class="unit-header">
                    <h3 class="unit-title">${unit.title}</h3>
                </div>
                <div class="unit-details">
                    <p><strong>Unit Code:</strong> ${unit.unitCode}</p>
                    <p><strong>Credits:</strong> ${unit.credits}</p>
                    <p><strong>Description:</strong> ${unit.description || 'N/A'}</p>
                </div>
                <div class="unit-actions">
                    <button class="btn-outline small btn-green" onclick="editUnit('${unit.id}')">Edit</button>
                    <button class="btn-outline small btn-red" onclick="deleteUnit('${unit.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load semester filter dropdown for enrollment tab
async function loadSemesterFilter() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        const response = await fetch('http://localhost:5001/api/semesters', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const semesters = data.data || [];
        
        const semesterFilter = document.getElementById('semester-filter');
        if (semesterFilter) {
            semesterFilter.innerHTML = `
                <option value="">All Semesters</option>
                ${semesters.map(semester => `
                    <option value="${semester.id}">${semester.name}</option>
                `).join('')}
            `;
        }
        
    } catch (error) {
        console.error('Error loading semester filter:', error);
    }
}

// Filter enrollments based on selected filters
function filterEnrollments() {
    const semesterFilter = document.getElementById('semester-filter');
    
    const semesterValue = semesterFilter ? semesterFilter.value : '';
    
    console.log('Filtering enrollments:', { semesterValue });
    
    // Filter the enrollment data
    let filteredEnrollments = adminData.enrollments;
    
    // Filter by semester if selected
    if (semesterValue && semesterValue !== '' && semesterValue !== 'all') {
        filteredEnrollments = filteredEnrollments.filter(enrollment => {
            return enrollment.semesterId === parseInt(semesterValue);
        });
    }
    
    // Temporarily store original data and replace with filtered data
    const originalEnrollments = adminData.enrollments;
    adminData.enrollments = filteredEnrollments;
    
    // Re-populate the table with filtered data
    populateAdminEnrollments();
    
    // Restore original data
    adminData.enrollments = originalEnrollments;
}

// Populate admin enrollments table
function populateAdminEnrollments() {
    const container = document.getElementById('enrollment-table-body');
    if (!container) {
        console.error('Enrollment table body not found!');
        return;
    }
    
    if (adminData.enrollments.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">No enrollments found</td></tr>';
        return;
    }

    console.log('Populating enrollments table with', adminData.enrollments.length, 'enrollments');
    
    // Group enrollments by user
    const enrollmentsByUser = {};
    adminData.enrollments.forEach(enrollment => {
        const studentProfile = enrollment.studentProfile;
        const studentId = studentProfile?.id || studentProfile?.studentId;
        
        if (!enrollmentsByUser[studentId]) {
            enrollmentsByUser[studentId] = {
                user: studentProfile,
                enrollments: []
            };
        }
        enrollmentsByUser[studentId].enrollments.push(enrollment);
    });

    container.innerHTML = Object.values(enrollmentsByUser).map(data => {
        const user = data.user;
        const enrollments = data.enrollments;
        
        if (!user) return '';
        
        // Use the same ID logic as the grouping
        const studentId = user?.id || user?.studentId;
        
        const unitNames = enrollments.map(e => {
            return e.unit ? e.unit.title : 'Unknown Unit';
        }).join(', ');
        
        // Calculate availability count
        const totalAvailabilities = enrollments.reduce((sum, e) => {
            return sum + (e.availabilities?.length || 0);
        }, 0);
        
        // Get semester information - group by semester for display
        const semesterGroups = {};
        enrollments.forEach(enrollment => {
            const semesterName = enrollment.semester?.name || 'Unknown Semester';
            if (!semesterGroups[semesterName]) {
                semesterGroups[semesterName] = [];
            }
            semesterGroups[semesterName].push(enrollment.unit?.title || 'Unknown Unit');
        });
        
        const semesterDisplay = Object.entries(semesterGroups).map(([semester, units]) => 
            `${semester} (${units.length} unit${units.length === 1 ? '' : 's'})`
        ).join(', ');
        
        return `
            <tr>
                <td><input type="checkbox" class="checkbox"></td>
                <td>
                    <div class="student-info">
                        <div class="student-name">${user.firstName || 'N/A'} ${user.lastName || ''}</div>
                        <div class="student-id">${user.studentId || user.id}</div>
                    </div>
                </td>
                <td>
                    <div class="courses-list">
                        ${unitNames || 'No units enrolled'}
                    </div>
                </td>
                <td>
                    <span class="badge semester-badge">${semesterDisplay}</span>
                </td>
                <td>
                    <div class="availability-info">
                        <div class="availability-count">${totalAvailabilities} availability slots</div>
                    </div>
                </td>
                <td>${new Date(enrollments[0].enrolledAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-outline small" onclick="viewStudentDetails('${studentId}')">View Details</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Helper function for enrollment status classes
function getEnrollmentStatusClass(status) {
    switch(status) {
        case 'APPROVED': return 'badge-success';
        case 'REJECTED': return 'badge-error';
        case 'PENDING': return 'badge-warning';
        default: return 'badge-secondary';
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

// Populate admin users table
function populateAdminUsers() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    
    if (adminData.users.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-4">No users found</td></tr>';
        return;
    }
    
    container.innerHTML = adminData.users.map(user => `
        <tr>
            <td class="px-4 py-2">${user.email}</td>
            <td class="px-4 py-2">${user.firstName || ''} ${user.lastName || ''}</td>
            <td class="px-4 py-2">
                <span class="badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'}">
                    ${user.role}
                </span>
            </td>
            <td class="px-4 py-2">
                <span class="badge ${user.isActive ? 'badge-success' : 'badge-error'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="px-4 py-2">${new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="px-4 py-2">
                <div class="flex space-x-2">
                    <button class="btn btn-sm btn-outline text-blue-600" onclick="editUser('${user.id}')">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-outline text-red-600" onclick="deleteUser('${user.id}')">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    setTimeout(initializeAdminIcons, 100);
}

// ====== CRUD Operations ======

// Unit CRUD operations
// Unit Management Functions
// Test function to debug Add Unit
function testAddUnit() {
    console.log('🧪 Testing Add Unit functionality...');
    
    // Test 1: Check if button exists
    const addButton = document.getElementById('add-unit-btn');
    console.log('1️⃣ Add Unit button exists:', !!addButton);
    
    // Test 2: Check if modal exists
    const modal = document.getElementById('unit-modal');
    console.log('2️⃣ Unit modal exists:', !!modal);
    
    // Test 3: Check if form exists
    const form = document.getElementById('unit-form');
    console.log('3️⃣ Unit form exists:', !!form);
    
    // Test 4: Check event listeners
    console.log('4️⃣ Testing button click...');
    if (addButton) {
        addButton.click();
    }
    
    // Test 5: Check modal visibility after click
    setTimeout(() => {
        console.log('5️⃣ Modal display after click:', modal ? modal.style.display : 'modal not found');
        
        // Test 6: Try manual form submission
        if (form) {
            console.log('6️⃣ Testing form submission...');
            
            // Fill form with test data
            const unitCodeInput = form.querySelector('[name="unitCode"]');
            const titleInput = form.querySelector('[name="title"]');
            const creditsInput = form.querySelector('[name="credits"]');
            const descriptionInput = form.querySelector('[name="description"]');
            
            if (unitCodeInput) unitCodeInput.value = 'TEST101';
            if (titleInput) titleInput.value = 'Test Unit';
            if (creditsInput) creditsInput.value = '3';
            if (descriptionInput) descriptionInput.value = 'Test description';
            
            console.log('📝 Form filled with test data');
            
            // Submit form
            const submitEvent = new Event('submit', { bubbles: true });
            form.dispatchEvent(submitEvent);
            console.log('📤 Form submit event dispatched');
        }
    }, 1000);
}

// Add to window for easy testing
window.testAddUnit = testAddUnit;

function showAddUnitModal() {
    console.log('showAddUnitModal called');
    
    const modal = document.getElementById('unit-modal');
    const form = document.getElementById('unit-form');
    const title = document.getElementById('unit-modal-title');
    
    console.log('Modal elements found:', { modal: !!modal, form: !!form, title: !!title });
    
    if (!modal) {
        console.error('Unit modal not found!');
        alert('Modal not found. Please refresh the page and try again.');
        return;
    }
    
    if (!form) {
        console.error('Unit form not found!');
        alert('Form not found. Please refresh the page and try again.');
        return;
    }
    
    if (title) {
        title.textContent = 'Add New Unit';
    }
    
    // Reset the form
    form.reset();
    form.removeAttribute('data-unit-id');
    
    // Reset submit button text
    const submitText = document.getElementById('unit-submit-text');
    if (submitText) {
        submitText.textContent = 'Add Unit';
    }
    
    // Ensure modal is properly displayed
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    
    console.log('Modal display style set to:', modal.style.display);
    console.log('Modal should now be visible');
    
    // Focus on first input
    setTimeout(() => {
        const firstInput = form.querySelector('input[type="text"]');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

function closeUnitModal() {
    const modal = document.getElementById('unit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle unit form submission
async function handleUnitSubmit(event) {
    // Prevent form submission and page refresh
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    console.log('🚀 handleUnitSubmit called - Form submission started');
    console.log('🛡️ Default prevented, propagation stopped');
    
    // Add a visible alert to confirm the function is being called
    console.log('🔔 ALERT: Form submission intercepted successfully!');
    
    const form = event.target;
    console.log('📝 Form element:', form);
    
    const unitId = form.getAttribute('data-unit-id');
    const isEditing = !!unitId;
    
    const formData = new FormData(form);
    
    // Debug form data collection
    console.log('📋 Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    const unitData = {
        unitCode: formData.get('unitCode'),
        title: formData.get('title'),
        credits: parseInt(formData.get('credits')),
        description: formData.get('description')
    };
    
    console.log('🏗️ Constructed unit data:', unitData);
    
    // Validate required fields
    if (!unitData.unitCode || !unitData.title || !unitData.credits) {
        console.error('❌ Validation failed: Missing required fields');
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    if (isNaN(unitData.credits) || unitData.credits <= 0) {
        console.error('❌ Validation failed: Invalid credits');
        showErrorMessage('Credits must be a positive number');
        return;
    }
    
    console.log('✅ Validation passed');
    
    // Disable submit button during submission
    const submitBtn = form.querySelector('#unit-submit-btn');
    const submitText = form.querySelector('#unit-submit-text');
    const originalText = submitText ? submitText.textContent : 'Add Unit';
    
    console.log('🔄 Disabling submit button...');
    
    try {
        submitBtn.disabled = true;
        submitText.textContent = isEditing ? 'Updating...' : 'Adding...';
        
        console.log('Submitting unit data:', unitData);
        console.log('Is editing?', isEditing);
        console.log('Unit ID:', unitId);
        
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        console.log('🔑 Token available?', !!token);
        console.log('🔑 Token length:', token ? token.length : 0);
        
        if (!token) {
            console.error('❌ No authentication token found');
            throw new Error('No authentication token found. Please login again.');
        }
        
        let response;
        if (isEditing) {
            console.log('✏️ Calling updateUnit API...');
            response = await unitsAPI.updateUnit(unitId, unitData);
        } else {
            console.log('➕ Calling createUnit API...');
            console.log('📤 About to call unitsAPI.createUnit with data:', unitData);
            response = await unitsAPI.createUnit(unitData);
        }
        
        console.log('API Response received:', response);
        
        // Check if the response indicates success
        if (!response || response.error) {
            const errorMsg = response?.error || 'Unknown error occurred';
            console.error('❌ API returned error:', errorMsg);
            throw new Error(errorMsg);
        }
        
        console.log('✅ Unit saved successfully:', response);
        
        // Show success message first
        showSuccessMessage(isEditing ? 'Unit updated successfully!' : 'Unit created successfully!');
        console.log('✅ Success message shown');
        
        // Close modal
        closeUnitModal();
        console.log('🚪 Modal closed');
        
        // Wait a brief moment before reloading to ensure the server has processed the request
        console.log('⏳ Waiting before reload...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload units
        console.log('🔄 Reloading units...');
        await loadAdminUnits();
        console.log('✅ Units reloaded successfully');
        
    } catch (error) {
        console.error('Detailed error saving unit:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        let errorMessage = 'Failed to save unit. Please try again.';
        
        if (error.message.includes('token') || error.message.includes('unauthorized')) {
            errorMessage = 'Authentication failed. Please login again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showErrorMessage(errorMessage);
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            console.log('🔓 Submit button re-enabled');
        }
        if (submitText) {
            submitText.textContent = originalText;
            console.log('📝 Submit text restored to:', originalText);
        }
        
        console.log('✅ Cleanup complete');
    }
    
    // Explicitly return false to prevent any form submission
    return false;
}

async function editUnit(unitId) {
    console.log('Edit unit called with ID:', unitId);
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/units/${unitId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch unit data');
        }
        
        const result = await response.json();
        const unit = result.data;
        console.log('Unit data loaded:', unit);
        
        // Populate form
        const form = document.getElementById('unit-form');
        const title = document.getElementById('unit-modal-title');
        const modal = document.getElementById('unit-modal');
        
        if (form && title && modal) {
            title.textContent = 'Edit Unit';
            form.setAttribute('data-unit-id', unitId);
            
            // Fill form fields
            document.getElementById('unit-code').value = unit.unitCode;
            document.getElementById('unit-title').value = unit.title;
            document.getElementById('unit-credits').value = unit.credits;
            document.getElementById('unit-description').value = unit.description || '';
            
            modal.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error loading unit for edit:', error);
        showErrorMessage('Failed to load unit data. Please try again.');
    }
}

async function deleteUnit(unitId) {
    console.log('Delete unit called with ID:', unitId);
    if (!confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/units/${unitId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete unit');
        }
        
        // Reload units
        loadAdminUnits();
        showSuccessMessage('Unit deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting unit:', error);
        showErrorMessage(error.message || 'Failed to delete unit. Please try again.');
    }
}

// Enrollment management
function approveEnrollment(enrollmentId) {
    // Implementation for approving enrollment
    console.log('Approve enrollment:', enrollmentId);
}

function rejectEnrollment(enrollmentId) {
    if (confirm('Are you sure you want to reject this enrollment?')) {
        // Implementation for rejecting enrollment
        console.log('Reject enrollment:', enrollmentId);
    }
}

function viewEnrollment(enrollmentId) {
    // Implementation for viewing enrollment details
    console.log('View enrollment:', enrollmentId);
}

// Notification CRUD operations
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
        title: titleElement,
        message: messageElement,
        type: typeElement
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
        console.log('notificationsAPI.createNotification available:', typeof notificationsAPI?.createNotification);
        
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
        
        alert('Notification created successfully!');
        
    } catch (error) {
        console.error('Error creating notification:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // More specific error messages
        if (error.message && error.message.includes('401')) {
            alert('Authentication failed. Please log in again.');
            window.location.href = '../LoginPage.html';
        } else if (error.message && error.message.includes('403')) {
            alert('You do not have permission to create notifications.');
        } else if (error.message && error.message.includes('500')) {
            alert('Server error. Please try again later.');
        } else {
            alert(`Failed to create notification: ${error.message || 'Unknown error'}`);
        }
    }
}

function editNotification(notificationId) {
    // Implementation for editing notification
    console.log('Edit notification:', notificationId);
}

function deleteNotification(notificationId) {
    if (confirm('Are you sure you want to delete this notification?')) {
        // Implementation for deleting notification
        console.log('Delete notification:', notificationId);
    }
}

// User management
function editUser(userId) {
    // Implementation for editing user
    console.log('Edit user:', userId);
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        // Implementation for deleting user
        console.log('Delete user:', userId);
    }
}

// Handle enrollment actions
function handleEnrollmentAction(action, enrollmentId) {
    switch(action) {
        case 'approve':
            approveEnrollment(enrollmentId);
            break;
        case 'reject':
            rejectEnrollment(enrollmentId);
            break;
        case 'view':
            viewEnrollment(enrollmentId);
            break;
        default:
            console.log('Unknown enrollment action:', action);
    }
}

// Handle user actions
function handleUserAction(action, userId) {
    switch(action) {
        case 'edit':
            editUser(userId);
            break;
        case 'delete':
            deleteUser(userId);
            break;
        case 'activate':
            // Implementation for activating user
            console.log('Activate user:', userId);
            break;
        case 'deactivate':
            // Implementation for deactivating user
            console.log('Deactivate user:', userId);
            break;
        default:
            console.log('Unknown user action:', action);
    }
}

// View student details function
function viewStudentDetails(studentId) {
    console.log('Viewing student details for ID:', studentId);
    console.log('Current adminData.enrollments:', adminData.enrollments);
    
    // Find the student in our data using the same logic as in populateAdminEnrollments
    const student = adminData.enrollments.find(enrollment => {
        const studentProfile = enrollment.studentProfile;
        const profileId = studentProfile?.id || studentProfile?.studentId;
        console.log('Checking enrollment profile ID:', profileId, 'against:', studentId);
        return profileId == studentId; // Use == to handle string/number comparison
    })?.studentProfile;
    
    console.log('Found student:', student);
    
    if (!student) {
        console.error('Student not found for ID:', studentId);
        console.log('Available enrollments:', adminData.enrollments.map(e => ({
            profileId: e.studentProfile?.id || e.studentProfile?.studentId,
            firstName: e.studentProfile?.firstName
        })));
        alert(`Student not found for ID: ${studentId}. Check console for available students.`);
        return;
    }
    
    // Find all enrollments for this student using the same logic
    const studentEnrollments = adminData.enrollments.filter(enrollment => {
        const studentProfile = enrollment.studentProfile;
        const profileId = studentProfile?.id || studentProfile?.studentId;
        return profileId == studentId;
    });
    
    // Create modal content
    const modalContent = `
        <div class="modal-overlay" id="student-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Student Details</h3>
                    <button class="close-modal" onclick="closeStudentDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="student-details">
                        <h4>Personal Information</h4>
                        <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
                        <p><strong>Student ID:</strong> ${student.studentId || student.id}</p>
                        <p><strong>Email:</strong> ${student.emailAddress || 'N/A'}</p>
                        <p><strong>Year Level:</strong> ${student.yearLevel || 'Year 1'}</p>
                        
                        <h4>Enrollment Information</h4>
                        <p><strong>Total Enrollments:</strong> ${studentEnrollments.length}</p>
                        <p><strong>Units Enrolled:</strong></p>
                        <ul>
                            ${studentEnrollments.map(enrollment => {
                                const semesterName = enrollment.semester?.name || 'Unknown Semester';
                                return `<li>${enrollment.unit?.title || 'Unknown Unit'} - ${semesterName}</li>`;
                            }).join('')}
                        </ul>
                        
                        <h4>Semester Details</h4>
                        ${(() => {
                            // Group enrollments by semester
                            const semesterGroups = {};
                            studentEnrollments.forEach(enrollment => {
                                const semesterId = enrollment.semesterId || 'unknown';
                                const semesterName = enrollment.semester?.name || 'Unknown Semester';
                                if (!semesterGroups[semesterId]) {
                                    semesterGroups[semesterId] = {
                                        name: semesterName,
                                        units: []
                                    };
                                }
                                semesterGroups[semesterId].units.push(enrollment.unit?.title || 'Unknown Unit');
                            });
                            
                            return Object.values(semesterGroups).map(semester => `
                                <div class="semester-info">
                                    <strong>${semester.name}:</strong> ${semester.units.join(', ')}
                                </div>
                            `).join('');
                        })()}
                        
                        <h4>Availability Slots</h4>
                        ${studentEnrollments.map(enrollment => {
                            const availabilities = enrollment.availabilities || [];
                            return `
                                <div class="unit-availability">
                                    <strong>${enrollment.unit?.title || 'Unknown Unit'}:</strong>
                                    ${availabilities.length > 0 ? 
                                        availabilities.map(avail => {
                                            const dayName = avail.day?.name || avail.day?.shortName || 'Unknown Day';
                                            const startTime = avail.timeSlot?.startTime || 'Unknown Time';
                                            const endTime = avail.timeSlot?.endTime || 'Unknown Time';
                                            return `<span class="availability-slot">${dayName} ${startTime}-${endTime}</span>`;
                                        }).join(' ') : 
                                        'No availability selected'
                                    }
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" onclick="closeStudentDetailsModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

// Make function globally accessible
window.viewStudentDetails = viewStudentDetails;

// Close student details modal
function closeStudentDetailsModal() {
    const modal = document.getElementById('student-details-modal');
    if (modal) {
        modal.remove();
    }
}

// Approve student enrollment
function approveStudentEnrollment(studentId) {
    console.log('Approving enrollment for student:', studentId);
    // Implementation for approving enrollment
    alert('Enrollment approved successfully!');
    closeStudentDetailsModal();
}

// Export enrollment data to CSV
function exportEnrollmentData() {
    try {
        console.log('Exporting enrollment data...');
        
        if (!adminData.enrollments || adminData.enrollments.length === 0) {
            alert('No enrollment data available to export.');
            return;
        }
        
        // Prepare CSV headers
        const headers = [
            'Student ID',
            'Student Name', 
            'Email',
            'Program',
            'Year Level',
            'Unit Code',
            'Unit Title',
            'Credits',
            'Enrollment Status',
            'Enrollment Date'
        ];
        
        // Prepare CSV data
        const csvData = adminData.enrollments.map(enrollment => {
            // Find student data
            const student = adminData.users.find(user => user.id === enrollment.studentId);
            const studentProfile = student?.studentProfile;
            
            // Find unit data
            const unit = adminData.units.find(unit => unit.id === enrollment.unitId);
            
            return [
                studentProfile?.studentId || 'N/A',
                studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : (student?.email?.split('@')[0] || 'N/A'),
                student?.email || 'N/A',
                studentProfile?.program || 'N/A',
                studentProfile?.yearLevel || 'N/A',
                unit?.unitCode || 'N/A',
                unit?.title || 'N/A',
                unit?.credits || 'N/A',
                enrollment.status || 'PENDING',
                enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString() : 'N/A'
            ];
        });
        
        // Combine headers and data
        const allData = [headers, ...csvData];
        
        // Convert to CSV string
        const csvContent = allData.map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with current date
            const currentDate = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `enrollment_data_${currentDate}.csv`);
            
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('CSV export completed successfully');
            alert(`Enrollment data exported successfully! ${adminData.enrollments.length} records exported.`);
        } else {
            alert('CSV export is not supported in this browser.');
        }
        
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Failed to export data. Please try again.');
    }
}

// Make functions globally accessible
window.closeStudentDetailsModal = closeStudentDetailsModal;
window.approveStudentEnrollment = approveStudentEnrollment;

// Unit management functions
function editUnit(unitId) {
    console.log('Editing unit:', unitId);
    
    // Find the unit data
    const unit = adminData.units.find(u => u.id == unitId);
    if (!unit) {
        alert('Unit not found');
        return;
    }
    
    // Create edit modal content
    const modalContent = `
        <div class="modal-overlay" id="edit-unit-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Unit</h3>
                    <button class="close-modal" onclick="closeEditUnitModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-unit-form">
                        <div class="form-group">
                            <label for="edit-unit-code">Unit Code</label>
                            <input type="text" id="edit-unit-code" name="unitCode" value="${unit.unitCode}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-unit-title">Unit Title</label>
                            <input type="text" id="edit-unit-title" name="title" value="${unit.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-unit-credits">Credits</label>
                            <input type="number" id="edit-unit-credits" name="credits" value="${unit.credits}" min="1" max="10" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-unit-description">Description</label>
                            <textarea id="edit-unit-description" name="description" rows="4">${unit.description || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" onclick="closeEditUnitModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveUnitChanges('${unitId}')">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

// Close edit unit modal
function closeEditUnitModal() {
    const modal = document.getElementById('edit-unit-modal');
    if (modal) {
        modal.remove();
    }
}

// Save unit changes
async function saveUnitChanges(unitId) {
    const form = document.getElementById('edit-unit-form');
    const formData = new FormData(form);
    
    const unitData = {
        unitCode: formData.get('unitCode'),
        title: formData.get('title'),
        credits: parseInt(formData.get('credits')),
        description: formData.get('description')
    };
    
    try {
        console.log('Saving unit changes:', unitData);
        
        // Call the API to update the unit
        const response = await fetch(`http://localhost:5001/api/units/${unitId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(unitData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update unit');
        }
        
        const result = await response.json();
        console.log('Unit updated successfully:', result);
        
        // Update the local data
        const unitIndex = adminData.units.findIndex(u => u.id == unitId);
        if (unitIndex !== -1) {
            adminData.units[unitIndex] = { ...adminData.units[unitIndex], ...unitData };
        }
        
        // Refresh the units display
        populateAdminUnits();
        
        // Close the modal
        closeEditUnitModal();
        
        alert('Unit updated successfully!');
        
    } catch (error) {
        console.error('Error updating unit:', error);
        alert('Failed to update unit. Please try again.');
    }
}

function deleteUnit(unitId) {
    console.log('Deleting unit:', unitId);
    if (confirm('Are you sure you want to delete this unit?')) {
        alert('Delete unit functionality not implemented yet');
    }
}

// Make unit functions globally accessible
window.editUnit = editUnit;
window.deleteUnit = deleteUnit;
window.closeEditUnitModal = closeEditUnitModal;
window.saveUnitChanges = saveUnitChanges;

// Make export function globally accessible
window.exportEnrollmentData = exportEnrollmentData;

// Make notification functions globally accessible
window.showAddNotificationModal = showAddNotificationModal;
window.closeAddNotificationModal = closeAddNotificationModal;
window.createNotification = createNotification;
window.editNotification = editNotification;
window.deleteNotification = deleteNotification;

// Semester Management Functions
let semesters = [];
let currentSemesterPage = 1;
const semesterPageSize = 10;

// Initialize semester functionality
function initializeSemesterManagement() {
    console.log('Initializing semester management');
    loadSemesters();
}

// Load semesters
async function loadSemesters(page = 1, filters = {}) {
    try {
        console.log('Loading semesters...');
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No auth token found');
            return;
        }

        const queryParams = new URLSearchParams({
            page: page,
            limit: semesterPageSize,
            ...filters
        });

        const response = await fetch(`http://localhost:5001/api/semesters?${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Semesters loaded:', data);
        
        // Handle the API response structure
        const semesterData = {
            semesters: data.data || [],
            pagination: data.pagination || {}
        };
        
        semesters = semesterData.semesters;
        currentSemesterPage = page;
        
        populateSemesters(semesterData);
        updateSemesterPagination(semesterData.pagination);
        
    } catch (error) {
        console.error('Error loading semesters:', error);
        showErrorMessage('Failed to load semesters. Please try again.');
    }
}

// Populate semester table
function populateSemesters(data) {
    const tableBody = document.getElementById('semesters-table-body');
    if (!tableBody) {
        console.error('Semester table body not found');
        return;
    }

    tableBody.innerHTML = '';

    if (!data.semesters || data.semesters.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    No semesters found
                </td>
            </tr>
        `;
        return;
    }

    data.semesters.forEach(semester => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const enrollmentCount = semester._count?.enrollments || 0;
        const enrollmentPeriod = semester.enrollmentStart && semester.enrollmentEnd 
            ? `${new Date(semester.enrollmentStart).toLocaleDateString()} - ${new Date(semester.enrollmentEnd).toLocaleDateString()}`
            : 'Not set';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${semester.name}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${semester.academicYear}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${semester.semesterNumber}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(semester.startDate).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(semester.endDate).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${enrollmentPeriod}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editSemester(${semester.id})" 
                        class="text-indigo-600 hover:text-indigo-900 mr-3 px-3 py-1 border rounded">
                    Edit
                </button>
                <button onclick="deleteSemester(${semester.id})" 
                        class="text-red-600 hover:text-red-900 px-3 py-1 border rounded">
                    Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Get status class for styling
function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'upcoming':
            return 'bg-blue-100 text-blue-800';
        case 'completed':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Update pagination
function updateSemesterPagination(pagination) {
    const paginationContainer = document.getElementById('semesterPagination');
    if (!paginationContainer || !pagination) return;

    const { page, totalPages, total } = pagination;
    
    paginationContainer.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
                Showing page ${page} of ${totalPages} (${total} total)
            </div>
            <div class="flex space-x-2">
                <button onclick="loadSemesters(${page - 1})" 
                        ${page <= 1 ? 'disabled' : ''} 
                        class="px-3 py-1 border rounded ${page <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    Previous
                </button>
                <button onclick="loadSemesters(${page + 1})" 
                        ${page >= totalPages ? 'disabled' : ''} 
                        class="px-3 py-1 border rounded ${page >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    Next
                </button>
            </div>
        </div>
    `;
}

// Test function to debug semester form
function testSemesterForm() {
    console.log('🧪 Testing semester form...');
    
    const form = document.getElementById('semester-form');
    console.log('1️⃣ Semester form exists:', !!form);
    
    if (form) {
        const inputs = {
            name: form.querySelector('[name="name"]'),
            academicYear: form.querySelector('[name="academicYear"]'),
            semesterNumber: form.querySelector('[name="semesterNumber"]'),
            startDate: form.querySelector('[name="startDate"]'),
            endDate: form.querySelector('[name="endDate"]'),
            enrollmentStart: form.querySelector('[name="enrollmentStart"]'),
            enrollmentEnd: form.querySelector('[name="enrollmentEnd"]')
        };
        
        console.log('2️⃣ Form inputs:');
        Object.entries(inputs).forEach(([key, input]) => {
            console.log(`  ${key}:`, !!input, input ? `(id: ${input.id})` : '');
        });
        
        // Fill with test data
        if (inputs.name) inputs.name.value = 'Test Semester 2025-1';
        if (inputs.academicYear) inputs.academicYear.value = '2025';
        if (inputs.semesterNumber) inputs.semesterNumber.value = '1';
        if (inputs.startDate) inputs.startDate.value = '2025-02-01';
        if (inputs.endDate) inputs.endDate.value = '2025-06-30';
        
        console.log('3️⃣ Test data filled');
        
        // Test form data collection
        const formData = new FormData(form);
        console.log('4️⃣ FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: "${value}"`);
        }
    }
}

// Add to window for easy testing
window.testSemesterForm = testSemesterForm;

// Show add semester modal
function showAddSemesterModal() {
    const modal = document.getElementById('semester-modal');
    const form = document.getElementById('semester-form');
    const title = document.getElementById('semester-modal-title');
    
    if (modal && form && title) {
        title.textContent = 'Add New Semester';
        form.reset();
        form.removeAttribute('data-semester-id');
        modal.style.display = 'flex';
    }
}

// Close semester modal
function closeSemesterModal() {
    const modal = document.getElementById('semester-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle semester form submission
async function handleSemesterSubmit(event) {
    event.preventDefault();
    
    console.log('🚀 Semester form submission started');
    
    const submitButton = document.getElementById('semester-submit-btn');
    const submitText = document.getElementById('semester-submit-text');
    
    console.log('🔘 Submit button found:', !!submitButton);
    console.log('📝 Submit text element found:', !!submitText);
    
    if (submitButton) {
        submitButton.disabled = true;
        if (submitText) {
            submitText.textContent = 'Saving...';
        }
    }
    
    try {
        const form = event.target;
        const semesterId = form.getAttribute('data-semester-id');
        const isEditing = !!semesterId;
        
        console.log('📋 Semester ID from form:', semesterId);
        console.log('🔄 Is editing mode:', isEditing);
        
        const formData = new FormData(form);
        
        // Debug form data
        console.log('📋 Form data entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: "${value}"`);
        }
        
        const semesterData = {
            name: formData.get('name')?.trim(),
            academicYear: parseInt(formData.get('academicYear')),
            semesterNumber: parseInt(formData.get('semesterNumber')),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            enrollmentStart: formData.get('enrollmentStart') || null,
            enrollmentEnd: formData.get('enrollmentEnd') || null
        };
        
        console.log('🏗️ Constructed semester data:', semesterData);
        
        // Debug validation - check each field individually
        console.log('🔍 Validation checks:');
        console.log('  Name:', semesterData.name, '- Valid:', !!semesterData.name);
        console.log('  Academic Year:', semesterData.academicYear, '- Valid:', !isNaN(semesterData.academicYear) && semesterData.academicYear > 0);
        console.log('  Semester Number:', semesterData.semesterNumber, '- Valid:', !isNaN(semesterData.semesterNumber) && semesterData.semesterNumber > 0);
        console.log('  Start Date:', semesterData.startDate, '- Valid:', !!semesterData.startDate);
        console.log('  End Date:', semesterData.endDate, '- Valid:', !!semesterData.endDate);
        
        // Validate required fields with detailed messages
        if (!semesterData.name || semesterData.name.length === 0) {
            console.error('❌ Validation failed: Missing or empty name');
            showErrorMessage('Semester name is required and cannot be empty');
            return;
        }
        
        if (!semesterData.academicYear || isNaN(semesterData.academicYear) || semesterData.academicYear < 2020 || semesterData.academicYear > 2050) {
            console.error('❌ Validation failed: Invalid academic year:', semesterData.academicYear);
            showErrorMessage('Academic year must be a valid year between 2020 and 2050');
            return;
        }
        
        if (!semesterData.semesterNumber || isNaN(semesterData.semesterNumber) || semesterData.semesterNumber < 1 || semesterData.semesterNumber > 3) {
            console.error('❌ Validation failed: Invalid semester number:', semesterData.semesterNumber);
            showErrorMessage('Please select a valid semester number (1, 2, or 3)');
            return;
        }
        
        if (!semesterData.startDate || semesterData.startDate === '') {
            console.error('❌ Validation failed: Missing start date');
            showErrorMessage('Start date is required');
            return;
        }
        
        if (!semesterData.endDate || semesterData.endDate === '') {
            console.error('❌ Validation failed: Missing end date');
            showErrorMessage('End date is required');
            return;
        }
        
        // Validate date logic
        const startDate = new Date(semesterData.startDate);
        const endDate = new Date(semesterData.endDate);
        
        // Check if dates are valid
        if (isNaN(startDate.getTime())) {
            console.error('❌ Validation failed: Invalid start date');
            showErrorMessage('Start date is invalid. Please check the date format.');
            return;
        }
        
        if (isNaN(endDate.getTime())) {
            console.error('❌ Validation failed: Invalid end date');
            showErrorMessage('End date is invalid. Please check the date format.');
            return;
        }
        
        if (startDate >= endDate) {
            console.error('❌ Validation failed: End date must be after start date');
            showErrorMessage('End date must be after start date');
            return;
        }
        
        // Validate enrollment dates if provided
        if (semesterData.enrollmentStart) {
            const enrollmentStartDate = new Date(semesterData.enrollmentStart);
            if (isNaN(enrollmentStartDate.getTime())) {
                console.error('❌ Validation failed: Invalid enrollment start date');
                showErrorMessage('Enrollment start date is invalid. Please check the date format.');
                return;
            }
        }
        
        if (semesterData.enrollmentEnd) {
            const enrollmentEndDate = new Date(semesterData.enrollmentEnd);
            if (isNaN(enrollmentEndDate.getTime())) {
                console.error('❌ Validation failed: Invalid enrollment end date');
                showErrorMessage('Enrollment end date is invalid. Please check the date format.');
                return;
            }
        }
        
        console.log('✅ Validation passed');
        
        const token = localStorage.getItem('token');
        const url = isEditing 
            ? `http://localhost:5001/api/semesters/${semesterId}`
            : 'http://localhost:5001/api/semesters';
        
        console.log('🌐 Making API call to:', url);
        console.log('📤 Sending data:', JSON.stringify(semesterData, null, 2));
        console.log('🔄 Method:', isEditing ? 'PUT' : 'POST');
        console.log('🔑 Token available:', !!token);
        
        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(semesterData)
        });
        
        console.log('📡 Response received - Status:', response.status, 'OK:', response.ok);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get response text first
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);
        
        if (!response.ok) {
            let errorMessage = 'Failed to save semester';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorMessage;
                console.error('❌ Server error details:', errorData);
            } catch (parseError) {
                console.error('❌ Could not parse error response:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('✅ Parsed response data:', result);
        } catch (parseError) {
            console.error('❌ Could not parse success response:', parseError);
            throw new Error('Invalid response format from server');
        }
        
        console.log('✅ Semester saved successfully!');
        
        // Reload semesters and close modal
        await loadSemesters(currentSemesterPage);
        closeSemesterModal();
        
        showSuccessMessage(isEditing ? 'Semester updated successfully!' : 'Semester created successfully!');
        
    } catch (error) {
        console.error('💥 Error saving semester:', error);
        showErrorMessage(error.message || 'Failed to save semester. Please try again.');
    } finally {
        // Re-enable button
        if (submitButton) {
            submitButton.disabled = false;
            if (submitText) {
                submitText.textContent = semesterId && semesterId !== '' ? 'Update Semester' : 'Create Semester';
            }
        }
    }
}

// Helper function to fix invalid dates (like June 31st -> June 30th)
function fixInvalidDate(dateString) {
    console.log('🔧 Attempting to fix invalid date:', dateString);
    
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[2]);
    
    console.log('📅 Original date parts:', { year, month, day });
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    console.log('📅 Last day of month', month, 'is:', lastDayOfMonth);
    
    // If day is greater than the last day of the month, set it to the last day
    if (day > lastDayOfMonth) {
        console.log(`⚠️ Day ${day} is invalid for month ${month}, changing to ${lastDayOfMonth}`);
        day = lastDayOfMonth;
    }
    
    const fixedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    console.log('✅ Fixed date:', fixedDate);
    
    // Verify the fixed date is valid
    const testDate = new Date(fixedDate);
    if (isNaN(testDate.getTime())) {
        console.error('❌ Fixed date is still invalid, using current date');
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
    
    return fixedDate;
}

// Edit semester
async function editSemester(semesterId) {
    console.log('🔧 Edit semester called with ID:', semesterId);
    try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token available:', !!token);
        
        const response = await fetch(`http://localhost:5001/api/semesters/${semesterId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch semester data: ${response.status}`);
        }
        
        const result = await response.json();
        const semester = result.data; // Extract semester from API response
        console.log('📋 Semester data loaded:', semester);
        
        // Check if form elements exist
        const form = document.getElementById('semester-form');
        const title = document.getElementById('semester-modal-title');
        const modal = document.getElementById('semester-modal');
        
        console.log('🏗️ Form elements found:', {
            form: !!form,
            title: !!title,
            modal: !!modal
        });
        
        if (form && title && modal) {
            title.textContent = 'Edit Semester';
            form.setAttribute('data-semester-id', semesterId);
            
            console.log('📝 Setting form data-semester-id to:', semesterId);
            
            // Fill form fields
            const fields = {
                'semester-name': semester.name,
                'semester-academic-year': semester.academicYear,
                'semester-number': semester.semesterNumber,
                'semester-start-date': semester.startDate ? semester.startDate.split('T')[0] : '',
                'semester-end-date': semester.endDate ? semester.endDate.split('T')[0] : '',
                'semester-enrollment-start': semester.enrollmentStart ? semester.enrollmentStart.split('T')[0] : '',
                'semester-enrollment-end': semester.enrollmentEnd ? semester.enrollmentEnd.split('T')[0] : ''
            };
            
            console.log('🏷️ Field values to set:', fields);
            console.log('📅 Date debugging:');
            console.log('  Raw startDate:', semester.startDate);
            console.log('  Raw endDate:', semester.endDate);
            console.log('  Processed startDate:', fields['semester-start-date']);
            console.log('  Processed endDate:', fields['semester-end-date']);
            
            // Validate and fix invalid dates before setting
            const startDateValue = fields['semester-start-date'];
            const endDateValue = fields['semester-end-date'];
            
            if (startDateValue) {
                const startDate = new Date(startDateValue);
                console.log('  Start date object:', startDate);
                console.log('  Start date valid:', !isNaN(startDate.getTime()));
                
                // If invalid date, try to fix it
                if (isNaN(startDate.getTime())) {
                    console.log('⚠️ Invalid start date detected, attempting to fix...');
                    const fixedDate = fixInvalidDate(startDateValue);
                    fields['semester-start-date'] = fixedDate;
                    console.log('✅ Fixed start date to:', fixedDate);
                }
            }
            
            if (endDateValue) {
                const endDate = new Date(endDateValue);
                console.log('  End date object:', endDate);
                console.log('  End date valid:', !isNaN(endDate.getTime()));
                
                // If invalid date, try to fix it
                if (isNaN(endDate.getTime())) {
                    console.log('⚠️ Invalid end date detected, attempting to fix...');
                    const fixedDate = fixInvalidDate(endDateValue);
                    fields['semester-end-date'] = fixedDate;
                    console.log('✅ Fixed end date to:', fixedDate);
                }
            }
            
            // Set each field and verify
            Object.entries(fields).forEach(([fieldId, value]) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    console.log(`✅ Set ${fieldId} = "${value}"`);
                    
                    // Special debugging for date fields
                    if (field.type === 'date') {
                        console.log(`📅 Date field ${fieldId}:`);
                        console.log(`  Value set: "${field.value}"`);
                        console.log(`  Value length: ${field.value.length}`);
                        console.log(`  Validity: ${field.checkValidity()}`);
                        if (!field.checkValidity()) {
                            console.log(`  Validation message: "${field.validationMessage}"`);
                        }
                        
                        // Try to create a Date object from the value
                        try {
                            const dateObj = new Date(field.value);
                            console.log(`  Date object: ${dateObj}`);
                            console.log(`  Date valid: ${!isNaN(dateObj.getTime())}`);
                        } catch (e) {
                            console.log(`  Date creation error: ${e.message}`);
                        }
                    }
                    
                    // Check if field passes HTML5 validation
                    if (field.checkValidity) {
                        const isValid = field.checkValidity();
                        console.log(`🔍 ${fieldId} validation: ${isValid ? 'VALID' : 'INVALID'}`);
                        if (!isValid) {
                            console.log(`❌ ${fieldId} validation message: ${field.validationMessage}`);
                        }
                    }
                } else {
                    console.error(`❌ Field not found: ${fieldId}`);
                }
            });
            
            // Check form validity after all fields are set
            setTimeout(() => {
                const form = document.getElementById('semester-form');
                if (form && form.checkValidity) {
                    const formValid = form.checkValidity();
                    console.log(`📋 Overall form validity: ${formValid ? 'VALID' : 'INVALID'}`);
                    if (!formValid) {
                        console.log('❌ Form validation issues detected');
                        // Report each invalid field
                        const invalidFields = form.querySelectorAll(':invalid');
                        invalidFields.forEach(field => {
                            console.log(`❌ Invalid field: ${field.id || field.name} - ${field.validationMessage}`);
                        });
                    }
                }
            }, 100);
            
            // Update submit button text
            const submitText = document.getElementById('semester-submit-text');
            if (submitText) {
                submitText.textContent = 'Update Semester';
                console.log('🔄 Updated submit button text');
            }
            
            // Add click handler for debugging
            const submitButton = document.getElementById('semester-submit-btn');
            if (submitButton) {
                submitButton.onclick = function(event) {
                    console.log('🖱️ Submit button clicked!');
                    const form = document.getElementById('semester-form');
                    if (form) {
                        console.log('📋 Form found, checking validity...');
                        const isValid = form.checkValidity();
                        console.log('📋 Form validity:', isValid);
                        
                        if (!isValid) {
                            console.log('❌ Form is invalid, checking individual fields:');
                            const invalidFields = form.querySelectorAll(':invalid');
                            invalidFields.forEach(field => {
                                console.log(`❌ Invalid field: ${field.id || field.name} - ${field.validationMessage}`);
                            });
                            form.reportValidity(); // This will show browser validation messages
                        } else {
                            console.log('✅ Form is valid, should submit normally');
                        }
                    }
                };
            }
            
            modal.style.display = 'flex';
            console.log('👁️ Modal displayed');
        } else {
            console.error('❌ Missing required form elements');
        }
        
    } catch (error) {
        console.error('💥 Error loading semester for edit:', error);
        showErrorMessage('Failed to load semester data. Please try again.');
    }
}

// Delete semester
async function deleteSemester(semesterId) {
    console.log('Delete semester called with ID:', semesterId);
    if (!confirm('Are you sure you want to delete this semester? This action cannot be undone.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/semesters/${semesterId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete semester');
        }
        
        // Reload semesters
        loadSemesters(currentSemesterPage);
        showSuccessMessage('Semester deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting semester:', error);
        showErrorMessage(error.message || 'Failed to delete semester. Please try again.');
    }
}

// Filter semesters
function filterSemesters() {
    const searchInput = document.getElementById('semester-search');
    const searchTerm = searchInput ? normalizeSearchText(searchInput.value) : '';
    
    console.log('🔍 Filtering semesters with search term:', searchTerm);
    
    const filters = {};
    
    if (searchTerm) {
        filters.search = searchTerm;
    }
    
    // Update search results count display
    if (searchTerm) {
        // Count matches in current data for immediate feedback
        const currentSemesters = document.querySelectorAll('.semester-row');
        const matchingCount = Array.from(currentSemesters).filter(row => {
            const text = normalizeSearchText(row.textContent);
            return text.includes(searchTerm);
        }).length;
        
        updateSearchResultsCount('semesters', matchingCount, searchTerm);
    } else {
        updateSearchResultsCount('semesters', 0, '');
    }
    
    loadSemesters(1, filters);
}

// Show success message
function showSuccessMessage(message) {
    // You can implement a toast notification here
    alert(message);
}

// Show error message
function showErrorMessage(message) {
    // You can implement a toast notification here
    alert(message);
}

// Make semester functions globally accessible
window.showAddSemesterModal = showAddSemesterModal;
window.closeSemesterModal = closeSemesterModal;
window.handleSemesterSubmit = handleSemesterSubmit;
window.editSemester = editSemester;
window.deleteSemester = deleteSemester;
window.filterSemesters = filterSemesters;
window.loadSemesters = loadSemesters;
window.initializeSemesterManagement = initializeSemesterManagement;

// Make unit functions globally accessible
window.showAddUnitModal = showAddUnitModal;
window.closeUnitModal = closeUnitModal;
window.handleUnitSubmit = handleUnitSubmit;
window.editUnit = editUnit;
window.deleteUnit = deleteUnit;

// Debug function for testing
window.testModal = function() {
    console.log('Testing modal from console...');
    showAddUnitModal();
};
