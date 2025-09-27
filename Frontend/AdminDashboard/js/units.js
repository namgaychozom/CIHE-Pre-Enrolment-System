// Helper function to update search results count
function updateSearchResultsCount(type, count, searchTerm) {
    // Optionally update a UI element with the count, or just log it
    console.log(`Found ${count} ${type} matching "${searchTerm}"`);
}
// Units Management Functions for Admin Dashboard

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

            for (let unit of adminData.units) {
                unit.enrollmentCount = await getUnitEnrolledCount(unit.id);
            }

            console.log('✅ Loaded admin units:', adminData.units.length);
            console.log('📋 Units data:', adminData.units);
            console.log('🏷️ Current admin tab:', getCurrentTab());
            
            // Always update units display when units are loaded
            console.log('🔄 Calling populateAdminUnits...');
            populateAdminUnits();
        }
    } catch (error) {
        console.error('❌ Error loading admin units:', error);
        adminData.units = [];
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
    
    // Setup add unit button
    const addUnitBtn = document.getElementById('add-unit-btn');
    if (addUnitBtn) {
        addUnitBtn.removeEventListener('click', showAddUnitModal);
        addUnitBtn.addEventListener('click', showAddUnitModal);
        console.log('✅ Add unit button listener attached');
    } else {
        console.error('❌ Add unit button not found!');
    }
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
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to search units. Please try again.');
        }
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
                        <p><strong>Total Students Enrolled:</strong> ${unit.enrollmentCount || 0}</p>
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
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2v2"/>
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

async function getUnitEnrolledCount(unitId){
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5001/api/enrollments/unit/${unitId}`, {
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
    console.log(`📊 Found ${unitsData.length} enrollments for unit ID ${unitId}`);
    return unitsData.length;

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
    container.innerHTML = adminData.units.map(unit => {
        // Count total students enrolled in this unit
        console.log('📊 Counting enrollments for unit:', unit);
        console.log('📊 AdminData:', adminData);


      
        return `
        <div class="card">
            <div class="card-content">
                <div class="unit-header">
                    <h3 class="unit-title">${unit.title}</h3>
                </div>
                <div class="unit-details">
                    <p><strong>Unit Code:</strong> ${unit.unitCode}</p>
                    <p><strong>Credits:</strong> ${unit.credits}</p>
                    <p><strong>Description:</strong> ${unit.description || 'N/A'}</p>
                    <p><strong>Total Students Enrolled:</strong> ${unit.enrollmentCount || 0}</p>
                </div>
                <div class="unit-actions">
                    <button class="btn-outline small btn-green" onclick="editUnit('${unit.id}')">Edit</button>
                    <button class="btn-outline small btn-red" onclick="deleteUnit('${unit.id}')">Delete</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Show add unit modal
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

// Close unit modal
function closeUnitModal() {
    const modal = document.getElementById('unit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close add unit modal (alias for consistency with onclick handlers)
function closeAddUnitModal() {
    closeUnitModal();
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
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Please fill in all required fields');
        }
        return;
    }
    
    if (isNaN(unitData.credits) || unitData.credits <= 0) {
        console.error('❌ Validation failed: Invalid credits');
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Credits must be a positive number');
        }
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
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage(isEditing ? 'Unit updated successfully!' : 'Unit created successfully!');
        }
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
        
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(errorMessage);
        }
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

// Edit unit
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
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to load unit data. Please try again.');
        }
    }
}

// Delete unit
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
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('Unit deleted successfully!');
        }
        
    } catch (error) {
        console.error('Error deleting unit:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage(error.message || 'Failed to delete unit. Please try again.');
        }
    }
}

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

// Setup units module event listeners
// Wrapper function for creating a unit
async function createUnit(unitData) {
    try {
        const response = await unitsAPI.createUnit(unitData);
        return response;
    } catch (error) {
        console.error('Error creating unit:', error);
        throw error;
    }
}

// Wrapper function for updating a unit
async function updateUnit(unitId, unitData) {
    try {
        const response = await unitsAPI.updateUnit(unitId, unitData);
        return response;
    } catch (error) {
        console.error('Error updating unit:', error);
        throw error;
    }
}

// Wrapper function for updating a unit
async function updateUnit(unitId, unitData) {
    try {
        const response = await unitsAPI.updateUnit(unitId, unitData);
        return response;
    } catch (error) {
        console.error('Error updating unit:', error);
        throw error;
    }
}

// Setup units module event listeners
function setupUnitsListeners() {
    console.log('🔧 Setting up units event listeners...');
    setupUnitEventListeners();
    console.log('✅ Units event listeners setup complete');
}

// Export functions to global scope for onclick handlers
if (typeof window !== 'undefined') {
    window.loadAdminUnits = loadAdminUnits;
    window.populateAdminUnits = populateAdminUnits;
    window.showAddUnitModal = showAddUnitModal;
    window.closeUnitModal = closeUnitModal;
    window.closeAddUnitModal = closeAddUnitModal;
    window.editUnit = editUnit;
    window.deleteUnit = deleteUnit;
    window.handleUnitSubmit = handleUnitSubmit;
    window.filterUnits = filterUnits;
    window.setupUnitsListeners = setupUnitsListeners;
    window.createUnit = createUnit;
    window.updateUnit = updateUnit;
    window.testAddUnit = testAddUnit;
}
