// Application State
let currentView = 'dashboard';
let currentTab = 'dashboard';
let currentStep = 1;
let selectedCourses = [];
let selectedAvailability = {};
let isSubmitting = false;

// Mock Data
const mockCourses = [
  {
    id: 'ICT104',
    code: 'ICT104',
    name: 'Fundamentals of Computability',
    credits: 10,
    schedule: 'Tue/Thu 8:15am - 11:15am',
    prerequisites: ['ICT103'],
    suggested: true,
    instructor: 'Dr. Brown',
    description: 'An introduction to theoretical computer science, covering topics such as finite automata, regular languages, context-free grammars, and Turing machines.',
    seats: { total: 30, available: 12 }
  },
  {
    id: 'ICT105',
    code: 'ICT105',
    name: 'Advanced Programming',
    credits: 10,
    schedule: 'Mon/Wed 2:45pm - 5:45pm',
    suggested: true,
    instructor: 'Prof. Davis',
    description: 'Advanced programming concepts including data structures, algorithms, design patterns, and software architecture.',
    seats: { total: 25, available: 8 }
  },
  {
    id: 'ICT106',
    code: 'ICT106',
    name: 'Database Systems',
    credits: 10,
    schedule: 'Tue/Thu 11:30am - 2:30pm',
    suggested: true,
    instructor: 'Dr. Martinez',
    description: 'Comprehensive study of database systems including design, implementation, and management of relational databases.',
    seats: { total: 30, available: 15 }
  },
  {
    id: 'ICT107',
    code: 'ICT107',
    name: 'Web Technologies',
    credits: 10,
    schedule: 'Mon/Wed 8:15am - 11:15am',
    instructor: 'Prof. Anderson',
    description: 'Modern web development technologies including HTML5, CSS3, JavaScript, and popular frameworks.',
    seats: { total: 35, available: 20 }
  },
  {
    id: 'ICT108',
    code: 'ICT108',
    name: 'Network Fundamentals',
    credits: 10,
    schedule: 'Fri 11:30am - 2:30pm',
    instructor: 'Dr. Wilson',
    description: 'Introduction to computer networks, protocols, and network security fundamentals.',
    seats: { total: 28, available: 18 }
  },
  {
    id: 'ICT109',
    code: 'ICT109',
    name: 'Software Engineering',
    credits: 10,
    schedule: 'Mon/Fri 6:00pm - 9:00pm',
    instructor: 'Dr. Thompson',
    description: 'Software development lifecycle, project management, and team collaboration in software projects.',
    seats: { total: 32, available: 22 }
  }
];

let mockNotifications = [
  {
    id: '1',
    type: 'enrollment',
    title: 'Pre-enrollment is now open',
    message: 'Pre-enrollment for Semester 1, 2025 is now available. Select your units and available time blocks by March 15th.',
    date: '2024-01-20',
    read: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'assignment', 
    title: 'Assignment due soon',
    message: 'Your ICT101 assignment "Algorithm Analysis" is due in 3 days.',
    date: '2024-01-19',
    read: false,
    priority: 'high'
  },
  {
    id: '3',
    type: 'info',
    title: 'Timetable will be generated',
    message: 'Once pre-enrollment closes, your timetable will be generated based on your unit selections and availability.',
    date: '2024-01-18',
    read: true,
    priority: 'medium'
  },
  {
    id: '4',
    type: 'success',
    title: 'Profile updated successfully',
    message: 'Your student profile has been updated with the latest information.',
    date: '2024-01-17',
    read: true,
    priority: 'low'
  },
  {
    id: '5',
    type: 'warning',
    title: 'Class schedule information',
    message: 'Please ensure you select units carefully as changes after enrollment may not be possible.',
    date: '2024-01-16',
    read: false,
    priority: 'medium'
  },
  {
    id: '6',
    type: 'enrollment',
    title: 'Unit selection reminder',
    message: 'Remember to complete your unit selection and set your available time blocks for optimal timetable generation.',
    date: '2024-01-15',
    read: true,
    priority: 'medium'
  }
];

const timeSlots = [
  '8:15am - 11:15am',
  '11:30am - 2:30pm', 
  '2:45pm - 5:45pm',
  '6:00pm - 9:00pm'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  initializeApp();
});

