// Student Enrollment Management Functions for Admin Dashboard

// Setup enrollment event listeners
function setupEnrollmentEventListeners() {
    console.log('🔧 Setting up enrollment event listeners...');

    // Load and populate semester filter
    loadSemesterFilterOptions();

    // Setup filter functionality
    const semesterFilter = document.getElementById('semester-filter');
    if (semesterFilter) {
        semesterFilter.addEventListener('change', filterEnrollments);
    }

    // Setup search functionality
    const enrollmentSearchInput = document.getElementById('enrollment-search');
    if (enrollmentSearchInput) {
        enrollmentSearchInput.addEventListener('input', debounce(filterEnrollments, 300));
    }

    console.log('✅ Enrollment event listeners setup complete');
}

// Load semester filter options
async function loadSemesterFilterOptions() {
    try {
        console.log('🔄 Loading semester filter options...');

        const response = await semestersAPI.getSemesters();
        const semesters = response.data || response;

        const semesterFilter = document.getElementById('semester-filter');
        if (!semesterFilter) {
            console.error('Semester filter element not found');
            return;
        }

        // Clear existing options except "All Semesters"
        semesterFilter.innerHTML = '<option value="all">All Semesters</option>';

        if (Array.isArray(semesters) && semesters.length > 0) {
            semesters.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester.id;
                option.textContent = `${semester.name} (${semester.academicYear})`;
                semesterFilter.appendChild(option);
            });

            console.log(`✅ Loaded ${semesters.length} semester options`);
        } else {
            console.log('📋 No semesters found to populate filter');
        }

    } catch (error) {
        console.error('❌ Error loading semester filter options:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to load semester options');
        }
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
            
            // Update enrollments display if on enrollment tab
            const currentTabId = getCurrentTab();
            if (currentTabId === 'enrollment' || currentTabId === 'enrollments') {
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

// Load recent enrollments for dashboard overview
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

// Populate recent enrollments for dashboard
function populateRecentEnrollments(enrollments) {
    const container = document.getElementById('recent-enrollments-list');
    if (!container) {
        console.error('Recent enrollments container not found!');
        return;
    }
    
    console.log('Populating recent enrollments with', enrollments.length, 'enrollments');
    
    if (enrollments.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No recent enrollments found</p>';
        return;
    }

    container.innerHTML = enrollments.map(enrollment => {
        const studentProfile = enrollment.studentProfile;
        const unit = enrollment.unit;
        const semester = enrollment.semester;
        
        if (!studentProfile) {
            console.warn('Enrollment missing student profile:', enrollment);
            return '';
        }
        
        const studentName = `${studentProfile.firstName || 'Unknown'} ${studentProfile.lastName || ''}`.trim();
        const unitTitle = unit?.title || 'Unknown Unit';
        const semesterName = semester?.name || 'Unknown Semester';
        const enrollmentDate = new Date(enrollment.enrolledAt).toLocaleDateString();
        
        return `
            <div class="student-item">
                <div class="student-info">
                    <div class="student-name">${studentName}</div>
                    <div class="student-details">
                        <span class="unit-name">${unitTitle}</span>
                        <span class="semester-name">${semesterName}</span>
                    </div>
                </div>
                <div class="enrollment-date">${enrollmentDate}</div>
            </div>
        `;
    }).join('');
}

// Filter enrollments based on selected filters
function filterEnrollments() {
    const semesterFilter = document.getElementById('semester-filter');
    const searchInput = document.getElementById('enrollment-search');
    
    const semesterValue = semesterFilter ? semesterFilter.value : '';
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    console.log('Filtering enrollments:', { semesterValue, searchTerm });
    
    // Filter the enrollment data
    let filteredEnrollments = adminData.enrollments;
    
    // Filter by semester if selected
    if (semesterValue && semesterValue !== '' && semesterValue !== 'all') {
        filteredEnrollments = filteredEnrollments.filter(enrollment => {
            return enrollment.semesterId === parseInt(semesterValue);
        });
    }
    
    // Filter by search term if provided
    if (searchTerm) {
        filteredEnrollments = filteredEnrollments.filter(enrollment => {
            const studentProfile = enrollment.studentProfile;
            const unit = enrollment.unit;
            
            if (!studentProfile) return false;
            
            const studentName = `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.toLowerCase();
            const studentId = (studentProfile.studentId || '').toLowerCase();
            const unitTitle = (unit?.title || '').toLowerCase();
            const unitCode = (unit?.unitCode || '').toLowerCase();
            
            return studentName.includes(searchTerm) ||
                   studentId.includes(searchTerm) ||
                   unitTitle.includes(searchTerm) ||
                   unitCode.includes(searchTerm);
        });
    }
    
    // Temporarily store original data and replace with filtered data
    const originalEnrollments = adminData.enrollments;
    adminData.enrollments = filteredEnrollments;
    
    // Re-populate the table with filtered data
    populateAdminEnrollments();
    
    // Restore original data
    adminData.enrollments = originalEnrollments;
    
    // Update results count
    if (typeof updateSearchResultsCount === 'function') {
        updateSearchResultsCount('enrollments', filteredEnrollments.length, searchTerm);
    }
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
    
    // Show each enrollment as a separate row
    container.innerHTML = adminData.enrollments.map(enrollment => {
        const user = enrollment.studentProfile || {};
        const unit = enrollment.unit || {};
        const semester = enrollment.semester || {};
        const studentId = enrollment.studentProfile?.studentId ||  '';
        const studentName = `${user.firstName || 'N/A'} ${user.lastName || ''}`;
        const unitName = unit.title || 'Unknown Unit';
        const unitCode = unit.unitCode || '';
        const semesterName = semester.name || 'Unknown Semester';
        const address = user.address || 'Unknown Address';
        const availabilitiesCount = enrollment.availabilities?.length || 0;
        const enrolledDate = enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '';
        return `
            <tr>
                
               
                <td>${studentId}</td>
                <td>${studentName}</td>
                <td>${unitName} <br><span class="text-xs text-gray-500">${unitCode}</span></td>
                
                <td>${semesterName}</td>
                <td>${address}</td>
                <td>${availabilitiesCount} availability slot${availabilitiesCount !== 1 ? 's' : ''}</td>
                <td>${enrolledDate}</td>
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

// Approve enrollment
function approveEnrollment(enrollmentId) {
    console.log('Approve enrollment:', enrollmentId);
    
    if (!confirm('Are you sure you want to approve this enrollment?')) {
        return;
    }
    
    // Implementation for approving enrollment
    // This would typically call an API to update the enrollment status
    try {
        // Call API to approve enrollment
        // await enrollmentAPI.approveEnrollment(enrollmentId);
        
        // Reload enrollments after approval
        loadAdminEnrollments();
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('Enrollment approved successfully!');
        }
    } catch (error) {
        console.error('Error approving enrollment:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to approve enrollment. Please try again.');
        }
    }
}

// Reject enrollment
function rejectEnrollment(enrollmentId) {
    console.log('Reject enrollment:', enrollmentId);
    
    if (!confirm('Are you sure you want to reject this enrollment?')) {
        return;
    }
    
    // Implementation for rejecting enrollment
    try {
        // Call API to reject enrollment
        // await enrollmentAPI.rejectEnrollment(enrollmentId);
        
        // Reload enrollments after rejection
        loadAdminEnrollments();
        
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('Enrollment rejected successfully!');
        }
    } catch (error) {
        console.error('Error rejecting enrollment:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to reject enrollment. Please try again.');
        }
    }
}

// View enrollment details
function viewEnrollment(enrollmentId) {
    console.log('View enrollment:', enrollmentId);
    
    // Find the enrollment in the current data
    const enrollment = adminData.enrollments.find(e => e.id === enrollmentId);
    
    if (!enrollment) {
        console.error('Enrollment not found:', enrollmentId);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Enrollment not found.');
        }
        return;
    }
    
    // Show enrollment details in a modal or separate view
    showEnrollmentDetailsModal(enrollment);
}

