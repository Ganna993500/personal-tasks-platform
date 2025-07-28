// Configuration
console.log('Dashboard JS loaded');
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
    console.log('showSection called with:', sectionName);

    // Hide all sections
    $('.content-section').removeClass('active');
    console.log('All sections hidden');

    // Show selected section
    const targetSection = $(`#${sectionName}Section`);
    console.log('Target section found:', targetSection.length);
    targetSection.addClass('active');
    console.log('Target section activated');

    // Update navigation
    $('.nav-link').removeClass('active');
    $(`.nav-link[onclick="showSection('${sectionName}')"]`).addClass('active');

    // Load section-specific data
    switch (sectionName) {
        case 'tasks':
            console.log('Loading tasks section');
            loadTasks();
            break;
        case 'sharedTasks':
            console.log('Loading shared tasks section');
            loadSharedTasks();
            break;
        case 'notifications':
            console.log('Loading notifications section');
            loadNotifications();
            break;
        case 'users':
            console.log('Loading users section');
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
                    <button class="btn btn-sm btn-outline-info" onclick="showComments(${task.id})">
                        <i class="bi bi-chat-dots"></i> Comments
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="showShareTask(${task.id})">
                        <i class="bi bi-share"></i> Share
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
        case 'in_progress':
            return 'status-in-progress';
        case 'not_started':
        case 'pending':
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
    const status = $('#taskStatus').val();

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
                priority,
                status
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

    // Check if we're currently in the shared tasks section
    const isSharedTask = $('#sharedTasksSection').hasClass('active');

    try {
        const endpoint = isSharedTask ? `${API_BASE_URL}/shared-tasks/${taskId}` : `${API_BASE_URL}/tasks/${taskId}`;

        const response = await fetch(endpoint, {
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
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task');
        }

        const updatedTask = await response.json();

        $('#editTaskModal').modal('hide');

        if (isSharedTask) {
            // Reload shared tasks
            loadSharedTasks();
            showSuccess('Shared task updated successfully!');
        } else {
            // Update the task in the local array
            const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));
            if (taskIndex !== -1) {
                tasks[taskIndex] = updatedTask;
                renderTasks(tasks);
            }
            showSuccess('Task updated successfully!');
        }

    } catch (error) {
        console.error('Error updating task:', error);
        alert(`Failed to update task: ${error.message}`);
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

// Share Task Functions
function showShareTask(taskId) {
    $('#shareTaskId').val(taskId);
    $('#shareTaskForm')[0].reset();
    $('#shareTaskModal').modal('show');
}

async function shareTask() {
    const taskId = $('#shareTaskId').val();
    const sharedWithId = $('#shareWithUserId').val();
    const permission = $('#sharePermission').val();

    if (!sharedWithId) {
        alert('Please enter a user ID');
        return;
    }

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sharedWithId: parseInt(sharedWithId),
                permission
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to share task');
        }

        $('#shareTaskModal').modal('hide');
        showSuccess('Task shared successfully!');

    } catch (error) {
        console.error('Error sharing task:', error);
        alert(`Failed to share task: ${error.message}`);
    }
}

// Comments Functions
function showComments(taskId) {
    $('#commentTaskId').val(taskId);
    $('#commentsModal').modal('show');
    loadComments(taskId);
}

async function loadComments(taskId) {
    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load comments');
        }

        const comments = await response.json();
        renderComments(comments);

    } catch (error) {
        console.error('Error loading comments:', error);
        showError('commentsContainer', 'Failed to load comments. Please try again.');
    }
}

function renderComments(comments) {
    const container = $('#commentsContainer');

    if (comments.length === 0) {
        container.html(`
            <div class="empty-state">
                <i class="bi bi-chat-dots"></i>
                <h3>No comments yet</h3>
                <p>Be the first to add a comment!</p>
            </div>
        `);
        return;
    }

    const commentsHtml = comments.map(comment => createCommentHtml(comment)).join('');
    container.html(`<div class="comments-list">${commentsHtml}</div>`);
}

function createCommentHtml(comment) {
    const commentDate = new Date(comment.created_at).toLocaleString();

    return `
        <div class="comment-item border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-person-circle me-2"></i>
                        <strong>${escapeHtml(comment.username)}</strong>
                        <small class="text-muted ms-2">${commentDate}</small>
                    </div>
                    <p class="mb-0">${escapeHtml(comment.comment)}</p>
                </div>
            </div>
        </div>
    `;
}

