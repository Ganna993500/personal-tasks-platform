// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global variables
let currentUser = null;
let tasks = [];

// Initialize dashboard
$(document).ready(function () {
    checkAuth();
    loadUserInfo();
    loadTasks();
    setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Validate token by making a test request
    validateToken(token);
}

// Validate token with backend
async function validateToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    }
}

// Load user information
function loadUserInfo() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
        $('#userInfo').text(`Welcome, ${currentUser.username}!`);

        // Show admin section if user is admin
        if (currentUser.role === 'admin') {
            $('#adminSection').show();
        }
    }
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    $('.content-section').removeClass('active');

    // Show selected section
    $(`#${sectionName}Section`).addClass('active');

    // Update navigation
    $('.nav-link').removeClass('active');
    $(`.nav-link[onclick="showSection('${sectionName}')"]`).addClass('active');

    // Load section-specific data
    switch (sectionName) {
        case 'tasks':
            loadTasks();
            break;
        case 'shared-tasks':
            loadSharedTasks();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// Mobile sidebar toggle
function toggleSidebar() {
    $('#sidebar').toggleClass('show');
}

// Logout function
function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Task Management Functions
async function loadTasks() {
    const token = localStorage.getItem('userToken');

    try {
        showLoading('tasksContainer');

        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }

        tasks = await response.json();
        renderTasks(tasks);

    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('tasksContainer', 'Failed to load tasks. Please try again.');
    }
}

function renderTasks(tasksToRender) {
    const container = $('#tasksContainer');

    if (tasksToRender.length === 0) {
        container.html(`
            <div class="empty-state">
                <i class="bi bi-list-task"></i>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started!</p>
                <button class="btn btn-primary" onclick="showCreateTaskModal()">
                    <i class="bi bi-plus-circle"></i> Create Task
                </button>
            </div>
        `);
        return;
    }

    const tasksHtml = tasksToRender.map(task => createTaskHtml(task)).join('');
    container.html(`<ul class="task-list">${tasksHtml}</ul>`);
}

function createTaskHtml(task) {
    const statusClass = getStatusClass(task.status);
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

    return `
        <li class="task-item ${isOverdue ? 'border-danger' : ''}">
            <div class="task-header">
                <h5 class="task-title">${escapeHtml(task.title)}</h5>
                <span class="task-status ${statusClass}">${task.status || 'pending'}</span>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <div class="task-due-date">
                    <i class="bi bi-calendar"></i>
                    ${dueDate}
                    ${isOverdue ? '<span class="text-danger ms-2">(Overdue)</span>' : ''}
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="editTask(${task.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="updateTaskStatus(${task.id}, 'completed')">
                        <i class="bi bi-check-circle"></i> Complete
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        </li>
    `;
}

function getStatusClass(status) {
    switch (status) {
        case 'completed':
            return 'status-completed';
        case 'in-progress':
            return 'status-in-progress';
        default:
            return 'status-pending';
    }
}

// Task CRUD Operations
function showCreateTaskModal() {
    $('#createTaskForm')[0].reset();
    $('#createTaskModal').modal('show');
}

async function createTask() {
    const title = $('#taskTitle').val().trim();
    const description = $('#taskDescription').val().trim();
    const dueDate = $('#taskDueDate').val();
    const priority = $('#taskPriority').val();

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                due_date: dueDate || null,
                priority
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create task');
        }

        const newTask = await response.json();
        tasks.unshift(newTask);
        renderTasks(tasks);

        $('#createTaskModal').modal('hide');
        showSuccess('Task created successfully!');

    } catch (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task. Please try again.');
    }
}

async function updateTaskStatus(taskId, status) {
    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Failed to update task status');
        }

        const updatedTask = await response.json();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
            renderTasks(tasks);
        }

        showSuccess('Task status updated successfully!');

    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks(tasks);

        showSuccess('Task deleted successfully!');

    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        alert('Task not found');
        return;
    }

    // Populate the edit form with task data
    $('#editTaskId').val(task.id);
    $('#editTaskTitle').val(task.title);
    $('#editTaskDescription').val(task.description || '');

    // Format due date for datetime-local input
    if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const formattedDate = dueDate.toISOString().slice(0, 16);
        $('#editTaskDueDate').val(formattedDate);
    } else {
        $('#editTaskDueDate').val('');
    }

    $('#editTaskPriority').val(task.priority || 'medium');
    $('#editTaskStatus').val(task.status || 'pending');

    // Show the edit modal
    $('#editTaskModal').modal('show');
}

async function updateTask() {
    const taskId = $('#editTaskId').val();
    const title = $('#editTaskTitle').val().trim();
    const description = $('#editTaskDescription').val().trim();
    const dueDate = $('#editTaskDueDate').val();
    const priority = $('#editTaskPriority').val();
    const status = $('#editTaskStatus').val();

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                due_date: dueDate || null,
                priority,
                status
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        const updatedTask = await response.json();

        // Update the task in the local array
        const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
            renderTasks(tasks);
        }

        $('#editTaskModal').modal('hide');
        showSuccess('Task updated successfully!');

    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task. Please try again.');
    }
}

// Filtering and Sorting
function filterTasks() {
    const statusFilter = $('#statusFilter').val();
    let filteredTasks = tasks;

    if (statusFilter) {
        filteredTasks = tasks.filter(task => task.status === statusFilter);
    }

    renderTasks(filteredTasks);
}

function sortTasks() {
    const sortBy = $('#sortBy').val();
    let sortedTasks = [...tasks];

    switch (sortBy) {
        case 'due_date':
            sortedTasks.sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            });
            break;
        case 'created_at':
            sortedTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'title':
            sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }

    renderTasks(sortedTasks);
}

// Placeholder functions for other sections
function loadSharedTasks() {
    // TODO: Implement shared tasks loading
    console.log('Loading shared tasks...');
}

function loadNotifications() {
    // TODO: Implement notifications loading
    console.log('Loading notifications...');
}

function loadUsers() {
    // TODO: Implement users loading (admin only)
    console.log('Loading users...');
}

// Utility functions
function showLoading(containerId) {
    $(`#${containerId}`).html(`
        <div class="loading-spinner">
            <i class="bi bi-arrow-clockwise spin"></i>
            <p>Loading...</p>
        </div>
    `);
}

function showError(containerId, message) {
    $(`#${containerId}`).html(`
        <div class="empty-state">
            <i class="bi bi-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `);
}

function showSuccess(message) {
    // Create a temporary success alert
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999;">
            <i class="bi bi-check-circle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    $('body').append(alertHtml);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        $('.alert-success').fadeOut(() => {
            $('.alert-success').remove();
        });
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup event listeners
function setupEventListeners() {
    // Close mobile sidebar when clicking outside
    $(document).on('click', function (e) {
        if ($(window).width() <= 768) {
            if (!$(e.target).closest('.sidebar, .mobile-menu-toggle').length) {
                $('#sidebar').removeClass('show');
            }
        }
    });

    // Add spinning animation
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .spin {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `)
        .appendTo('head');
} 