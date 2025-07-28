// controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByUsername, createUser, findUserByEmail, createPasswordResetToken, findUserByResetToken, updatePassword } = require('../models/userModel'); // Make sure createUser is imported
require('dotenv').config();

// Define allowed roles for registration
const ALLOWED_REGISTRATION_ROLES = ['user', 'admin']; // Only 'user' can register. 'admin' must be set manually or by an existing admin.

const register = async (req, res) => {
    const { username, email, password, role } = req.body;

    // Input validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Determine the role for the new user
    let assignedRole = 'user'; // Default role if not provided or if an invalid role is provided
    if (role && ALLOWED_REGISTRATION_ROLES.includes(role.toLowerCase())) {
        assignedRole = role.toLowerCase(); // Assign if it's an allowed role
    }

    // If `role` is provided but not in ALLOWED_REGISTRATION_ROLES, it will default to 'user'.
    // This prevents users from self-registering as 'admin'.

    try {
        // Check if username already exists
        const existingUser = await findUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user in the database with the assigned role
        const newUser = await createUser({
            username,
            email,
            password_hash: hashedPassword,
            role: assignedRole // Pass the validated/assigned role
        });

        // Generate JWT token for the newly registered user
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Respond with success message, token, and basic user info
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, username: newUser.username, role: newUser.role }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // Find the user by username
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials: User not found.' });
        }

        // Compare provided password with hashed password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials: Password mismatch.' });
        }

        // Generate JWT token including user ID, username, and crucially, their role
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role }, // Include role here
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.json({
            token,
            message: 'Logged in successfully',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};


module.exports = { register, login };
