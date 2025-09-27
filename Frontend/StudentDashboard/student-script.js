// Student Dashboard Script

// Add test function for semester loading - declare immediately
async function testSemesterLoad() {
  console.log('=== TESTING SEMESTER LOAD ===');
  try {
    const response = await fetch('http://localhost:5001/api/semesters');
    console.log('Response:', response);
    const data = await response.json();
    console.log('Data:', data);
    
    const semesterSelect = document.getElementById('enrollment-semester');
    console.log('Semester select element:', semesterSelect);
    
    if (semesterSelect) {
      semesterSelect.innerHTML = '<option value="">Select a semester</option>';
      if (data.success && Array.isArray(data.data)) {
        data.data.forEach(semester => {
          const option = document.createElement('option');
          option.value = semester.id;
          option.textContent = `${semester.name} (${semester.academicYear} - Semester ${semester.semesterNumber})`;
          semesterSelect.appendChild(option);
        });
        console.log('Semester dropdown populated successfully!');
        alert('Semester dropdown populated! Check the dropdown.');
      } else {
        console.error('Invalid data format:', data);
        alert('Error: Invalid data format received from server');
      }
    } else {
      console.error('Semester select element not found!');
      alert('Error: Semester select element not found!');
    }
  } catch (error) {
    console.error('Error in test:', error);
    alert('Error loading semesters: ' + error.message);
  }
}