function initializeApp() {
  console.log('Initializing app...');
  setupEventListeners();
  showView('dashboard');
  showTab('dashboard');
  populateUnitsTab();
  populateNotifications();
  updateNotificationBadge();
  
  // Initialize icons after a short delay to ensure DOM is ready
  setTimeout(() => {
    initializeIcons();
  }, 100);
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

function setupEventListeners() {
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
  
  if (prevBtn) prevBtn.addEventListener('click', previousStep);
  if (nextBtn) nextBtn.addEventListener('click', nextStep);
  if (submitBtn) submitBtn.addEventListener('click', submitForm);

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
      initializeForm();
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

// Units Tab Management
function populateUnitsTab() {
  console.log('Populating units tab...');
  const searchTerm = document.getElementById('units-search')?.value.toLowerCase() || '';
  const filter = document.getElementById('units-filter')?.value || 'all';
  
  const filteredCourses = getFilteredCourses(searchTerm, filter);
  const suggestedCourses = filteredCourses.filter(course => course.suggested);
  const otherCourses = filteredCourses.filter(course => !course.suggested);

  // Populate suggested units
  const suggestedGrid = document.getElementById('suggested-units-grid');
  const suggestedSection = document.getElementById('suggested-units-section');
  
  if (suggestedGrid && suggestedSection) {
    if ((filter === 'all' || filter === 'suggested') && suggestedCourses.length > 0) {
      suggestedSection.style.display = 'block';
      suggestedGrid.innerHTML = suggestedCourses.map(course => createUnitCard(course, true)).join('');
    } else {
      suggestedSection.style.display = 'none';
    }
  }

  // Populate all units
  const allGrid = document.getElementById('all-units-grid');
  const allSection = document.getElementById('all-units-section');
  
  if (allGrid && allSection) {
    const displayCourses = filter === 'all' ? otherCourses : (filter !== 'suggested' ? filteredCourses.filter(c => !c.suggested) : []);
    
    if (displayCourses.length > 0) {
      allSection.style.display = 'block';
      allGrid.innerHTML = displayCourses.map(course => createUnitCard(course, false)).join('');
    } else if (filter !== 'suggested') {
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
  return mockCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm) ||
                         course.code.toLowerCase().includes(searchTerm) ||
                         course.instructor.toLowerCase().includes(searchTerm);
    
    switch (filter) {
      case 'suggested': return matchesSearch && course.suggested;
      case 'available': return matchesSearch && course.seats.available > 0;
      case 'full': return matchesSearch && course.seats.available === 0;
      default: return matchesSearch;
    }
  });
}

function createUnitCard(course, isDetailed = false) {
  const lowSeats = course.seats.available <= 5;
  
  return `
    <div class="card">
      <div class="card-header">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="card-title flex items-center gap-2">
              ${course.code}
              ${course.suggested ? '<span class="badge badge-secondary">Suggested</span>' : ''}
            </h3>
            <p class="card-description">${course.name}</p>
          </div>
          <div class="flex items-center space-x-2">
            <span class="badge badge-outline">${course.credits} credits</span>
            
          </div>
        </div>
      </div>
      <div class="card-content">
        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span>Instructor:</span>
            <span class="font-medium">${course.instructor}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span>Schedule:</span>
            <span class="font-medium">${course.schedule}</span>
          </div>
          ${course.prerequisites ? `
            <div class="text-sm">
              <span class="text-red-600">Prerequisites: </span>
              <span>${course.prerequisites.join(', ')}</span>
            </div>
          ` : ''}
          <p class="text-sm text-gray-600">${course.description}</p>
          <button class="btn btn-primary btn-sm w-full" 
                  ${course.seats.available === 0 ? 'disabled' : ''}
                  onclick="showView('form')">
            ${course.seats.available > 0 ? 'Select This Unit' : 'Unit Full'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function filterUnitsTab() {
  populateUnitsTab();
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
  return mockNotifications.filter(notification => {
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

function createNotificationCard(notification) {
  const priorityClass = getPriorityBadgeClass(notification.priority);
  const iconClass = getNotificationIconClass(notification.type);
  const colorClass = getNotificationColorClass(notification.type);
  
  return `
    <div class="card ${!notification.read ? 'notification-unread' : ''}">
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
              </h3>
              <div class="flex items-center space-x-2">
                <span class="badge ${priorityClass}">${notification.priority}</span>
                <span class="text-xs text-gray-500">${notification.date}</span>
              </div>
            </div>
            <p class="text-gray-600 text-sm mb-3">${notification.message}</p>
            <div class="flex items-center space-x-2">
              ${!notification.read ? `
                <button class="btn btn-outline btn-sm" onclick="markNotificationRead('${notification.id}')">
                  Mark as Read
                </button>
              ` : ''}
              <button class="btn btn-ghost btn-sm text-red-600" onclick="dismissNotification('${notification.id}')">
                Dismiss
              </button>
            </div>
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

function markNotificationRead(id) {
  console.log('Marking notification as read:', id);
  const notification = mockNotifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    populateNotifications();
    updateNotificationBadge();
  }
}

function dismissNotification(id) {
  console.log('Dismissing notification:', id);
  const index = mockNotifications.findIndex(n => n.id === id);
  if (index !== -1) {
    mockNotifications.splice(index, 1);
    populateNotifications();
    updateNotificationBadge();
  }
}

function markAllNotificationsRead() {
  console.log('Marking all notifications as read');
  mockNotifications.forEach(notification => {
    notification.read = true;
  });
  populateNotifications();
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const unreadCount = mockNotifications.filter(n => !n.read).length;
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
function initializeForm() {
  console.log('Initializing form...');
  currentStep = 1;
  selectedCourses = [];
  selectedAvailability = {};
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
  return selectedCourses.length > 0 && 
         Object.values(selectedAvailability).reduce((sum, times) => sum + times.length, 0) >= 3;
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
  const container = document.getElementById('course-selection');
  if (!container) return;

  const suggestedCourses = mockCourses.filter(course => course.suggested);
  const otherCourses = mockCourses.filter(course => !course.suggested);

  let html = '<h3 class="font-medium mb-3">Suggested Units for Bachelor of Information Technology - Semester 1</h3>';
  html += '<div class="space-y-3">';
  
  suggestedCourses.forEach(course => {
    const isSelected = selectedCourses.includes(course.id);
    // html += `
    //   <div class="course-card ${isSelected ? 'selected' : ''}" data-course-id="${course.id}">
    //     <div class="flex items-start justify-between">
    //       <div class="flex-1">
    //         <div class="flex items-center gap-2 mb-2">
    //           <h4>${course.code}</h4>
    //           <span class="badge badge-secondary">Suggested</span>
    //         </div>
    //         <p class="text-sm text-gray-600 mb-2">${course.name}</p>
    //         <div class="text-xs text-gray-500 space-y-1">
    //           <p>${course.credits} credits | ${course.instructor}</p>
    //           <p>${course.schedule}</p>
    //           <p class="text-green-600">${course.seats.available}/${course.seats.total} seats available</p>
    //         </div>
    //         ${course.prerequisites ? `<p class="text-xs text-red-600 mt-1">Prerequisites: ${course.prerequisites.join(', ')}</p>` : ''}
    //       </div>
    //       <input type="checkbox" ${isSelected ? 'checked' : ''}>
    //     </div>
    //   </div>
    // `;
    html += `
      <div class="course-card ${isSelected ? 'selected' : ''}" data-course-id="${course.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h4>${course.code}</h4>
              <span class="badge badge-secondary">Suggested</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">${course.name}</p>
            <div class="text-xs text-gray-500 space-y-1">
              <p>${course.credits} credits | ${course.instructor}</p>
              <p>${course.schedule}</p>
            </div>
            ${course.prerequisites ? `<p class="text-xs text-red-600 mt-1">Prerequisites: ${course.prerequisites.join(', ')}</p>` : ''}
          </div>
          <input type="checkbox" ${isSelected ? 'checked' : ''}>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  html += '<h3 class="font-medium mb-3 mt-6">All Available Units</h3>';
  html += '<div class="space-y-2">';
  
  otherCourses.forEach(course => {
    const isSelected = selectedCourses.includes(course.id);
    html += `
      <div class="course-card ${isSelected ? 'selected' : ''}" data-course-id="${course.id}">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium">${course.code}</span>
              <span class="text-gray-600">${course.name}</span>
              <span class="text-sm text-gray-500">(${course.credits} credits)</span>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span>${course.instructor}</span>
              <span>${course.schedule}</span>
            </div>
          </div>
          <input type="checkbox" ${isSelected ? 'checked' : ''}>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;

  // Add event listeners
  container.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', () => toggleCourse(card.dataset.courseId));
  });

  updateSelectedSummary();
}

function toggleCourse(courseId) {
  if (selectedCourses.includes(courseId)) {
    selectedCourses = selectedCourses.filter(id => id !== courseId);
  } else {
    if (selectedCourses.length < 6) {
      selectedCourses.push(courseId);
    }
  }
  
  renderCourseSelection();
  updateFormStep();
}

function updateSelectedSummary() {
  const summaryElement = document.getElementById('selected-summary');
  const countElement = document.getElementById('selected-count');
  const listElement = document.getElementById('selected-list');
  const creditsElement = document.getElementById('total-credits');
  
  if (!summaryElement) return;
  
  if (selectedCourses.length > 0) {
    summaryElement.style.display = 'block';
    
    if (countElement) countElement.textContent = selectedCourses.length;
    
    const totalCredits = selectedCourses.reduce((sum, courseId) => {
      const course = mockCourses.find(c => c.id === courseId);
      return sum + (course ? course.credits : 0);
    }, 0);
    
    if (creditsElement) creditsElement.textContent = totalCredits;
    
    if (listElement) {
      listElement.innerHTML = selectedCourses.map(courseId => {
        const course = mockCourses.find(c => c.id === courseId);
        return course ? `
          <div class="text-sm text-green-700 flex items-center justify-between">
            <span>${course.code} - ${course.name}</span>
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
          <div class="text-blue-700">
            <span class="font-medium">${day}:</span> ${times.length} time block${times.length > 1 ? 's' : ''}
          </div>
        `).join('');
    }
  } else {
    summaryElement.style.display = 'none';
  }
}

// Review Step
function updateReviewStep() {
  updateReviewUnits();
  updateReviewAvailability();
}

function updateReviewUnits() {
  const container = document.getElementById('review-units');
  const creditsElement = document.getElementById('review-total-credits');
  
  if (!container) return;
  
  const totalCredits = selectedCourses.reduce((sum, courseId) => {
    const course = mockCourses.find(c => c.id === courseId);
    return sum + (course ? course.credits : 0);
  }, 0);
  
  if (creditsElement) creditsElement.textContent = totalCredits;
  
  container.innerHTML = selectedCourses.map(courseId => {
    const course = mockCourses.find(c => c.id === courseId);
    return course ? `
      <div class="flex items-center justify-between p-3 border rounded mb-3">
        <div>
          <p class="font-medium">${course.code} - ${course.name}</p>
          <p class="text-sm text-gray-500">${course.instructor} | ${course.schedule}</p>
        </div>
        <div class="text-right">
          <span class="badge badge-outline">${course.credits} credits</span>
        </div>
      </div>
    ` : '';
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

// Form Submission
async function submitForm() {
  if (!canSubmitForm() || isSubmitting) return;
  
  isSubmitting = true;
  const submitBtn = document.getElementById('submit-form');
  const submitText = document.getElementById('submit-text');
  
  if (submitBtn) submitBtn.disabled = true;
  if (submitText) submitText.innerHTML = '<div class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>Submitting...';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('Your unit selections and availability have been successfully submitted to the admin for timetable generation! You will be notified once your timetable is ready.');
    
    // Reset and go back to dashboard
    selectedCourses = [];
    selectedAvailability = {};
    showView('dashboard');
  } catch (error) {
    alert('There was an error submitting your form. Please try again.');
  } finally {
    isSubmitting = false;
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.innerHTML = 'Submit to Admin';
  }
}

// Make functions available globally
window.toggleCourse = toggleCourse;
window.showView = showView;
window.markNotificationRead = markNotificationRead;
window.dismissNotification = dismissNotification;