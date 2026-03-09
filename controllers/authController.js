/**
 * Auth Controller
 * Handles login, registration, and logout
 */

const User = require('../models/User');
const { sendWelcomeEmail, sendLoginNotification } = require('../utils/mailer');

// Show login page
exports.getLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect(`/${req.session.user.role}`);
    }
    res.render('login', { title: 'Login — Food Flux' });
};

// Handle login
exports.postLogin = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate input
        if (!email || !password || !role) {
            req.session.error = 'All fields are required';
            return res.redirect('/auth/login');
        }

        // Find user by email and role
        const user = await User.findOne({ email: email.toLowerCase(), role });

        if (!user) {
            req.session.error = 'Invalid email, password or role';
            return res.redirect('/auth/login');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.session.error = 'Invalid email, password or role';
            return res.redirect('/auth/login');
        }

        // Set session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        req.session.success = `Welcome back, ${user.name}!`;

        // Send login notification email (non-blocking)
        sendLoginNotification(user);

        return res.redirect(`/${user.role}`);
    } catch (err) {
        console.error('Login error:', err);
        req.session.error = 'An error occurred. Please try again.';
        return res.redirect('/auth/login');
    }
};

// Show registration page
exports.getRegister = (req, res) => {
    if (req.session.user) {
        return res.redirect(`/${req.session.user.role}`);
    }
    res.render('register', { title: 'Register — Food Flux' });
};

// Handle registration
exports.postRegister = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;

        // Validations
        if (!name || !email || !password || !role) {
            req.session.error = 'All fields are required';
            return res.redirect('/auth/register');
        }

        if (password !== confirmPassword) {
            req.session.error = 'Passwords do not match';
            return res.redirect('/auth/register');
        }

        if (password.length < 6) {
            req.session.error = 'Password must be at least 6 characters';
            return res.redirect('/auth/register');
        }

        // Prevent registering as admin
        if (role === 'admin') {
            req.session.error = 'Cannot register as admin';
            return res.redirect('/auth/register');
        }

        // Check for existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            req.session.error = 'Email already registered';
            return res.redirect('/auth/register');
        }

        // Create user
        const user = new User({ name, email, password, role });
        await user.save();

        // Auto-login after registration
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        req.session.success = 'Account created successfully! A confirmation email has been sent.';

        // Send welcome email (non-blocking)
        sendWelcomeEmail(user);

        return res.redirect(`/${user.role}`);
    } catch (err) {
        console.error('Registration error:', err);
        req.session.error = 'An error occurred during registration';
        return res.redirect('/auth/register');
    }
};

// Handle logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/');
    });
};