// Load available semesters for enrollment - declare immediately
async function loadAvailableSemesters() {
  console.log('=== loadAvailableSemesters function called ===');
  try {
    console.log('Loading available semesters...');
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const response = await fetch('http://localhost:5001/api/semesters', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const semesters = result.data || [];
    
    console.log('Loaded semesters:', semesters);
    
    // Populate semester dropdown
    const semesterSelect = document.getElementById('enrollment-semester');
    console.log('Semester select element:', semesterSelect);
    console.log('Semesters array:', semesters);
    console.log('Is semesters array?', Array.isArray(semesters));
    
    if (semesterSelect && Array.isArray(semesters)) {
      console.log('About to populate semester dropdown...');
      // Clear existing options except the first one
      semesterSelect.innerHTML = '<option value="">Select a semester</option>';
      
      // Get current date to determine which semesters are available for enrollment
      const currentDate = new Date();
      
      // Add semester options
      semesters.forEach(semester => {
        const startDate = new Date(semester.startDate);
        const endDate = new Date(semester.endDate);
        const enrollmentStart = semester.enrollmentStart ? new Date(semester.enrollmentStart) : null;
        const enrollmentEnd = semester.enrollmentEnd ? new Date(semester.enrollmentEnd) : null;
        
        // Check if enrollment is currently open
        let isEnrollmentOpen = true;
        let statusText = '';
        
        if (enrollmentStart && enrollmentEnd) {
          isEnrollmentOpen = currentDate >= enrollmentStart && currentDate <= enrollmentEnd;
          if (currentDate < enrollmentStart) {
            statusText = ` (Enrollment opens ${enrollmentStart.toLocaleDateString()})`;
          } else if (currentDate > enrollmentEnd) {
            statusText = ' (Enrollment closed)';
            isEnrollmentOpen = false;
          }
        } else if (currentDate > endDate) {
          statusText = ' (Semester ended)';
          isEnrollmentOpen = false;
        }
        
        const option = document.createElement('option');
        option.value = semester.id;
        option.textContent = `${semester.name} (${semester.academicYear} - Semester ${semester.semesterNumber})${statusText}`;
        option.disabled = !isEnrollmentOpen;
        
        semesterSelect.appendChild(option);
      });
      
      // Auto-select the first available semester if any
      const availableOptions = Array.from(semesterSelect.options).filter(opt => !opt.disabled && opt.value);
      if (availableOptions.length > 0) {
        semesterSelect.value = availableOptions[0].value;
      }
    }
    
  } catch (error) {
    console.error('Error loading semesters:', error);
    
    // Show error message in semester dropdown
    const semesterSelect = document.getElementById('enrollment-semester');
    if (semesterSelect) {
      semesterSelect.innerHTML = '<option value="">Error loading semesters</option>';
    }
  }
}

// Make functions available globally immediately
window.testSemesterLoad = testSemesterLoad;
window.loadAvailableSemesters = loadAvailableSemesters;

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Student Dashboard initializing...');
    
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = '../LoginPage.html';
        return;
    }
    
    try {
        // Load user data
        await loadUserData();
        
        // Setup logout functionality
        setupLogoutHandler();
        
        // Initialize the app
        await initializeApp();
        
        console.log('Student Dashboard initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Setup logout functionality
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logout-btn');
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

// Load user data from token/localStorage
async function loadUserData() {
    console.log('Loading user data...');
    try {
        const user = getCurrentUser();
        console.log('Current user:', user);
        
        if (user) {
            // Handle cases where firstName/lastName might be undefined
            const firstName = user.studentProfile.firstName || 'Student';
            const lastName = user.studentProfile.lastName || '';
            const displayName = `${firstName} ${lastName}`.trim();
            
            console.log('Updating user display:', displayName);
            
            const userNameEl = document.getElementById('user-name');
            const userIdEl = document.getElementById('user-id');
            
            if (userNameEl) userNameEl.textContent = displayName || 'Student';
            if (userIdEl) userIdEl.textContent = `Student ID: ${user.studentProfile.studentId || 'N/A'}`;
            
            // Update welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome back, ${firstName} ${lastName}!`;
            }
            
            // Load profile data from cached user
            loadProfileData(user);
        } else {
            console.warn('No user data found');
        }
        
        // Try to get fresh profile data
        try {
            console.log('Fetching fresh profile data...');
            const profile = await authAPI.getProfile();
            if (profile) {
                console.log('Fresh profile loaded:', profile);
                loadProfileData(profile);
            }
        } catch (profileError) {
            console.log('Could not fetch fresh profile, using cached data:', profileError.message);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback display
        const userNameEl = document.getElementById('user-name');
        const userIdEl = document.getElementById('user-id');
        if (userNameEl) userNameEl.textContent = 'Student';
        if (userIdEl) userIdEl.textContent = 'Student ID: N/A';
    }
}

// Load profile data into profile tab
function loadProfileData(user) {
    if (!user) return;
    
    try {
        // Update profile fields
        const fullName = `${user.studentProfile.firstName || ''} ${user.studentProfile.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Student';
        document.getElementById('profile-full-name').textContent = fullName;
        
        document.getElementById('profile-student-id').textContent = user.studentProfile.studentId || user.id || 'N/A';
        document.getElementById('profile-email').innerHTML = `
            <i data-lucide="mail" class="w-4 h-4 mr-2 text-gray-400"></i>
            ${user.studentProfile.emailAddress || 'Not provided'}
        `;
        
        // Phone number - check if available
        const phoneElement = document.getElementById('profile-phone');
        if (user.studentProfile.phone) {
            phoneElement.innerHTML = `
                <i data-lucide="phone" class="w-4 h-4 mr-2 text-gray-400"></i>
                ${user.studentProfile.phone}
            `;
        } else {
            phoneElement.innerHTML = `
                <i data-lucide="phone" class="w-4 h-4 mr-2 text-gray-400"></i>
                Not provided
            `;
        }
        
        // Role
        document.getElementById('profile-role').innerHTML = `
            <i data-lucide="user" class="w-4 h-4 mr-2 text-gray-400"></i>
            ${user.role || 'Student'}
        `;
        
        // Join date
        const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
        document.getElementById('profile-join-date').textContent = joinDate;
        
        // Update profile overview section
        updateProfileOverview(user);
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Update profile overview section with user data
function updateProfileOverview(user) {
    try {
        // Update profile overview name
        const fullName = `${user.studentProfile.firstName || ''} ${user.studentProfile.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Student';
        const profileOverviewNameEl = document.getElementById('profile-overview-name');
        if (profileOverviewNameEl) {
            profileOverviewNameEl.textContent = fullName;
        }
        
        // Update profile overview student ID
        const profileOverviewStudentIdEl = document.getElementById('profile-overview-student-id');
        if (profileOverviewStudentIdEl) {
            profileOverviewStudentIdEl.textContent = `Student ID: ${user.studentProfile.studentId ||  'N/A'}`;
        }
        
        // Update profile overview year
        const profileOverviewYearEl = document.getElementById('profile-overview-year');
        if (profileOverviewYearEl) {
            // Get year level from studentProfile or default to Year 1
            const yearLevel = user.studentProfile?.yearLevel || user.yearLevel || 1;
            profileOverviewYearEl.textContent = `Year ${yearLevel}`;
        }
        
        // Update profile overview credits (will be updated when enrollments are loaded)
        updateProfileOverviewCredits();
        
        console.log('Profile overview updated successfully');
    } catch (error) {
        console.error('Error updating profile overview:', error);
    }
}

// Update profile overview credits based on current enrollments
function updateProfileOverviewCredits() {
    try {
        const profileOverviewCreditsEl = document.getElementById('profile-overview-credits');
        if (profileOverviewCreditsEl) {
            // Calculate total credits from enrollments
            const totalCredits = enrollments.reduce((sum, enrollment) => {
                const unit = enrollment.unit || {};
                return sum + (parseInt(unit.credits) || 0);
            }, 0);
            
            // Assuming 120 is the total credits needed for graduation
            profileOverviewCreditsEl.textContent = `${totalCredits}/120`;
        }
    } catch (error) {
        console.error('Error updating profile overview credits:', error);
    }
}

// Application State
let currentView = 'dashboard';
let currentTab = 'dashboard';
let currentStep = 1;
let selectedCourses = [];
let selectedAvailability = {};
let isSubmitting = false;
let units = []; // Will be loaded from API
let enrollments = []; // Will be loaded from API
let notifications = []; // Will be loaded from API

// Time slots and days for timetable generation - will be loaded from backend
let timeSlots = [
  '8:15am - 11:15am',
  '11:30am - 2:30pm', 
  '2:45pm - 5:45pm',
  '6:00pm - 9:00pm'
];

let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Initialize the application
async function initializeApp() {
    console.log('Initializing app...');
    
    try {
        // Load data from APIs
        await Promise.all([
            loadUnitsFromAPI(),
            loadEnrollmentsFromAPI(),
            loadNotificationsFromAPI()
        ]);
        
        // Initialize UI components
        initializeEventListeners();
        showView('dashboard');
        showTab('dashboard');
        populateUnitsTab();
        populateNotifications();
        updateNotificationBadge();
        
        // Initialize icons after a short delay to ensure DOM is ready
        setTimeout(() => {
            initializeIcons();
        }, 100);
        
        console.log('App initialization completed');
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

function initializeIcons() {
    if (typeof lucide !== 'undefined') {
        try {
            lucide.createIcons();
            console.log('Icons initialized successfully');
        } catch (e) {
            console.log('Error initializing icons:', e);
        }
    } else {
        console.log('Lucide not available');
    }
}

// Load units from API and get enrollment statistics
async function loadUnitsFromAPI() {
    try {
        const response = await unitsAPI.getUnits();
        console.log('Raw API response:', response);
        
        // Backend returns { success: true, data: [...], pagination: {...} }
        const unitsData = response.data || response;
        
        if (!Array.isArray(unitsData)) {
            console.error('Units data is not an array:', unitsData);
            throw new Error('Invalid units data format');
        }
        
        // Get enrollment statistics to determine most enrolled units
        const enrollmentStats = await getMostEnrolledUnits();
        
        units = unitsData.map((unit) => ({
            id: unit.id,
            code: unit.unitCode,
            name: unit.title,
            description: unit.description || 'No description available',
            credits: unit.credits || 0,
            // Mark units as "popular" based on enrollment count
            enrollmentCount: enrollmentStats[unit.id] || 0,
            isPopular: enrollmentStats[unit.id] >= 1 // Popular if at least 1 enrollment
        }));
        
        console.log('Loaded units from API with enrollment stats:', units);
        
        // Update units tab if we're on the units tab
        if (currentView === 'units') {
            populateUnitsTab();
        }
        
        // Update dashboard units preview
        updateDashboardUnitsPreview();
    } catch (error) {
        console.error('Error loading units:', error);
        // Don't fall back to mock data - show empty state instead
        units = [];
        updateDashboardUnitsPreview();
    }
}

// Get enrollment statistics to determine most enrolled units
async function getMostEnrolledUnits() {
    try {
        const response = await enrollmentAPI.getEnrollments();
        const enrollmentsData = response.data.enrollments || response;

        console.log('Raw enrollments data for stats:', enrollmentsData);
        
        if (!Array.isArray(enrollmentsData)) {
            console.error('Enrollments data is not an array:', enrollmentsData);
            return {};
        }
        
        // Count enrollments per unit
        const enrollmentCounts = {};
        enrollmentsData.forEach(enrollment => {
            if (enrollment.unitId) {
                enrollmentCounts[enrollment.unitId] = (enrollmentCounts[enrollment.unitId] || 0) + 1;
            }
        });
        
        console.log('Enrollment statistics:', enrollmentCounts);
        return enrollmentCounts;
    } catch (error) {
        console.error('Error getting enrollment statistics:', error);
        return {};
    }
}

// Load enrollments from API
async function loadEnrollmentsFromAPI() {
    try {
        const response = await enrollmentAPI.getMyEnrollments();
        console.log('Raw enrollments API response:', response);
        
        // Handle different response formats from backend
        const enrollmentsData = response.data || response;
        
        if (!Array.isArray(enrollmentsData)) {
            console.error('Enrollments data is not an array:', enrollmentsData);
            enrollments = [];
        } else {
            enrollments = enrollmentsData;
        }
        
        console.log('Loaded enrollments:', enrollments);
        // Update dashboard with enrollment data
        updateDashboard();
        // Update enrolled units display
        updateEnrolledUnitsDisplay();
    } catch (error) {
        console.error('Error loading enrollments:', error);
        enrollments = [];
        // Still update dashboard to show zero enrollments
        updateDashboard();
        // Update enrolled units display
        updateEnrolledUnitsDisplay();
    }
}

// Load notifications from API
async function loadNotificationsFromAPI() {
    try {
        const response = await notificationsAPI.getActiveNotifications();
        console.log('Raw notifications API response:', response);
        
        // Handle different response formats from backend
        const notificationsData = response.data || response;
        
        if (!Array.isArray(notificationsData)) {
            console.error('Notifications data is not an array:', notificationsData);
            throw new Error('Invalid notifications data format');
        }
        
        notifications = notificationsData.map(notification => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: mapNotificationType(notification.type),
            priority: mapNotificationPriority(notification.type),
            date: new Date(notification.createdAt).toLocaleDateString(),
            time: new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            read: false // Default to unread for students
        }));
        
        console.log('Loaded notifications from API:', notifications);
        
        // Update notifications display if we're on the notifications tab
        if (currentView === 'notifications') {
            populateNotifications();
        }
        updateNotificationBadge();
        
        // Update priority notifications on dashboard
        updateDashboardPriorityNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
        // Don't fall back to mock data - keep empty state
        notifications = [];
        if (currentView === 'notifications') {
            populateNotifications();
        }
        updateNotificationBadge();
        updateDashboardPriorityNotifications();
    }
}

// Helper functions to map notification types
function mapNotificationType(backendType) {
    const typeMap = {
        'GENERAL': 'info',
        'URGENT': 'urgent',
        'ACADEMIC': 'enrollment',
        'SYSTEM': 'system'
    };
    return typeMap[backendType] || 'info';
}

function mapNotificationPriority(backendType) {
    const priorityMap = {
        'URGENT': 'high',
        'ACADEMIC': 'medium',
        'GENERAL': 'low',
        'SYSTEM': 'medium'
    };
    return priorityMap[backendType] || 'low';
}

function initializeEventListeners() {
  console.log('Setting up event listeners...');
  
  // Navigation - Handle both desktop and mobile nav
  const navButtons = document.querySelectorAll('[data-tab], .nav-item');
  console.log('Found navigation buttons:', navButtons.length);
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Handle both data-tab attribute and nav-item class
      const tab = e.currentTarget.getAttribute('data-tab') || 
                  e.currentTarget.textContent.toLowerCase().trim();
      
      console.log('Tab clicked:', tab);
      if (tab && currentView === 'dashboard') {
        showTab(tab);
      }
    });
  });

  // Pre-enrollment buttons - Enhanced with better debugging
  const enrollmentButtons = [
    'start-enrollment-btn',
    'mobile-enrollment-btn', 
    'quick-enrollment',
    'units-enrollment-btn'
  ];
  
  enrollmentButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      console.log('Adding enrollment listener to:', id);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Enrollment button clicked:', id, 'Current view:', currentView);
        showView('form');
      });
    }
  });

  // Back to dashboard
  const backBtn = document.getElementById('back-to-dashboard');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Back to dashboard clicked');
      showView('dashboard');
    });
  }

  // Form navigation
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const submitBtn = document.getElementById('submit-form');
  
  console.log('Form buttons found:', {
    prev: !!prevBtn,
    next: !!nextBtn,
    submit: !!submitBtn
  });
  
  if (prevBtn) prevBtn.addEventListener('click', previousStep);
  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (submitBtn) {
    submitBtn.addEventListener('click', submitForm);
    console.log('Submit button event listener added');
  }

  // Search and filters
  const unitsSearch = document.getElementById('units-search');
  const unitsFilter = document.getElementById('units-filter');
  const notificationsSearch = document.getElementById('notifications-search');
  const notificationsFilter = document.getElementById('notifications-filter');

  if (unitsSearch) unitsSearch.addEventListener('input', filterUnitsTab);
  if (unitsFilter) unitsFilter.addEventListener('change', filterUnitsTab);
  if (notificationsSearch) notificationsSearch.addEventListener('input', filterNotifications);
  if (notificationsFilter) notificationsFilter.addEventListener('change', filterNotifications);

  // Notification actions
  const markAllRead = document.getElementById('mark-all-read');
  if (markAllRead) markAllRead.addEventListener('click', markAllNotificationsRead);

  console.log('Event listeners setup complete');
}

