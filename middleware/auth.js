/**
 * Authentication Middleware
 * Role-based access control for routes
 */

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    req.session.error = 'Please login to continue';
    return res.redirect('/auth/login');
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.session.error = 'Access denied. Admin privileges required.';
    return res.redirect('/auth/login');
};

// Check if user is donor
const isDonor = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'donor') {
        return next();
    }
    req.session.error = 'Access denied. Donor privileges required.';
    return res.redirect('/auth/login');
};

// Check if user is volunteer
const isVolunteer = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'volunteer') {
        return next();
    }
    req.session.error = 'Access denied. Volunteer privileges required.';
    return res.redirect('/auth/login');
};

module.exports = { isAuthenticated, isAdmin, isDonor, isVolunteer };
