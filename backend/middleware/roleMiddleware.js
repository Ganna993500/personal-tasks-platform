// middleware/roleMiddleware.js

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        // 1. Check if user information exists (from authenticateToken middleware)
        if (!req.user) {
            console.warn('Authorization attempt without req.user. Token might be missing or invalid.');
            return res.status(401).json({ error: 'Unauthorized: No user information found.' });
        }

        // 2. Check if the user's role is included in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`Access denied for user '${req.user.username}' (ID: ${req.user.userId}) with role '${req.user.role}'. Required roles: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ error: 'Forbidden: Access is denied for your role.' });
        }

        // 3. If role is allowed, proceed to the next middleware or route handler
        next();
    };
}

module.exports = { authorizeRoles };