// Enhanced View Management for your header structure
function showView(view) {
  console.log('Attempting to show view:', view, 'Current view:', currentView);
  
  currentView = view;
  
  // Hide all views first
  const allViews = document.querySelectorAll('.view');
  console.log('Found views:', allViews.length);
  
  allViews.forEach((v, index) => {
    v.classList.remove('active');
    console.log(`View ${index} (${v.id}): hidden`);
  });
  
  // Show target view
  const targetView = document.getElementById(`${view}-view`);
  if (targetView) {
    targetView.classList.add('active');
    console.log('View shown successfully:', view);
    
    // Handle body scroll for form overlay
    if (view === 'form') {
      document.body.style.overflow = 'hidden';
      console.log('Initializing form...');
      initializeForm(); // This is now async but we don't need to await here
    } else {
      document.body.style.overflow = 'auto';
    }
  } else {
    console.error('Target view not found:', `${view}-view`);
  }
}

function showTab(tab) {
  console.log('Switching to tab:', tab);
  currentTab = tab;
  
  // Update nav-item buttons (your existing nav structure)
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().trim() === tab.toLowerCase()) {
      btn.classList.add('active');
    }
  });
  
  // Update data-tab buttons (new nav structure)
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
    }
  });

  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Show target tab content
  const targetTab = document.getElementById(`${tab}-tab`);
  if (targetTab) {
    targetTab.classList.add('active');
    console.log('Tab content shown successfully:', tab);
    
    // Refresh content when switching tabs
    if (tab === 'units') {
      populateUnitsTab();
    } else if (tab === 'notifications') {
      populateNotifications();
    }
    
    // Re-initialize icons for the new content
    setTimeout(initializeIcons, 100);
  } else {
    console.error('Target tab not found:', `${tab}-tab`);
  }
}

// Load schedule data from API
async function loadScheduleData() {
    try {
        console.log('Loading schedule data...');
        // Load days and time slots in parallel
        const [daysResponse, timeSlotsResponse] = await Promise.all([
            daysAPI.getDays(),
            timeslotsAPI.getTimeslots()
        ]);
        
        console.log('Days API response:', daysResponse);
        console.log('TimeSlots API response:', timeSlotsResponse);
        
        // Handle different response formats from backend
        const daysData = daysResponse.data || daysResponse;
        const timeSlotsData = timeSlotsResponse.data || timeSlotsResponse;
        
        // Update days array with backend data
        if (Array.isArray(daysData) && daysData.length > 0) {
            days = daysData
                .sort((a, b) => a.dayOrder - b.dayOrder)
                .map(day => day.name);
            console.log('Loaded days from backend:', days);
        } else {
            console.log('No days data from backend, using defaults');
        }
        
        // Update time slots array with backend data
        if (Array.isArray(timeSlotsData) && timeSlotsData.length > 0) {
            timeSlots = timeSlotsData.map(slot => `${slot.startTime} - ${slot.endTime}`);
            console.log('Loaded time slots from backend:', timeSlots);
        } else {
            console.log('No time slots data from backend, using defaults');
        }
    } catch (error) {
        console.error('Error loading schedule data:', error);
        // Keep default values if backend fails
        console.log('Using default schedule data due to error');
    }
}

