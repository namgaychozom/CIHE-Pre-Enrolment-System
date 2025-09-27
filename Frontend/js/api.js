// API Configuration
const API_BASE_URL = 'http://localhost:5001/api';

function toggleStudentFields() {
    // console.log('🔄 toggleStudentFields called');
    // alert('Function called! User type: ' + document.getElementById("userType").value);
    
    const userType = document.getElementById("userType");
    const studentFields = document.getElementById("studentFields");
    
    if (!userType || !studentFields) {
      console.error('❌ Elements not found:', { userType: !!userType, studentFields: !!studentFields });
      alert('ERROR: Elements not found!');
      return;
    }
    
    const userTypeValue = userType.value;
    console.log('📋 Current user type:', userTypeValue);
    
    if (userTypeValue === 'STUDENT') {
      // Show student fields
      studentFields.classList.remove('hidden');
      
      // Make student fields required
      const requiredStudentFields = studentFields.querySelectorAll('input, select');
      requiredStudentFields.forEach(field => {
        if (field.id === 'firstName' || field.id === 'lastName' || field.id === 'program' || field.id === 'yearLevel') {
          field.setAttribute('required', 'required');
        }
      });
      
    //   console.log('✅ Student fields SHOWN');
    //   alert('Student fields SHOWN');
      
    } else if (userTypeValue === 'STAFF' || userTypeValue === 'ADMIN') {
      // Hide student fields for STAFF and ADMIN
      studentFields.classList.add('hidden');
      
      // Remove all required attributes from student fields
      const allStudentFields = studentFields.querySelectorAll('input, select, textarea');
      allStudentFields.forEach(field => {
        field.removeAttribute('required');
        
        // Clear field values when hidden
        if (field.tagName === 'SELECT') {
          field.selectedIndex = 0;
        } else {
          field.value = '';
        }
      });
      
    //   console.log('❌ Student fields HIDDEN for:', userTypeValue);
    //   alert('Student fields HIDDEN for: ' + userTypeValue);
      
    } else {
      console.log('⚠️ Unknown user type:', userTypeValue);
    //   alert('Unknown user type: ' + userTypeValue);
    }
  }

// Initialize student fields visibility on page load
function initializeStudentFields() {
    // Only initialize if the required elements exist (i.e., we're on the registration page)
    const userType = document.getElementById("userType");
    const studentFields = document.getElementById("studentFields");
    
    if (!userType || !studentFields) {
        // Elements don't exist, probably not on registration page - skip initialization
        console.log('👍 Registration form elements not found - skipping student fields initialization');
        return;
    }
    
    // Elements exist, proceed with initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 DOM loaded, initializing student fields');
            toggleStudentFields();
        });
    } else {
        // DOM is already ready
        console.log('🚀 DOM already ready, initializing student fields');
        toggleStudentFields();
    }
}

// Auto-initialize when this script loads (but only if elements exist)
initializeStudentFields();


// Utility function to get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Utility function to get user data
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Utility function to check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Utility function to logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../LoginPage.html';
}

// API call wrapper with authentication
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Handle unauthorized responses
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        console.log('✅ API call successful:', { endpoint, options, response, data });
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Authentication API calls
const authAPI = {
    login: (email, password) => 
        apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),
    
    register: (userData) =>
        apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
    
    getProfile: () =>
        apiCall('/auth/profile'),
    
    updateProfile: (profileData) =>
        apiCall('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        }),
    
    changePassword: (currentPassword, newPassword) =>
        apiCall('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        }),
    
    logout: () =>
        apiCall('/auth/logout', { method: 'POST' })
};

// Enrollment API calls
const enrollmentAPI = {
    // Student-specific enrollment endpoints
    getMyEnrollments: () =>
        apiCall('/enrollments/my-enrollments'),
    
    createMyEnrollment: (enrollmentData) =>
        apiCall('/enrollments/my-enrollments', {
            method: 'POST',
            body: JSON.stringify(enrollmentData)
        }),
    
    updateMyEnrollment: (id, enrollmentData) =>
        apiCall(`/enrollments/my-enrollments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(enrollmentData)
        }),
    
    deleteMyEnrollment: (id) =>
        apiCall(`/enrollments/my-enrollments/${id}`, { method: 'DELETE' }),

    // Submit enrollment (alias for createMyEnrollment)
    submitEnrollment: (enrollmentData) =>
        apiCall('/enrollments/my-enrollments', {
            method: 'POST',
            body: JSON.stringify(enrollmentData)
        }),

    // Admin endpoints (for backwards compatibility)
    getEnrollments: () =>
        apiCall('/enrollments'),
    
    createEnrollment: (enrollmentData) =>
        apiCall('/enrollments', {
            method: 'POST',
            body: JSON.stringify(enrollmentData)
        }),
    
    updateEnrollment: (id, enrollmentData) =>
        apiCall(`/enrollments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(enrollmentData)
        }),
    
    deleteEnrollment: (id) =>
        apiCall(`/enrollments/${id}`, { method: 'DELETE' })
};