async function addComment() {
    const taskId = $('#commentTaskId').val();
    const comment = $('#newComment').val().trim();

    if (!comment) {
        alert('Please enter a comment');
        return;
    }

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ comment })
        });

        if (!response.ok) {
            throw new Error('Failed to add comment');
        }

        const newComment = await response.json();

        // Reload comments to show the new one
        loadComments(taskId);

        // Clear the comment input
        $('#newComment').val('');

        showSuccess('Comment added successfully!');

    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
    }
}

// Shared Tasks Functions
async function loadSharedTasks() {
    const token = localStorage.getItem('userToken');

    try {
        console.log('Showing loading...');
        showLoading('sharedTasksContainer');

        console.log('Making API call...');
        const response = await fetch(`${API_BASE_URL}/shared-tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response received:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load shared tasks: ${response.status} ${errorText}`);
        }

        const sharedTasks = await response.json();
        console.log('Shared tasks data:', sharedTasks);
        renderSharedTasks(sharedTasks);

    } catch (error) {
        console.error('Error loading shared tasks:', error);
        showError('sharedTasksContainer', `Failed to load shared tasks: ${error.message}`);
    }
}

function renderSharedTasks(sharedTasks) {
    console.log('renderSharedTasks called with:', sharedTasks);
    const container = $('#sharedTasksContainer');
    console.log('Container found:', container.length);

    if (sharedTasks.length === 0) {
        console.log('No shared tasks, showing empty state');
        container.html(`
            <div class="empty-state">
                <i class="bi bi-share"></i>
                <h3>No shared tasks</h3>
                <p>Tasks shared with you will appear here</p>
            </div>
        `);
        return;
    }

    console.log('Creating HTML for', sharedTasks.length, 'tasks');
    const tasksHtml = sharedTasks.map(task => createSharedTaskHtml(task)).join('');
    console.log('Generated HTML length:', tasksHtml.length);
    container.html(`<ul class="task-list">${tasksHtml}</ul>`);
}

function createSharedTaskHtml(task) {
    const statusClass = getStatusClass(task.status);
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
    const permission = task.permission || 'read'; // Default to read if permission is missing
    const canEdit = permission === 'write';

    return `
        <li class="task-item ${isOverdue ? 'border-danger' : ''}">
            <div class="task-header">
                <h5 class="task-title">${escapeHtml(task.title)}</h5>
                <div class="d-flex align-items-center gap-2">
                    <span class="task-status ${statusClass}">${task.status || 'pending'}</span>
                    <span class="badge bg-info">${permission} access</span>
                </div>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <div class="task-due-date">
                    <i class="bi bi-calendar"></i>
                    ${dueDate}
                    ${isOverdue ? '<span class="text-danger ms-2">(Overdue)</span>' : ''}
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline-info" onclick="showComments(${task.id})">
                        <i class="bi bi-chat-dots"></i> Comments
                    </button>${canEdit ? `<button class="btn btn-sm btn-outline-primary" onclick="editSharedTask(${task.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>` : ''}
                </div>
            </div>
        </li>
    `;
}

async function editSharedTask(taskId) {
    const token = localStorage.getItem('userToken');

    try {
        // Fetch the shared task data from the backend
        const response = await fetch(`${API_BASE_URL}/shared-tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch shared task');
        }

        const task = await response.json();

        if (!task) {
            alert('Task not found');
            return;
        }

        if (task.permission !== 'write') {
            alert('You do not have permission to edit this task');
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

    } catch (error) {
        console.error('Error fetching shared task:', error);
        alert('Failed to load task data. Please try again.');
    }
}





// Notifications Functions
async function loadNotifications() {
    const token = localStorage.getItem('userToken');

    try {
        showLoading('notificationsContainer');

        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load notifications');
        }

        const notifications = await response.json();
        renderNotifications(notifications);

    } catch (error) {
        console.error('Error loading notifications:', error);
        showError('notificationsContainer', 'Failed to load notifications. Please try again.');
    }
}

function renderNotifications(notifications) {
    const container = $('#notificationsContainer');

    if (notifications.length === 0) {
        container.html(`
            <div class="empty-state">
                <i class="bi bi-bell"></i>
                <h3>No notifications</h3>
                <p>You're all caught up! No tasks due soon.</p>
            </div>
        `);
        return;
    }

    const notificationsHtml = notifications.map(notification => createNotificationHtml(notification)).join('');
    container.html(`
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>Due Soon Notifications</h3>
            <button class="btn btn-primary" onclick="markAllNotificationsRead()">
                <i class="bi bi-check-all"></i> Mark All as Read
            </button>
        </div>
        <div class="notifications-list">
            ${notificationsHtml}
        </div>
    `);
}