// Form Submission
async function submitForm() {
//   alert('submitForm called!'); // This should show up
  console.log('submitForm called!');
  console.log('Current state:', {
    selectedCourses,
    selectedAvailability,
    canSubmit: canSubmitForm(),
    isSubmitting
  });
  
  // Debug: Show the full selectedAvailability object
  console.log('=== DEBUGGING selectedAvailability ===');
  console.log('selectedAvailability object:', JSON.stringify(selectedAvailability, null, 2));
  console.log('selectedAvailability keys:', Object.keys(selectedAvailability));
  console.log('selectedAvailability entries:', Object.entries(selectedAvailability));
  
//   if (!canSubmitForm() || isSubmitting) {
//     alert('Cannot submit form - conditions not met');
//     console.log('Cannot submit form');
//     return;
//   }
  
  isSubmitting = true;
  const submitBtn = document.getElementById('submit-form');
  const submitText = document.getElementById('submit-text');
  
  if (submitBtn) submitBtn.disabled = true;
  if (submitText) submitText.innerHTML = '<div class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>Submitting...';
  
  try {
    // Get current user for authentication check
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Check for duplicate enrollments before submitting
    console.log('Checking for existing enrollments...');
    const alreadyEnrolledUnits = [];
    
    for (const courseId of selectedCourses) {
      const course = units.find(c => String(c.id) === String(courseId));
      if (course) {
        // Check if student is already enrolled in this unit
        const isEnrolled = enrollments.some(enrollment => 
          enrollment.unit && String(enrollment.unit.id) === String(courseId)
        );
        
        if (isEnrolled) {
          alreadyEnrolledUnits.push(course.unitCode || course.code || course.name);
        }
      }
    }
    
    if (alreadyEnrolledUnits.length > 0) {
      alert(`You are already enrolled in the following units: ${alreadyEnrolledUnits.join(', ')}. Please remove them from your selection before submitting.`);
      return;
    }
    
    // Create enrollment requests for each selected course
    const enrollmentPromises = selectedCourses.map(async (courseId) => {
      const course = units.find(c => String(c.id) === String(courseId));
      if (course) {
        // Collect selected schedule slots for this course
        const scheduleSlots = [];
        
        console.log('Current selectedAvailability:', selectedAvailability);
        
        // Get all selected availability slots from the form
        // selectedAvailability format: { "Monday": ["8:15am - 11:15am", "11:30am - 2:30pm"], "Tuesday": ["2:45pm - 5:45pm"] }
        Object.entries(selectedAvailability).forEach(([dayName, timeSlots]) => {
          console.log(`Processing day: ${dayName} with slots:`, timeSlots);
          
          if (Array.isArray(timeSlots)) {
            timeSlots.forEach(timeSlot => {
              console.log(`Adding slot: dayName="${dayName}", timeSlot="${timeSlot}"`);
              scheduleSlots.push({
                dayName: dayName,
                timeSlot: timeSlot
              });
            });
          }
        });
        
        console.log('Collected scheduleSlots for course', course.unitCode, ':', scheduleSlots);
        
        // Get selected semester from the form
        const semesterSelect = document.getElementById('enrollment-semester');
        const selectedSemesterId = semesterSelect ? parseInt(semesterSelect.value) : null;
        
        if (!selectedSemesterId) {
          throw new Error('Please select a semester for enrollment');
        }
        
        // Prepare enrollment data according to backend schema
        const enrollmentData = {
          unitId: parseInt(course.id), // Ensure it's a number for the backend
          semesterId: selectedSemesterId, // Use the selected semester
          scheduleSlots: scheduleSlots // Send the selected schedule slots
        };
        
        console.log('Submitting enrollment with schedule slots:', enrollmentData);
        return await enrollmentAPI.createMyEnrollment(enrollmentData);
      }
    });
    
    const results = await Promise.all(enrollmentPromises);
    console.log('Enrollment submission results:', results);
    
    // Check for partial success
    const successfulEnrollments = results.filter(result => result && result.success !== false);
    const failedEnrollments = results.length - successfulEnrollments.length;
    
    if (successfulEnrollments.length > 0 && failedEnrollments === 0) {
      alert('Your unit selections have been successfully submitted!');
    } else if (successfulEnrollments.length > 0 && failedEnrollments > 0) {
      alert(`${successfulEnrollments.length} units were successfully enrolled, but ${failedEnrollments} failed. Please check your enrollments and try again for the failed units.`);
    } else {
      throw new Error('All enrollments failed');
    }
    
    // Reset form and go back to dashboard
    selectedCourses = [];
    selectedAvailability = {};
    showView('dashboard');
    
    // Refresh enrollments data
    await loadEnrollmentsFromAPI();
    
  } catch (error) {
    console.error('Error submitting form:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'There was an error submitting your enrollment. Please try again.';
    
    if (error.message?.includes('already enrolled')) {
      errorMessage = 'You are already enrolled in one or more of these units for this semester. Please review your selections and remove any units you are already enrolled in.';
    } else if (error.message?.includes('authentication') || error.message?.includes('token')) {
      errorMessage = 'Your session has expired. Please log in again to submit your enrollment.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid enrollment data. Please check your selections and try again.';
    } else if (error.response?.status === 409) {
      errorMessage = 'Enrollment conflict detected. You may already be enrolled in some of these units.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error occurred. Please try again in a few moments.';
    }
    
    alert(errorMessage);
  } finally {
    isSubmitting = false;
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.innerHTML = 'Submit Enrollment';
  }
}

// ====== Include all other student-specific functions here ======
// (Dashboard management, form management, units management, notifications, etc.)

// Update dashboard with real data
function updateDashboard() {
    // Update enrollment status
    const enrollmentCount = enrollments.length;
    
    // Calculate total credits from enrollments
    const totalCredits = enrollments.reduce((sum, enrollment) => {
        const unit = enrollment.unit || {};
        return sum + (parseInt(unit.credits) || 0);
    }, 0);
    
    // Update enrollment count display
    const enrollmentCountElements = document.querySelectorAll('.enrollment-count');
    enrollmentCountElements.forEach(element => {
        element.textContent = enrollmentCount;
    });
    
    // Update enrollment status message
    const enrollmentStatusElements = document.querySelectorAll('.enrollment-status');
    enrollmentStatusElements.forEach(element => {
        if (enrollmentCount === 0) {
            element.textContent = 'No units enrolled yet';
            element.className = 'enrollment-status text-sm text-gray-600';
        } else {
            element.textContent = `Enrolled in ${enrollmentCount} unit${enrollmentCount > 1 ? 's' : ''} (${totalCredits} credits)`;
            element.className = 'enrollment-status text-sm text-green-600';
        }
    });
    
    console.log(`Dashboard updated: ${enrollmentCount} total enrollments, ${totalCredits} total credits`);
    
    // Update units preview on dashboard
    updateDashboardUnitsPreview();
    
    // Update dashboard enrolled units preview
    updateDashboardEnrolledUnits();
    
    // Update profile overview credits
    updateProfileOverviewCredits();
}

function updateDashboardEnrolledUnits() {
    // This could be used to show a brief enrolled units preview on dashboard
    console.log('Dashboard enrolled units updated');
}

// Update dashboard units preview with real backend data
function updateDashboardUnitsPreview() {
    const previewContainer = document.getElementById('dashboard-units-preview');
    if (!previewContainer) return;
    
    if (units.length === 0) {
        previewContainer.innerHTML = `
            <div class="text-center py-4">
                <p class="text-gray-500 mb-2">Unable to load units</p>
                <button class="btn btn-outline btn-sm" onclick="loadUnitsFromAPI()">
                    <i data-lucide="refresh-cw" class="w-4 h-4 mr-1"></i>
                    Retry
                </button>
            </div>
        `;
        setTimeout(initializeIcons, 100);
        return;
    }
    
    // Show first 3 units as preview
    const previewUnits = units.slice(0, 3);
    
    const unitsHTML = previewUnits.map(unit => {
        const unitCode = unit.unitCode || unit.code || 'N/A';
        const unitTitle = unit.title || unit.name || 'Unknown Unit';
        const unitCredits = unit.credits || 10;
        
        return `
            <div class="unit-preview">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <div class="flex items-center gap-2">
                            <h4>${unitTitle}</h4>
                            ${unit.suggested ? '<span class="badge badge-secondary">Suggested</span>' : ''}
                        </div>
                        <p class="text-sm text-gray-500">${unitCode}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="badge badge-outline">${unitCredits} credits</span>
                    </div>
                </div>
                <p class="text-sm text-gray-600">${unit.description || 'No description available'}</p>
            </div>
        `;
    }).join('');
    
    previewContainer.innerHTML = unitsHTML;
}

// Update priority notifications on dashboard
function updateDashboardPriorityNotifications() {
    const priorityContainer = document.getElementById('priority-notifications');
    if (!priorityContainer) return;
    
    // Get high priority or urgent notifications from real data only
    if (notifications.length === 0) {
        priorityContainer.innerHTML = '<p class="text-gray-500">No priority notifications</p>';
        return;
    }
    
    const priorityNotifications = notifications
        .filter(notif => notif.priority === 'high' || notif.type === 'urgent')
        .slice(0, 2); // Show max 2 priority notifications
    
    if (priorityNotifications.length === 0) {
        priorityContainer.innerHTML = '';
        return;
    }
    
    const notificationsHTML = priorityNotifications.map(notification => {
        const alertType = notification.type === 'urgent' ? 'alert-destructive' : 'alert-warning';
        const iconClass = getNotificationIconClass(notification.type);
        
        // Add green styling for today's notifications
        const isToday = isNotificationFromToday(notification);
        const todayClass = isToday ? 'bg-green-50 border-green-200' : '';
        const todayIndicator = isToday ? '<span class="badge bg-green-100 text-green-800 ml-2">Today</span>' : '';
        
        return `
            <div class="alert ${alertType} ${todayClass}">
                <i data-lucide="${iconClass}" class="h-4 w-4"></i>
                <div class="alert-content">
                    <div class="alert-header">
                        <span class="alert-title">${notification.title}${todayIndicator}</span>
                    </div>
                    <div class="alert-description">
                        ${notification.message}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    priorityContainer.innerHTML = notificationsHTML;
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Update enrolled units display in profile tab
function updateEnrolledUnitsDisplay() {
    const enrolledUnitsList = document.getElementById('enrolled-units-list');
    if (!enrolledUnitsList) return;
    
    if (enrollments.length === 0) {
        enrolledUnitsList.innerHTML = '<p class="text-gray-500 text-sm">No units enrolled yet</p>';
        return;
    }
    
    // Calculate total credits
    const totalCredits = enrollments.reduce((sum, enrollment) => {
        const unit = enrollment.unit || {};
        return sum + (parseInt(unit.credits) || 0);
    }, 0);
    
    const unitsHTML = enrollments.map(enrollment => {
        const unit = enrollment.unit || {};
        const semester = enrollment.semester || {};
        const enrolledDate = enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'Unknown';
        
        return `
            <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <p class="font-medium">${unit.unitCode || unit.code || 'Unknown'} - ${unit.title || unit.name || 'Unknown Unit'}</p>
                    </div>
                    <p class="text-sm text-gray-600">${unit.credits || 0} credits • ${semester.name || 'Semester 1, 2025'}</p>
                    <p class="text-xs text-gray-400">Enrolled: ${enrolledDate}</p>
                    ${unit.description ? `<p class="text-xs text-gray-500 mt-1">${unit.description}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Add total credits summary
    const summaryHTML = `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Total Enrolled Credits:</span>
                <span class="text-sm font-bold text-blue-600">${totalCredits} credits</span>
            </div>
            <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-gray-500">Units Enrolled:</span>
                <span class="text-xs text-gray-700">${enrollments.length} unit${enrollments.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    `;
    
    enrolledUnitsList.innerHTML = unitsHTML + summaryHTML;
}

// Units Tab Management
function populateUnitsTab() {
    console.log('Populating units tab...', 'Units available:', units.length);
    
    // If no units loaded from backend, show loading or error state
    if (units.length === 0) {
        const noResults = document.getElementById('no-units-found');
        const suggestedSection = document.getElementById('suggested-units-section');
        const allSection = document.getElementById('all-units-section');
        
        if (suggestedSection) suggestedSection.style.display = 'none';
        if (allSection) allSection.style.display = 'none';
        
        if (noResults) {
            noResults.style.display = 'block';
            noResults.innerHTML = `
                <div class="card">
                  <div class="card-content empty-state">
                    <i data-lucide="wifi-off" class="empty-state-icon"></i>
                    <h3>No units available</h3>
                    <p>Unable to load units from the server. Please check your connection and try again.</p>
                    <button class="btn btn-primary" onclick="loadUnitsFromAPI()">Retry</button>
                  </div>
                </div>
            `;
            setTimeout(initializeIcons, 100);
        }
        return;
    }
    
    const searchTerm = document.getElementById('units-search')?.value.toLowerCase() || '';
    
    const filteredCourses = getFilteredCourses(searchTerm, 'all');

    // Populate all units (removed most enrolled units section)
    const allGrid = document.getElementById('all-units-grid');
    const allSection = document.getElementById('all-units-section');
    
    if (allGrid && allSection) {
        if (filteredCourses.length > 0) {
            allSection.style.display = 'block';
            allGrid.innerHTML = filteredCourses.map(course => createUnitCard(course, false)).join('');
        } else {
            allSection.style.display = 'none';
        }
    }

    // Show/hide no results
    const noResults = document.getElementById('no-units-found');
    if (noResults) {
        noResults.style.display = filteredCourses.length === 0 ? 'block' : 'none';
    }

    setTimeout(initializeIcons, 100);
}

function getFilteredCourses(searchTerm, filter) {
    // Only use real units data from backend - no fallback to mock data
    console.log('Filtering units - available units:', units.length);
    
    return units.filter(course => {
        const matchesSearch = (course.name || course.title || '').toLowerCase().includes(searchTerm) ||
                             (course.code || course.unitCode || '').toLowerCase().includes(searchTerm) ||
                             (course.instructor || 'TBA').toLowerCase().includes(searchTerm);
        
        switch (filter) {
            case 'popular': return matchesSearch && course.isPopular;
            case 'available': return matchesSearch && (course.seats?.available > 0 || course.capacity > 0);
            case 'full': return matchesSearch && (course.seats?.available === 0 || course.capacity === 0);
            default: return matchesSearch;
        }
    });
}

function createUnitCard(course, isDetailed = false) {
    // Handle both backend unit data and mock data structure
    const unitCode = course.unitCode || course.code || 'N/A';
    const unitTitle = course.title || course.name || 'Unknown Unit';
    const unitCredits = course.credits || 10;
    const unitDescription = course.description || 'No description available';
    const capacity = course.capacity || course.seats?.total || 0;
    const available = course.seats?.available || (capacity > 0 ? capacity : 0);
    const lowSeats = available <= 5 && available > 0;
    
    // Check if this unit is already selected
    const isSelected = selectedCourses.includes(course.id);
    
    // Check if student is already enrolled in this unit
    const isEnrolled = enrollments.some(enrollment => 
      enrollment.unit && String(enrollment.unit.id) === String(course.id)
    );
    
    return `
        <div class="card ${isSelected ? 'border-green-500 bg-green-50' : ''} ${isEnrolled ? 'border-orange-500 bg-orange-50' : ''}">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        
                        <div>
                            <h3 class="card-title flex items-center gap-2">
                                ${unitCode}
                                ${course.suggested ? '<span class="badge badge-secondary">Suggested</span>' : ''}
                                ${isSelected ? '<span class="badge badge-success">Selected</span>' : ''}
                                ${isEnrolled ? '<span class="badge badge-error">Already Enrolled</span>' : ''}
                            </h3>
                            <p class="card-description">${unitTitle}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="badge badge-outline">${unitCredits} credits</span>
                    </div>
                </div>
            </div>
            <div class="card-content">
                <div class="space-y-3">
                    <p class="text-sm text-gray-600">${unitDescription}</p>
                </div>
            </div>
        </div>
    `;
}

function filterUnitsTab() {
    populateUnitsTab();
}

// Add unit to selection from units tab
function addUnitToSelection(unitId) {
    // Find the unit in the units array
    const unit = units.find(u => u.id == unitId || u.code === unitId || u.unitCode === unitId);
    if (!unit) {
        alert('Unit not found!');
        return;
    }
    
    // Check if already selected
    if (selectedCourses.includes(unit.id)) {
        alert('This unit is already selected!');
        return;
    }
    
    // Add to selection
    selectedCourses.push(unit.id);
    
    // Refresh the units tab to show updated selection state
    populateUnitsTab();
    
    // Show form view and update form display
    showView('form');
    setTimeout(() => {
        updateFormDisplay();
    }, 100);
}

// Update form display with current selections
function updateFormDisplay() {
    // This function should update the form to show selected units
    // Will be called after navigating to form view
    console.log('Selected courses:', selectedCourses);
}

// Notifications Management
function populateNotifications() {
    console.log('Populating notifications...');
    const searchTerm = document.getElementById('notifications-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('notifications-filter')?.value || 'all';
    
    const filteredNotifications = getFilteredNotifications(searchTerm, filter);
    const container = document.getElementById('notifications-list');
    const noResults = document.getElementById('no-notifications-found');
    
    if (!container) return;
    
    if (filteredNotifications.length === 0) {
        container.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
    } else {
        if (noResults) noResults.style.display = 'none';
        container.innerHTML = filteredNotifications.map(notification => createNotificationCard(notification)).join('');
    }
    
    setTimeout(initializeIcons, 100);
}

function getFilteredNotifications(searchTerm, filter) {
    // Use real notifications data only - no fallback to mock data
    return notifications.filter(notification => {
        const matchesSearch = notification.title.toLowerCase().includes(searchTerm) ||
                             notification.message.toLowerCase().includes(searchTerm);
        
        switch (filter) {
            case 'unread': return matchesSearch && !notification.read;
            case 'high': return matchesSearch && notification.priority === 'high';
            case 'enrollment': return matchesSearch && notification.type === 'enrollment';
            case 'assignment': return matchesSearch && notification.type === 'assignment';
            default: return matchesSearch;
        }
    });
}

// Helper function to check if notification is from today
function isNotificationFromToday(notification) {
    const today = new Date();
    const notificationDate = new Date(notification.date);
    
    return today.toDateString() === notificationDate.toDateString();
}

function createNotificationCard(notification) {
    const iconClass = getNotificationIconClass(notification.type);
    const colorClass = getNotificationColorClass(notification.type);
    
    // Add green styling for today's notifications
    const isToday = isNotificationFromToday(notification);
    const todayClass = isToday ? 'bg-green-50 border-green-200' : '';
    const todayIndicator = isToday ? '<span class="badge bg-green-100 text-green-800 ml-2">Today</span>' : '';
    
    return `
        <div class="card ${!notification.read ? 'notification-unread' : ''} ${todayClass}">
            <div class="card-content">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0 pt-1">
                        <i data-lucide="${iconClass}" class="h-4 w-4 ${colorClass}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-medium text-gray-900">
                                ${notification.title}
                                ${!notification.read ? '<span class="badge badge-secondary ml-2">New</span>' : ''}
                                ${todayIndicator}
                            </h3>
                            <div class="flex items-center space-x-2">
                                <span class="text-xs text-gray-500">${notification.date}</span>
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm mb-3">${notification.message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getNotificationIconClass(type) {
    const icons = {
        info: 'alert-circle',
        warning: 'clock',
        success: 'check-circle-2',
        assignment: 'file-text',
        enrollment: 'graduation-cap'
    };
    return icons[type] || 'alert-circle';
}

function getNotificationColorClass(type) {
    const colors = {
        info: 'text-blue-600',
        warning: 'text-orange-600',
        success: 'text-green-600',
        assignment: 'text-red-600',
        enrollment: 'text-purple-600'
    };
    return colors[type] || 'text-blue-600';
}

function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'high': return 'badge-destructive';
        case 'medium': return 'badge-secondary';
        default: return 'badge-outline';
    }
}

function filterNotifications() {
    populateNotifications();
    updateNotificationBadge();
}

// Note: These functions are commented out since Mark as Read and Dismiss buttons were removed
// function markNotificationRead(id) {
//     console.log('Marking notification as read:', id);
//     const notification = notifications.find(n => n.id === id);
//     if (notification) {
//         notification.read = true;
//         populateNotifications();
//         updateNotificationBadge();
//     }
// }

// function dismissNotification(id) {
//     console.log('Dismissing notification:', id);
//     const index = notifications.findIndex(n => n.id === id);
//     if (index !== -1) {
//         notifications.splice(index, 1);
//         populateNotifications();
//         updateNotificationBadge();
//     }
// }

function markAllNotificationsRead() {
    console.log('Marking all notifications as read');
    notifications.forEach(notification => {
        notification.read = true;
    });
    populateNotifications();
    updateNotificationBadge();
}

function updateNotificationBadge() {
    // Use real notifications data only
    const unreadCount = notifications.filter(n => !n.read).length;
    const badges = document.querySelectorAll('#notification-badge, .mobile-notification-badge');
    const unreadCountElement = document.getElementById('unread-count');
    
    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });

    if (unreadCountElement) {
        unreadCountElement.textContent = `${unreadCount} unread`;
    }
}

// Form Management
async function initializeForm() {
    console.log('Initializing form...');
    currentStep = 1;
    selectedCourses = [];
    selectedAvailability = {};
    
    // Load schedule data, units, and semesters from backend before rendering
    await Promise.all([
        loadScheduleData(),
        units.length === 0 ? loadUnitsFromAPI() : Promise.resolve(),
        loadAvailableSemesters()
    ]);
    
    updateFormStep();
    renderCourseSelection();
    renderAvailabilityGrid();
    setTimeout(initializeIcons, 100);
}

function updateFormStep() {
    // Update step indicator
    const stepIndicator = document.getElementById('step-indicator');
    if (stepIndicator) {
        stepIndicator.textContent = `Step ${currentStep} of 3`;
    }
    
    // Update step circles and titles
    document.querySelectorAll('.step-circle').forEach((circle, index) => {
        circle.classList.remove('active', 'completed');
        if (index + 1 === currentStep) {
            circle.classList.add('active');
        } else if (index + 1 < currentStep) {
            circle.classList.add('completed');
            circle.innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5"></i>';
        }
    });

    document.querySelectorAll('.step-title').forEach((title, index) => {
        title.classList.remove('active');
        if (index + 1 <= currentStep) {
            title.classList.add('active');
        }
    });

    // Update step lines
    document.querySelectorAll('.step-line').forEach((line, index) => {
        line.classList.remove('completed');
        if (index + 1 < currentStep) {
            line.classList.add('completed');
        }
    });

    // Update form content
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    const currentFormStep = document.getElementById(`step-${currentStep}`);
    if (currentFormStep) {
        currentFormStep.classList.add('active');
    }

    // Update form title
    const stepInfo = getStepInfo(currentStep);
    const formTitle = document.getElementById('form-title');
    const formDescription = document.getElementById('form-description');
    if (formTitle) formTitle.textContent = stepInfo.title;
    if (formDescription) formDescription.textContent = stepInfo.description;

    // Update navigation buttons
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    const submitBtn = document.getElementById('submit-form');

    if (prevBtn) prevBtn.disabled = currentStep === 1;
    
    if (currentStep < 3) {
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.disabled = !canProceedToNextStep();
        }
        if (submitBtn) submitBtn.style.display = 'none';
    } else {
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) {
            submitBtn.style.display = 'inline-flex';
            submitBtn.disabled = !canSubmitForm();
        }
        updateReviewStep();
    }

    updateStepHelp();
    setTimeout(initializeIcons, 100);
}

