// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Utility functions
function showAlert(elementId, message, type = 'danger') {
    const alertElement = $(`#${elementId}`);
    alertElement.removeClass('alert-success alert-danger alert-warning alert-info')
        .addClass(`alert-${type}`)
        .text(message)
        .show();
}

function hideAlert(elementId) {
    $(`#${elementId}`).hide();
}

function togglePassword(fieldId) {
    const field = $(`#${fieldId}`);
    const icon = field.siblings('.password-toggle').find('i');

    if (field.attr('type') === 'password') {
        field.attr('type', 'text');
        icon.removeClass('bi-eye').addClass('bi-eye-slash');
    } else {
        field.attr('type', 'password');
        icon.removeClass('bi-eye-slash').addClass('bi-eye');
    }
}

// Form switching functions
function showLoginForm() {
    $('#registerForm').hide();
    $('#loginForm').show();
    hideAlert('loginAlert');
    hideAlert('registerAlert');
    $('#loginFormElement')[0].reset();
}

function showRegisterForm() {
    $('#loginForm').hide();
    $('#registerForm').show();
    hideAlert('loginAlert');
    hideAlert('registerAlert');
    $('#registerFormElement')[0].reset();
}

// API functions
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Login failed. Please try again.'
            };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: 'Network error. Please check your connection and try again.'
        };
    }
}

async function registerUser(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Registration failed. Please try again.'
            };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: 'Network error. Please check your connection and try again.'
        };
    }
}

// Store user data in localStorage
function storeUserData(userData) {
    localStorage.setItem('userToken', userData.token);
    localStorage.setItem('userData', JSON.stringify(userData.user));
}

// Handle successful authentication
function handleSuccessfulAuth(userData) {
    storeUserData(userData);
    // Redirect to dashboard
    showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// Form validation
function validateLoginForm() {
    const username = $('#loginUsername').val().trim();
    const password = $('#loginPassword').val();

    if (!username) {
        showAlert('loginAlert', 'Please enter your username.');
        return false;
    }

    if (!password) {
        showAlert('loginAlert', 'Please enter your password.');
        return false;
    }

    return true;
}

function validateRegisterForm() {
    const username = $('#registerUsername').val().trim();
    const email = $('#registerEmail').val().trim();
    const password = $('#registerPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    if (!username) {
        showAlert('registerAlert', 'Please enter a username.');
        return false;
    }

    if (username.length < 3) {
        showAlert('registerAlert', 'Username must be at least 3 characters long.');
        return false;
    }

    if (!email) {
        showAlert('registerAlert', 'Please enter your email address.');
        return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('registerAlert', 'Please enter a valid email address.');
        return false;
    }

    if (!password) {
        showAlert('registerAlert', 'Please enter a password.');
        return false;
    }

    if (password.length < 6) {
        showAlert('registerAlert', 'Password must be at least 6 characters long.');
        return false;
    }

    if (password !== confirmPassword) {
        showAlert('registerAlert', 'Passwords do not match.');
        return false;
    }

    return true;
}

// Event handlers
$(document).ready(function () {
    // Login form submission
    $('#loginFormElement').on('submit', async function (e) {
        e.preventDefault();

        if (!validateLoginForm()) {
            return;
        }

        const username = $('#loginUsername').val().trim();
        const password = $('#loginPassword').val();

        // Show loading state
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<i class="bi bi-arrow-clockwise spin"></i> Signing In...').prop('disabled', true);

        hideAlert('loginAlert');

        try {
            const result = await loginUser(username, password);

            if (result.success) {
                handleSuccessfulAuth(result.data);
            } else {
                showAlert('loginAlert', result.error);
            }
        } catch (error) {
            showAlert('loginAlert', 'An unexpected error occurred. Please try again.');
        } finally {
            // Reset button state
            submitBtn.html(originalText).prop('disabled', false);
        }
    });

    // Register form submission
    $('#registerFormElement').on('submit', async function (e) {
        e.preventDefault();

        if (!validateRegisterForm()) {
            return;
        }

        const username = $('#registerUsername').val().trim();
        const email = $('#registerEmail').val().trim();
        const password = $('#registerPassword').val();

        // Show loading state
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<i class="bi bi-arrow-clockwise spin"></i> Creating Account...').prop('disabled', true);

        hideAlert('registerAlert');

        try {
            const result = await registerUser(username, email, password);

            if (result.success) {
                showAlert('registerAlert', 'Account created successfully! You can now log in.', 'success');
                setTimeout(() => {
                    showLoginForm();
                }, 2000);
            } else {
                showAlert('registerAlert', result.error);
            }
        } catch (error) {
            showAlert('registerAlert', 'An unexpected error occurred. Please try again.');
        } finally {
            // Reset button state
            submitBtn.html(originalText).prop('disabled', false);
        }
    });

    // Add spinning animation for loading states
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

    // Check if user is already logged in
    const token = localStorage.getItem('userToken');
    if (token) {
        // TODO: Validate token and redirect to dashboard
        console.log('User already logged in');
    }
});

// Make functions globally available for onclick handlers
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.togglePassword = togglePassword; 