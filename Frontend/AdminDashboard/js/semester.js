// Semester Management Functions for Admin Dashboard

let currentSemesterPage = 1;
const semesterPageSize = 10;

// Setup semester event listeners
function setupSemesterEventListeners() {
    console.log('🔧 Setting up semester event listeners...');
    
    // Setup form submission
    const semesterForm = document.getElementById('semester-form');
    console.log('📝 Semester form found:', !!semesterForm);
    
    if (semesterForm) {
        // Remove any existing listeners
        semesterForm.removeEventListener('submit', handleSemesterSubmit);
        
        // Add new submit listener
        semesterForm.addEventListener('submit', handleSemesterSubmit);
        
        console.log('✅ Semester form submit listeners attached');
    } else {
        console.error('❌ Semester form not found!');
    }
    
    // Setup search functionality
    const semesterSearchInput = document.getElementById('semester-search');
    const clearSemesterSearchBtn = document.getElementById('clear-semester-search');
    
    if (semesterSearchInput) {
        semesterSearchInput.removeEventListener('input', debounce(filterSemesters, 300));
        semesterSearchInput.addEventListener('input', debounce(filterSemesters, 300));
        
        // Show/hide clear button
        semesterSearchInput.addEventListener('input', function() {
            if (clearSemesterSearchBtn) {
                clearSemesterSearchBtn.style.display = this.value.trim() ? 'flex' : 'none';
            }
        });
    }
    
    if (clearSemesterSearchBtn) {
        clearSemesterSearchBtn.addEventListener('click', function() {
            if (semesterSearchInput) {
                semesterSearchInput.value = '';
                this.style.display = 'none';
                filterSemesters();
            }
        });
    }
    
    // Setup add button
    const addSemesterBtn = document.getElementById('add-semester-btn');
    if (addSemesterBtn) {
        addSemesterBtn.removeEventListener('click', showAddSemesterModal);
        addSemesterBtn.addEventListener('click', showAddSemesterModal);
        console.log('✅ Add semester button listener attached');
    }
}

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
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to load semesters. Please try again.');
        }
    }
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
        const semesterList = data.data || [];
        
        const semesterFilter = document.getElementById('semester-filter');
        if (semesterFilter) {
            semesterFilter.innerHTML = `
                <option value="">All Semesters</option>
                ${semesterList.map(semester => `
                    <option value="${semester.id}">${semester.name}</option>
                `).join('')}
            `;
        }
        
    } catch (error) {
        console.error('Error loading semester filter:', error);
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

// Close add semester modal (alias for consistency with onclick handlers)
function closeAddSemesterModal() {
    closeSemesterModal();
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
    
    const form = event.target;
    const semesterId = form.getAttribute('data-semester-id');
    const isEditing = !!semesterId;
    try {
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
        // Validate required fields with detailed messages
        if (!semesterData.name || semesterData.name.length === 0) {
            console.error('❌ Validation failed: Missing or empty name');
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Semester name is required and cannot be empty');
            }
            return;
        }
        if (!semesterData.academicYear || isNaN(semesterData.academicYear) || semesterData.academicYear < 2020 || semesterData.academicYear > 2050) {
            console.error('❌ Validation failed: Invalid academic year:', semesterData.academicYear);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Academic year must be a valid year between 2020 and 2050');
            }
            return;
        }
        if (!semesterData.semesterNumber || isNaN(semesterData.semesterNumber) || semesterData.semesterNumber < 1 || semesterData.semesterNumber > 3) {
            console.error('❌ Validation failed: Invalid semester number:', semesterData.semesterNumber);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Please select a valid semester number (1, 2, or 3)');
            }
            return;
        }
        if (!semesterData.startDate || semesterData.startDate === '') {
            console.error('❌ Validation failed: Missing start date');
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Start date is required');
            }
            return;
        }
        if (!semesterData.endDate || semesterData.endDate === '') {
            console.error('❌ Validation failed: Missing end date');
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('End date is required');
            }
            return;
        }
        // Validate date logic
        const startDate = new Date(semesterData.startDate);
        const endDate = new Date(semesterData.endDate);
        if (startDate >= endDate) {
            console.error('❌ Validation failed: End date must be after start date');
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('End date must be after start date');
            }
            return;
        }
        console.log('✅ Validation passed');
        const token = localStorage.getItem('token');
        const url = isEditing 
            ? `http://localhost:5001/api/semesters/${semesterId}`
            : 'http://localhost:5001/api/semesters';
        console.log('🌐 Making API call to:', url);
        const response = await fetch(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(semesterData)
        });
        if (!response.ok) {
            const responseText = await response.text();
            let errorMessage = 'Failed to save semester';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                console.error('❌ Could not parse error response:', parseError);
            }
            throw new Error(errorMessage);
        }
        console.log('✅ Semester saved successfully!');
        // Reload semesters and close modal
        await loadSemesters(currentSemesterPage);
        closeSemesterModal();
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage(isEditing ? 'Semester updated successfully!' : 'Semester created successfully!');
        }
    } catch (error) {
        console.error('💥 Error saving semester:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(error.message || 'Failed to save semester. Please try again.');
        }
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

// Helper function to fix invalid dates
function fixInvalidDate(dateString) {
    console.log('🔧 Attempting to fix invalid date:', dateString);
    
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[2]);
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    
    // If day is greater than the last day of the month, set it to the last day
    if (day > lastDayOfMonth) {
        day = lastDayOfMonth;
    }
    
    const fixedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Verify the fixed date is valid
    const testDate = new Date(fixedDate);
    if (isNaN(testDate.getTime())) {
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
        
        const response = await fetch(`http://localhost:5001/api/semesters/${semesterId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch semester data: ${response.status}`);
        }
        
        const result = await response.json();
        const semester = result.data;
        console.log('📋 Semester data loaded:', semester);
        
        const form = document.getElementById('semester-form');
        const title = document.getElementById('semester-modal-title');
        const modal = document.getElementById('semester-modal');
        
        if (form && title && modal) {
            title.textContent = 'Edit Semester';
            form.setAttribute('data-semester-id', semesterId);
            
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
            
            // Set each field
            Object.entries(fields).forEach(([fieldId, value]) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                }
            });
            
            // Update submit button text
            const submitText = document.getElementById('semester-submit-text');
            if (submitText) {
                submitText.textContent = 'Update Semester';
            }
            
            modal.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('💥 Error loading semester for edit:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to load semester data. Please try again.');
        }
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
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('Semester deleted successfully!');
        }
        
    } catch (error) {
        console.error('Error deleting semester:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(error.message || 'Failed to delete semester. Please try again.');
        }
    }
}