function getStepInfo(step) {
    const steps = [
        { title: 'Unit Selection', description: 'Choose your units' },
        { title: 'Availability', description: 'Set your available times' },
        { title: 'Review & Submit', description: 'Confirm your selections' }
    ];
    return steps[step - 1] || steps[0];
}

function updateStepHelp() {
    const helpElement = document.getElementById('step-help');
    if (!helpElement) return;
    
    let helpText = '';
    if (currentStep === 1 && !canProceedToNextStep()) {
        helpText = 'Select at least 1 unit to continue';
    } else if (currentStep === 2 && !canProceedToNextStep()) {
        helpText = 'Select at least 3 time blocks to continue';
    }
    helpElement.textContent = helpText;
}

function canProceedToNextStep() {
    switch (currentStep) {
        case 1:
            return selectedCourses.length > 0 && selectedCourses.length <= 6;
        case 2:
            const totalSlots = Object.values(selectedAvailability).reduce((sum, times) => sum + times.length, 0);
            return totalSlots >= 3;
        default:
            return true;
    }
}

function canSubmitForm() {
    const semesterSelect = document.getElementById('enrollment-semester');
    const selectedSemester = semesterSelect ? semesterSelect.value : null;
    
    return selectedCourses.length > 0 && 
           Object.values(selectedAvailability).reduce((sum, times) => sum + times.length, 0) >= 3 &&
           selectedSemester; // Require semester selection
}