function createNotificationHtml(notification) {
    const dueDate = new Date(notification.due_date).toLocaleDateString();
    const isOverdue = new Date(notification.due_date) < new Date();
    const isRead = notification.is_read;

    return `
        <div class="notification-item ${isRead ? 'read' : 'unread'} border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                        <strong>${escapeHtml(notification.message)}</strong>
                        ${isRead ? '<span class="badge bg-secondary ms-2">Read</span>' : '<span class="badge bg-warning ms-2">New</span>'}
                    </div>
                    <div class="d-flex align-items-center text-muted">
                        <i class="bi bi-calendar me-1"></i>
                        <span>Due: ${dueDate}</span>
                        ${isOverdue ? '<span class="text-danger ms-2">(Overdue)</span>' : ''}
                    </div>
                </div>
                <div class="ms-3">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewTask(${notification.task_id})">
                        <i class="bi bi-eye"></i> View Task
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function markAllNotificationsRead() {
    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/notifications/markread`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to mark notifications as read');
        }

        showSuccess('All notifications marked as read!');
        loadNotifications(); // Reload to show updated status

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        alert('Failed to mark notifications as read. Please try again.');
    }
}

function viewTask(taskId) {
    // Switch to tasks section and highlight the specific task
    showSection('tasks');
    // TODO: Could add highlighting or scrolling to the specific task
    console.log('Viewing task:', taskId);
}

// Users Management Functions (Admin Only)
async function loadUsers() {
    const token = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Check if user is admin
    if (userData.role !== 'admin') {
        $('#usersContainer').html(`
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Access Denied</strong>
                <p>You need admin privileges to access user management.</p>
            </div>
        `);
        return;
    }

    try {
        showLoading('usersContainer');

        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error('Failed to load users');
        }

        const users = await response.json();
        renderUsers(users);

    } catch (error) {
        console.error('Error loading users:', error);
        showError('usersContainer', error.message);
    }
}

function renderUsers(users) {
    const container = $('#usersContainer');

    if (users.length === 0) {
        container.html(`
            <div class="empty-state">
                <i class="bi bi-people"></i>
                <h3>No users found</h3>
                <p>There are no users in the system.</p>
            </div>
        `);
        return;
    }

    const usersHtml = users.map(user => createUserHtml(user)).join('');
    container.html(`
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>User Management</h3>
            <span class="badge bg-info">${users.length} users</span>
        </div>
        <div class="users-list">
            ${usersHtml}
        </div>
    `);
}

function createUserHtml(user) {
    const roleBadgeClass = user.role === 'admin' ? 'bg-danger' : 'bg-primary';

    return `
        <div class="user-item border rounded p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-person-circle text-primary me-2"></i>
                        <strong>${escapeHtml(user.username)}</strong>
                        <span class="badge ${roleBadgeClass} ms-2">${user.role}</span>
                    </div>
                    <div class="text-muted">
                        <i class="bi bi-envelope me-1"></i>
                        ${escapeHtml(user.email)}
                    </div>
                    <div class="text-muted small">
                        <i class="bi bi-hash me-1"></i>
                        ID: ${user.id}
                    </div>
                </div>
                <div class="ms-3">
                    <button class="btn btn-sm btn-outline-primary" onclick="editUserRole(${user.id}, '${user.username}', '${user.role}')">
                        <i class="bi bi-pencil"></i> Edit Role
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function editUserRole(userId, username, currentRole) {
    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();

        // Populate the edit user modal
        $('#editUserId').val(userId);
        $('#editUsername').val(username);
        $('#editUserEmail').val(userData.email);
        $('#editUserRole').val(currentRole);

        // Show the modal
        $('#editUserModal').modal('show');

    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Failed to load user data. Please try again.');
    }
}

async function updateUserRole() {
    const userId = $('#editUserId').val();
    const username = $('#editUsername').val().trim();
    const role = $('#editUserRole').val();

    if (!username) {
        alert('Username cannot be empty');
        return;
    }

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: username,
                email: $('#editUserEmail').val().trim(),
                role: role
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update user');
        }

        const updatedUser = await response.json();
        $('#editUserModal').modal('hide');

        showSuccess('User role updated successfully!');
        loadUsers(); // Reload the users list

    } catch (error) {
        console.error('Error updating user:', error);
        alert(`Failed to update user: ${error.message}`);
    }
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