// Filter semesters
function filterSemesters() {
    const searchInput = document.getElementById('semester-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    console.log('🔍 Filtering semesters with search term:', searchTerm);
    
    const filters = {};
    
    if (searchTerm) {
        filters.search = searchTerm;
    }
    
    // Update search results count display
    if (searchTerm && typeof updateSearchResultsCount === 'function') {
        updateSearchResultsCount('semesters', 0, searchTerm);
    }
    
    loadSemesters(1, filters);
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

// Wrapper function for creating a semester
async function createSemester(semesterData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/semesters', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(semesterData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create semester');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating semester:', error);
        throw error;
    }
}

// Wrapper function for updating a semester
async function updateSemester(semesterId, semesterData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/semesters/${semesterId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(semesterData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update semester');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating semester:', error);
        throw error;
    }
}

// Setup semester module event listeners
function setupSemesterListeners() {
    console.log('Setting up semester module listeners...');
    
    // Setup semester form submission
    const semesterForm = document.getElementById('semester-form');
    if (semesterForm) {
        semesterForm.addEventListener('submit', handleSemesterSubmit);
    }
    
    // Setup search functionality  
    const searchInput = document.getElementById('semesters-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterSemesters, 300));
    }
    
    console.log('Semester module listeners setup complete');
}

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.testSemesterForm = testSemesterForm;
    window.loadSemesters = loadSemesters;
    window.editSemester = editSemester;
    window.deleteSemester = deleteSemester;
    window.showAddSemesterModal = showAddSemesterModal;
    window.closeAddSemesterModal = closeAddSemesterModal;
    window.createSemester = createSemester;
    window.updateSemester = updateSemester;
    window.setupSemesterListeners = setupSemesterListeners;
    window.setupSemesterEventListeners = setupSemesterEventListeners;
}
