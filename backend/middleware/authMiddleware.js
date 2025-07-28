// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
    //console.log('authenticateToken');
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    // Extract the token (e.g., "Bearer YOUR_TOKEN")
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            // Handle different types of errors (e.g., token expired, invalid signature)
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Authentication token expired.' });
            }
            return res.status(403).json({ message: 'Forbidden: Invalid token.' });
        }

        // Attach the decoded user payload (which includes id, username, and role) to the request object
        req.user = user;
        next(); // Proceed to the next middleware or route handler
    });
}

module.exports = { authenticateToken };