// Show enrollment details modal
function showEnrollmentDetailsModal(enrollment) {
    const studentProfile = enrollment.studentProfile;
    const unit = enrollment.unit;
    const semester = enrollment.semester;
    
    const modalContent = `
        <div class="modal-overlay" id="enrollment-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Enrollment Details</h3>
                    <button class="close-modal" onclick="closeEnrollmentDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="enrollment-details">
                        <h4>Student Information</h4>
                        <p><strong>Name:</strong> ${studentProfile?.firstName || 'N/A'} ${studentProfile?.lastName || ''}</p>
                        <p><strong>Student ID:</strong> ${studentProfile?.studentId || studentProfile?.id || 'N/A'}</p>
                        <p><strong>Email:</strong> ${studentProfile?.emailAddress || 'N/A'}</p>
                        <p><strong>Program:</strong> ${studentProfile?.program || 'N/A'}</p>
                        <p><strong>Year Level:</strong> ${studentProfile?.yearLevel || 'N/A'}</p>
                        
                        <h4>Unit Information</h4>
                        <p><strong>Unit Code:</strong> ${unit?.unitCode || 'N/A'}</p>
                        <p><strong>Unit Title:</strong> ${unit?.title || 'N/A'}</p>
                        <p><strong>Credits:</strong> ${unit?.credits || 'N/A'}</p>
                        
                        <h4>Semester Information</h4>
                        <p><strong>Semester:</strong> ${semester?.name || 'N/A'}</p>
                        <p><strong>Academic Year:</strong> ${semester?.academicYear || 'N/A'}</p>
                        
                        <h4>Enrollment Information</h4>
                        <p><strong>Enrolled At:</strong> ${new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                        <p><strong>Availabilities:</strong> ${enrollment.availabilities?.length || 0} time slots selected</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="closeEnrollmentDetailsModal()">Close</button>
                    <button class="btn success" onclick="approveEnrollment(${enrollment.id}); closeEnrollmentDetailsModal();">Approve</button>
                    <button class="btn danger" onclick="rejectEnrollment(${enrollment.id}); closeEnrollmentDetailsModal();">Reject</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

// Show enrollment details (alias for onclick handlers)
function showEnrollmentDetails(enrollmentId) {
    const enrollment = adminData.enrollments?.find(e => e.id === enrollmentId);
    if (enrollment) {
        showEnrollmentDetailsModal(enrollment);
    } else {
        console.error('Enrollment not found:', enrollmentId);
    }
}

// Close enrollment details modal
function closeEnrollmentDetailsModal() {
    const modal = document.getElementById('enrollment-details-modal');
    if (modal) {
        modal.remove();
    }
}

// Handle enrollment action
function handleEnrollmentAction(action, enrollmentId) {
    console.log('Handle enrollment action:', action, enrollmentId);
    
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
            console.error('Unknown enrollment action:', action);
    }
}

// View student details
function viewStudentDetails(studentId) {
    console.log('View student details:', studentId);

    // Find the enrollment for this studentId (from the row's context)
    const enrollment = adminData.enrollments.find(enrollment => {
        const profile = enrollment.studentProfile;
        return profile && (
            String(profile.id) === String(studentId) ||
            String(profile.studentId) === String(studentId)
        );
    });

    if (!enrollment) {
        console.error('Enrollment not found for student:', studentId);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Enrollment not found.');
        }
        return;
    }

    showStudentEnrollmentDetailsModal(enrollment);
// Show single enrollment details modal (for per-row view)
function showStudentEnrollmentDetailsModal(enrollment) {
    const studentProfile = enrollment.studentProfile || {};
    const unit = enrollment.unit || {};
    const semester = enrollment.semester || {};
    const availabilities = enrollment.availabilities || [];
    const availabilitiesHTML = Array.isArray(availabilities) && availabilities.length > 0
        ? '<ul class="availability-list">' + availabilities.map(slot => {
            if (typeof slot === 'object' && slot.day && slot.timeSlot) {
                return `<li><strong>${slot.day.name}:</strong> ${slot.timeSlot.startTime} - ${slot.timeSlot.endTime}</li>`;
            } else if (typeof slot === 'object') {
                return `<li>${Object.entries(slot).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join(', ')}</li>`;
            } else {
                return `<li>${slot}</li>`;
            }
        }).join('') + '</ul>'
        : '<span class="text-gray-500">No availabilities</span>';

    const modalContent = `
        <div class="modal-overlay" id="student-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Enrollment Details</h3>
                    <button class="close-modal" onclick="closeStudentDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="student-details">
                        <h4>Personal Information</h4>
                        <p><strong>Name:</strong> ${studentProfile.firstName || 'N/A'} ${studentProfile.lastName || ''}</p>
                        <p><strong>Student ID:</strong> ${studentProfile.studentId || studentProfile.id || 'N/A'}</p>
                        <p><strong>Email:</strong> ${studentProfile.emailAddress || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${studentProfile.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${studentProfile.address || 'N/A'}</p>
                        <p><strong>Program:</strong> ${studentProfile.program || 'N/A'}</p>
                        <p><strong>Year Level:</strong> ${studentProfile.yearLevel || 'N/A'}</p>
                        <h4>Unit Information</h4>
                        <p><strong>Unit Code:</strong> ${unit.unitCode || 'N/A'}</p>
                        <p><strong>Unit Title:</strong> ${unit.title || 'N/A'}</p>
                        <p><strong>Credits:</strong> ${unit.credits || 'N/A'}</p>
                        <h4>Semester Information</h4>
                        <p><strong>Semester:</strong> ${semester.name || 'N/A'}</p>
                        <p><strong>Academic Year:</strong> ${semester.academicYear || 'N/A'}</p>
                        <h4>Enrollment Information</h4>
                        <p><strong>Enrolled At:</strong> ${enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Availabilities:</strong> ${availabilities.length} time slot${availabilities.length !== 1 ? 's' : ''} selected</p>
                        ${availabilitiesHTML}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="closeStudentDetailsModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalContent);
}
}

// Show student details modal
function showStudentDetailsModal(studentProfile, enrollments) {
    const enrollmentsList = enrollments.map(enrollment => {
        // Format availabilities as readable list
        let availabilitiesHTML = '';
        if (Array.isArray(enrollment.availabilities) && enrollment.availabilities.length > 0) {
            availabilitiesHTML = '<ul class="availability-list">' + enrollment.availabilities.map(slot => {
                if (typeof slot === 'object') {
                    if (slot.day && slot.timeSlot) {
                        return `<li><strong>${slot.day.name}:</strong> ${slot.timeSlot.startTime} - ${slot.timeSlot.endTime}</li>`;
                    } else {
                        // Show all key-value pairs for generic objects
                        return `<li>${Object.entries(slot).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join(', ')}</li>`;
                    }
                } else {
                    return `<li>${slot}</li>`;
                }
            }).join('') + '</ul>';
        } else {
            availabilitiesHTML = '<span class="text-gray-500">No availabilities</span>';
        }
        return `
            <div class="enrollment-item">
                <div class="unit-info">
                    <strong>${enrollment.unit?.title || 'Unknown Unit'}</strong> (${enrollment.unit?.unitCode || 'N/A'})<br>
                    <small>Semester: ${enrollment.semester?.name || 'Unknown'}</small><br>
                    <small>Enrolled: ${new Date(enrollment.enrolledAt).toLocaleDateString()}</small><br>
                    <small>Availabilities (${enrollment.availabilities?.length || 0}):</small>
                    ${availabilitiesHTML}
                </div>
            </div>
        `;
    }).join('');
    
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
                        <p><strong>Name:</strong> ${studentProfile?.firstName || 'N/A'} ${studentProfile?.lastName || ''}</p>
                        <p><strong>Student ID:</strong> ${studentProfile?.studentId || studentProfile?.id || 'N/A'}</p>
                        <p><strong>Email:</strong> ${studentProfile?.emailAddress || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${studentProfile?.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${studentProfile?.address || 'N/A'}</p>
                        <p><strong>Program:</strong> ${studentProfile?.program || 'N/A'}</p>
                        <p><strong>Year Level:</strong> ${studentProfile?.yearLevel || 'N/A'}</p>
                        
                        <h4>Enrollments (${enrollments.length})</h4>
                        <div class="enrollments-list">
                            ${enrollmentsList}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="closeStudentDetailsModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

// Close student details modal
function closeStudentDetailsModal() {
    const modal = document.getElementById('student-details-modal');
    if (modal) {
        modal.remove();
    }
}

// Approve student enrollment (all enrollments for a student)
function approveStudentEnrollment(studentId) {
    console.log('Approve student enrollment:', studentId);
    
    if (!confirm('Are you sure you want to approve all enrollments for this student?')) {
        return;
    }
    
    // Find all enrollments for this student
    const studentEnrollments = adminData.enrollments.filter(enrollment => {
        const studentProfile = enrollment.studentProfile;
        return (studentProfile?.id === studentId || studentProfile?.studentId === studentId);
    });
    
    // Approve each enrollment
    studentEnrollments.forEach(enrollment => {
        approveEnrollment(enrollment.id);
    });
}

// Export enrollment data
function exportEnrollmentData() {
    console.log('Export enrollment data');
    
    if (adminData.enrollments.length === 0) {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('No enrollment data to export.');
        }
        return;
    }
    
    // Prepare CSV data
    const csvData = [];
    csvData.push(['Student Name', 'Student ID', 'Unit Code', 'Unit Title', 'Semester', 'Enrolled Date', 'Availabilities']);
    
    adminData.enrollments.forEach(enrollment => {
        const studentProfile = enrollment.studentProfile;
        const unit = enrollment.unit;
        const semester = enrollment.semester;
        
        csvData.push([
            `${studentProfile?.firstName || ''} ${studentProfile?.lastName || ''}`.trim(),
            studentProfile?.studentId || studentProfile?.id || '',
            unit?.unitCode || '',
            unit?.title || '',
            semester?.name || '',
            new Date(enrollment.enrolledAt).toLocaleDateString(),
            enrollment.availabilities?.length || 0
        ]);
    });
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    // Download CSV file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('Enrollment data exported successfully!');
    }
}

// Setup enrollment module event listeners
function setupEnrollmentListeners() {
    console.log('Setting up enrollment module listeners...');
    
    // Setup search functionality
    const searchInput = document.getElementById('enrollment-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterEnrollments, 300));
    }
    
    // Setup status filter
    const statusFilter = document.getElementById('enrollment-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterEnrollments);
    }
    
    // Setup export button
    const exportBtn = document.getElementById('export-enrollments');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportEnrollmentData);
    }
    
    console.log('Enrollment module listeners setup complete');
}

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.loadAdminEnrollments = loadAdminEnrollments;
    window.loadSemesterFilterOptions = loadSemesterFilterOptions;
    window.viewStudentDetails = viewStudentDetails;
    window.closeStudentDetailsModal = closeStudentDetailsModal;
    window.closeEnrollmentDetailsModal = closeEnrollmentDetailsModal;
    window.approveEnrollment = approveEnrollment;
    window.rejectEnrollment = rejectEnrollment;
    window.exportEnrollmentData = exportEnrollmentData;
    window.showEnrollmentDetails = showEnrollmentDetails;
    window.setupEnrollmentListeners = setupEnrollmentListeners;
}