// Units API calls
const unitsAPI = {
    getUnits: () =>
        apiCall('/units'),
    
    getUnit: (id) =>
        apiCall(`/units/${id}`),
    
    createUnit: (unitData) =>
        apiCall('/units', {
            method: 'POST',
            body: JSON.stringify(unitData)
        }),
    
    updateUnit: (id, unitData) =>
        apiCall(`/units/${id}`, {
            method: 'PUT',
            body: JSON.stringify(unitData)
        }),
    
    deleteUnit: (id) =>
        apiCall(`/units/${id}`, { method: 'DELETE' })
};

// Users API calls (Admin only)
const usersAPI = {
    getUsers: () =>
        apiCall('/users'),
    
    getUser: (id) =>
        apiCall(`/users/${id}`),
    
    updateUser: (id, userData) =>
        apiCall(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        }),
    
    deleteUser: (id) =>
        apiCall(`/users/${id}`, { method: 'DELETE' })
};

// Notifications API calls
const notificationsAPI = {
    // Admin functions
    getNotifications: (params = {}) =>
        apiCall(`/notifications?${new URLSearchParams(params)}`),
    
    createNotification: (notificationData) =>
        apiCall('/notifications', {
            method: 'POST',
            body: JSON.stringify(notificationData)
        }),
    
    updateNotification: (id, notificationData) =>
        apiCall(`/notifications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(notificationData)
        }),
    
    toggleNotificationStatus: (id) =>
        apiCall(`/notifications/${id}/toggle`, { method: 'PATCH' }),
    
    deleteNotification: (id) =>
        apiCall(`/notifications/${id}`, { method: 'DELETE' }),
    
    // Student/General functions
    getActiveNotifications: () =>
        apiCall('/notifications/active'),
    
    getNotification: (id) =>
        apiCall(`/notifications/${id}`)
};

// Timeslots API calls
const timeslotsAPI = {
    getTimeslots: () =>
        apiCall('/timeslots'),
    
    createTimeslot: (timeslotData) =>
        apiCall('/timeslots', {
            method: 'POST',
            body: JSON.stringify(timeslotData)
        }),
    
    updateTimeslot: (id, timeslotData) =>
        apiCall(`/timeslots/${id}`, {
            method: 'PUT',
            body: JSON.stringify(timeslotData)
        }),
    
    deleteTimeslot: (id) =>
        apiCall(`/timeslots/${id}`, { method: 'DELETE' })
};

// Days API calls
const daysAPI = {
    getDays: () =>
        apiCall('/days'),
    
    createDay: (dayData) =>
        apiCall('/days', {
            method: 'POST',
            body: JSON.stringify(dayData)
        }),
    
    updateDay: (id, dayData) =>
        apiCall(`/days/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dayData)
        }),
    
    deleteDay: (id) =>
        apiCall(`/days/${id}`, { method: 'DELETE' })
};

const semestersAPI = {
    getSemesters: () =>
        apiCall('/semesters'),

    getActiveSemesters: () =>
        apiCall('/semesters/active'),

    getSemester: (id) =>
        apiCall(`/semesters/${id}`),

    createSemester: (semesterData) =>
        apiCall('/semesters', {
            method: 'POST',
            body: JSON.stringify(semesterData)
        }),

    updateSemester: (id, semesterData) =>
        apiCall(`/semesters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(semesterData)
        }),

    deleteSemester: (id) =>
        apiCall(`/semesters/${id}`, { method: 'DELETE' })
};

// Protection for authenticated pages
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '../LoginPage.html';
        return false;
    }
    return true;
}

// Check user role
function hasRole(requiredRole) {
    const user = getCurrentUser();
    return user && user.role === requiredRole;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        authAPI,
        enrollmentAPI,
        unitsAPI,
        usersAPI,
        notificationsAPI,
        timeslotsAPI,
        daysAPI,
        semestersAPI,
        getAuthToken,
        getCurrentUser,
        isAuthenticated,
        logout,
        requireAuth,
        hasRole
    };
} else {
    // Browser environment - make objects globally available
    window.authAPI = authAPI;
    window.enrollmentAPI = enrollmentAPI;
    window.unitsAPI = unitsAPI;
    window.usersAPI = usersAPI;
    window.notificationsAPI = notificationsAPI;
    window.timeslotsAPI = timeslotsAPI;
    window.daysAPI = daysAPI;
    window.semestersAPI = semestersAPI;
    window.getAuthToken = getAuthToken;
    window.getCurrentUser = getCurrentUser;
    window.isAuthenticated = isAuthenticated;
    window.logout = logout;
    window.requireAuth = requireAuth;
    window.hasRole = hasRole;
}