function nextStep() {
    if (currentStep < 3 && canProceedToNextStep()) {
        currentStep++;
        updateFormStep();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateFormStep();
    }
}

// Course Management
function renderCourseSelection() {
    console.log('renderCourseSelection called');
    console.log('units:', units);
    console.log('selectedCourses:', selectedCourses);
    
    const container = document.getElementById('course-selection');
    if (!container) return;

    // Use real units data only
    if (units.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 mb-4">No units available for enrollment</p>
                <button class="btn btn-outline btn-sm" onclick="loadUnitsFromAPI()">
                    <i data-lucide="refresh-cw" class="w-4 h-4 mr-1"></i>
                    Load Units
                </button>
            </div>
        `;
        setTimeout(initializeIcons, 100);
        return;
    }

    // Display all available units
    let html = '<h3 class="font-medium mb-3">Available Units</h3>';
    html += '<div class="space-y-2">';
    
    units.forEach(course => {
        const isSelected = selectedCourses.includes(String(course.id));
        console.log(`Course ${course.id} (${course.code}): selected = ${isSelected}`);
        html += `
            <div class="course-card ${isSelected ? 'selected' : ''}" data-course-id="${course.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium">${course.code || course.unitCode}</span>
                            <span class="text-gray-600">${course.name || course.title}</span>
                            <span class="text-sm text-gray-500">(${course.credits} credits)</span>
                        </div>
                    </div>
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;

    // Add event listeners for click-to-select functionality
    container.querySelectorAll('.course-card').forEach(card => {
        card.addEventListener('click', (e) => {
            console.log('Card clicked:', card.dataset.courseId);
            toggleCourse(card.dataset.courseId);
        });
    });

    updateSelectedSummary();
}

function toggleCourse(courseId) {
    // Ensure courseId is a string for consistency
    courseId = String(courseId);
    
    console.log('toggleCourse called with:', courseId);
    console.log('selectedCourses before:', selectedCourses);
    console.log('units available:', units.length);
    
    if (selectedCourses.includes(courseId)) {
        selectedCourses = selectedCourses.filter(id => id !== courseId);
        console.log('Removed course:', courseId);
    } else {
        if (selectedCourses.length < 6) {
            selectedCourses.push(courseId);
            console.log('Added course:', courseId);
        } else {
            alert('You can only select up to 6 units.');
            return;
        }
    }
    
    console.log('selectedCourses after:', selectedCourses);
    
    // Update both the units tab and enrollment form
    populateUnitsTab();
    renderCourseSelection();
    updateSelectedSummary(); // Add this to update the summary
    updateFormStep();
}

function updateSelectedSummary() {
    console.log('updateSelectedSummary called');
    console.log('selectedCourses:', selectedCourses);
    console.log('units:', units);
    
    const summaryElement = document.getElementById('selected-summary');
    const countElement = document.getElementById('selected-count');
    const listElement = document.getElementById('selected-list');
    const creditsElement = document.getElementById('total-credits');
    
    console.log('Elements found:', {
        summary: !!summaryElement,
        count: !!countElement,
        list: !!listElement,
        credits: !!creditsElement
    });
    
    if (!summaryElement) return;
    
    if (selectedCourses.length > 0) {
        summaryElement.style.display = 'block';
        
        if (countElement) countElement.textContent = selectedCourses.length;
        
        const totalCredits = selectedCourses.reduce((sum, courseId) => {
            const course = units.find(c => String(c.id) === String(courseId));
            const credits = course ? parseInt(course.credits) || 0 : 0;
            console.log(`Course ${courseId}: ${course ? course.code || course.unitCode : 'Not found'}, Credits: ${credits}`);
            return sum + credits;
        }, 0);
        
        console.log('Total credits calculated:', totalCredits);
        
        if (creditsElement) {
            creditsElement.textContent = totalCredits;
            console.log('Credits element updated with:', totalCredits);
        }
        
        if (listElement) {
            listElement.innerHTML = selectedCourses.map(courseId => {
                const course = units.find(c => String(c.id) === String(courseId));
                return course ? `
                    <div class="text-sm text-green-700 flex items-center justify-between">
                        <span>${course.code || course.unitCode} - ${course.name || course.title}</span>
                        <button class="btn btn-ghost btn-sm" onclick="toggleCourse('${courseId}')">Remove</button>
                    </div>
                ` : '';
            }).join('');
        }
    } else {
        summaryElement.style.display = 'none';
    }
}

// Availability Management
function renderAvailabilityGrid() {
    const container = document.getElementById('availability-grid');
    if (!container) return;

    let html = '';
    days.forEach(day => {
        html += `
            <div class="day-column">
                <div class="day-header">${day}</div>
                ${timeSlots.map(time => `
                    <button class="time-slot ${isTimeSelected(day, time) ? 'selected' : ''}" 
                            data-day="${day}" data-time="${time}">
                        ${time}
                    </button>
                `).join('')}
            </div>
        `;
    });
    
    container.innerHTML = html;

    // Add event listeners
    container.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            const day = e.target.dataset.day;
            const time = e.target.dataset.time;
            toggleTimeSlot(day, time);
        });
    });

    updateAvailabilitySummary();
}

function isTimeSelected(day, time) {
    return selectedAvailability[day]?.includes(time) || false;
}

function toggleTimeSlot(day, time) {
    if (!selectedAvailability[day]) {
        selectedAvailability[day] = [];
    }
    
    if (selectedAvailability[day].includes(time)) {
        selectedAvailability[day] = selectedAvailability[day].filter(t => t !== time);
        if (selectedAvailability[day].length === 0) {
            delete selectedAvailability[day];
        }
    } else {
        selectedAvailability[day].push(time);
    }
    
    renderAvailabilityGrid();
    updateFormStep();
}

function updateAvailabilitySummary() {
    const summaryElement = document.getElementById('availability-summary');
    const listElement = document.getElementById('availability-list');
    const totalElement = document.getElementById('total-blocks');
    
    if (!summaryElement) return;
    
    const totalBlocks = Object.values(selectedAvailability).reduce((sum, times) => sum + times.length, 0);
    
    if (totalBlocks > 0) {
        summaryElement.style.display = 'block';
        
        if (totalElement) totalElement.textContent = totalBlocks;
        
        if (listElement) {
            listElement.innerHTML = Object.entries(selectedAvailability)
                .filter(([_, times]) => times.length > 0)
                .map(([day, times]) => `
                    <div class="text-sm text-blue-700">
                        <span class="font-medium">${day}:</span> ${times.sort().join(', ')}
                    </div>
                `).join('');
        }
    } else {
        summaryElement.style.display = 'none';
    }
}

// Review Step
function updateReviewStep() {
    console.log('updateReviewStep called');
    updateReviewUnits();
    updateReviewAvailability();
}

function updateReviewUnits() {
    console.log('updateReviewUnits called');
    console.log('selectedCourses:', selectedCourses);
    console.log('units for review:', units);
    
    const container = document.getElementById('review-units');
    const creditsElement = document.getElementById('review-total-credits');
    
    if (!container) {
        console.log('review-units container not found');
        return;
    }
    
    const totalCredits = selectedCourses.reduce((sum, courseId) => {
        const course = units.find(c => String(c.id) === String(courseId));
        const credits = course ? parseInt(course.credits) || 0 : 0;
        console.log(`Review - Course ${courseId}: ${course ? course.code || course.unitCode : 'Not found'}, Credits: ${credits}`);
        return sum + credits;
    }, 0);
    
    console.log('Review total credits:', totalCredits);
    
    if (creditsElement) creditsElement.textContent = totalCredits;
    
    if (selectedCourses.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No units selected</p>';
        return;
    }
    
    container.innerHTML = selectedCourses.map(courseId => {
        const course = units.find(c => String(c.id) === String(courseId));
        return course ? `
            <div class="flex items-center justify-between p-3 border rounded mb-3">
                <div>
                    <p class="font-medium">${course.code || course.unitCode} - ${course.name || course.title}</p>
                    <p class="text-sm text-gray-500">${course.description || 'No description available'}</p>
                </div>
                <div class="text-right">
                    <span class="badge badge-outline">${course.credits} credits</span>
                </div>
            </div>
        ` : `
            <div class="flex items-center justify-between p-3 border rounded mb-3">
                <div>
                    <p class="font-medium text-red-500">Unit not found (ID: ${courseId})</p>
                </div>
            </div>
        `;
    }).join('');
}

function updateReviewAvailability() {
    const container = document.getElementById('review-availability');
    const totalElement = document.getElementById('review-total-blocks');
    
    if (!container) return;
    
    const totalBlocks = Object.values(selectedAvailability).reduce((sum, times) => sum + times.length, 0);
    if (totalElement) totalElement.textContent = totalBlocks;
    
    container.innerHTML = Object.entries(selectedAvailability)
        .filter(([_, times]) => times.length > 0)
        .map(([day, times]) => `
            <div class="mb-4">
                <h4 class="font-medium mb-2">${day} (${times.length} block${times.length > 1 ? 's' : ''})</h4>
                <div>
                    ${times.sort().map(time => `
                        <span class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded mr-1 mb-1 inline-block">${time}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
}

// Utility functions and final initialization
function initializeIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    } else {
        sidebar.classList.add('show');
        overlay.classList.add('show');
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
}

// Schedule data loading (if needed for availability)
async function loadScheduleData() {
    console.log('Loading schedule data...');
    try {
        const [daysResponse, timeSlotsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/days`, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_BASE_URL}/timeslots`, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        if (daysResponse.ok && timeSlotsResponse.ok) {
            const daysData = await daysResponse.json();
            const timeSlotsData = await timeSlotsResponse.json();
            
            // Extract the actual data from API response
            days = Array.isArray(daysData) ? daysData.map(d => d.name || d.day) : 
                  (daysData.data && Array.isArray(daysData.data)) ? daysData.data.map(d => d.name || d.day) : 
                  daysData.days || days; // fallback to default
            
            timeSlots = Array.isArray(timeSlotsData) ? timeSlotsData.map(t => t.startTime && t.endTime ? `${t.startTime}-${t.endTime}` : t.time || t) :
                       (timeSlotsData.data && Array.isArray(timeSlotsData.data)) ? timeSlotsData.data.map(t => t.startTime && t.endTime ? `${t.startTime}-${t.endTime}` : t.time || t) :
                       timeSlotsData.timeSlots || timeSlots; // fallback to default

            console.log('Schedule data loaded successfully:', { days: days.length, timeSlots: timeSlots.length });
        } else {
            console.warn('Using default schedule data due to API error');
        }
    } catch (error) {
        console.error('Error loading schedule data:', error);
        console.log('Using default schedule data');
    }
}

// Make functions globally available
window.showView = showView;
window.loadUnitsFromAPI = loadUnitsFromAPI;
window.loadNotificationsFromAPI = loadNotificationsFromAPI;
window.loadEnrollmentsFromAPI = loadEnrollmentsFromAPI;
window.submitForm = submitForm;
window.toggleCourse = toggleCourse;
window.addUnitToSelection = addUnitToSelection;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.toggleTimeSlot = toggleTimeSlot;
window.filterUnitsTab = filterUnitsTab;
window.filterNotifications = filterNotifications;
// window.markNotificationRead = markNotificationRead;
// window.dismissNotification = dismissNotification;
window.markAllNotificationsRead = markAllNotificationsRead;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.logout = logout;

// ================================
// CHANGE PASSWORD FUNCTIONALITY
// ================================

// Change Password Modal Elements
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const closePasswordModal = document.getElementById('close-password-modal');
const cancelPasswordChange = document.getElementById('cancel-password-change');
const savePasswordChange = document.getElementById('save-password-change');
const changePasswordForm = document.getElementById('change-password-form');

// Change Password Modal Functions
function openChangePasswordModal() {
  changePasswordModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Clear form
  changePasswordForm.reset();
  
  // Focus on first input
  document.getElementById('current-password').focus();
}

function closeChangePasswordModal() {
  changePasswordModal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Clear form
  changePasswordForm.reset();
  
  // Reset button state
  savePasswordChange.disabled = false;
  document.getElementById('password-save-text').textContent = 'Change Password';
}

async function handlePasswordChange() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('New password must be at least 6 characters long');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match');
    return;
  }
  
  if (currentPassword === newPassword) {
    alert('New password must be different from current password');
    return;
  }
  
  // Show loading state
  savePasswordChange.disabled = true;
  document.getElementById('password-save-text').textContent = 'Changing...';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again');
      window.location.href = '../LoginPage.html';
      return;
    }
    
    const response = await fetch('http://localhost:5001/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Password changed successfully!');
      closeChangePasswordModal();
    } else {
      alert(data.message || 'Failed to change password. Please try again.');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    alert('An error occurred. Please try again.');
  } finally {
    // Reset button state
    savePasswordChange.disabled = false;
    document.getElementById('password-save-text').textContent = 'Change Password';
  }
}

// Event Listeners for Change Password
if (changePasswordBtn) {
  changePasswordBtn.addEventListener('click', openChangePasswordModal);
}

if (closePasswordModal) {
  closePasswordModal.addEventListener('click', closeChangePasswordModal);
}

if (cancelPasswordChange) {
  cancelPasswordChange.addEventListener('click', closeChangePasswordModal);
}

if (savePasswordChange) {
  savePasswordChange.addEventListener('click', handlePasswordChange);
}

// Close modal when clicking outside
if (changePasswordModal) {
  changePasswordModal.addEventListener('click', (e) => {
    if (e.target === changePasswordModal) {
      closeChangePasswordModal();
    }
  });
}

// Handle form submission with Enter key
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handlePasswordChange();
  });
}

// Real-time password validation
document.getElementById('confirm-password')?.addEventListener('input', function() {
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = this.value;
  
  if (confirmPassword && newPassword !== confirmPassword) {
    this.style.borderColor = '#dc2626';
  } else {
    this.style.borderColor = '#d1d5db';
  }
});

// Make change password functions globally available
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.handlePasswordChange = handlePasswordChange;
