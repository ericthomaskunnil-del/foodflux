/**
 * Admin Controller
 * Handles admin dashboard, user management, listing management, analytics
 */

const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Transaction = require('../models/Transaction');

// Admin dashboard with analytics
exports.getDashboard = async (req, res) => {
    try {
        // Stats
        const totalUsers = await User.countDocuments();
        const totalDonors = await User.countDocuments({ role: 'donor' });
        const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
        const totalListings = await FoodListing.countDocuments();
        const availableListings = await FoodListing.countDocuments({ status: 'available' });
        const completedPickups = await Transaction.countDocuments({ status: 'completed' });
        const pendingApprovals = await FoodListing.countDocuments({ approved: false });

        // All listings
        const listings = await FoodListing.find()
            .populate('donor', 'name email')
            .populate('volunteer', 'name email')
            .sort({ createdAt: -1 });

        // All users
        const users = await User.find().sort({ createdAt: -1 });

        // Recent transactions
        const transactions = await Transaction.find()
            .populate('listing')
            .populate('donor', 'name email')
            .populate('volunteer', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard — Food Flux',
            stats: {
                totalUsers,
                totalDonors,
                totalVolunteers,
                totalListings,
                availableListings,
                completedPickups,
                pendingApprovals
            },
            listings,
            users,
            transactions
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        req.session.error = 'Failed to load dashboard';
        res.redirect('/');
    }
};

// Approve a listing
exports.approveListing = async (req, res) => {
    try {
        await FoodListing.findByIdAndUpdate(req.params.id, { approved: true });
        req.session.success = 'Listing approved successfully';
        return res.redirect('/admin');
    } catch (err) {
        console.error('Approve listing error:', err);
        req.session.error = 'Failed to approve listing';
        return res.redirect('/admin');
    }
};

// Delete a listing (admin)
exports.deleteListing = async (req, res) => {
    try {
        await Transaction.deleteMany({ listing: req.params.id });
        await FoodListing.findByIdAndDelete(req.params.id);
        req.session.success = 'Listing deleted successfully';
        return res.redirect('/admin');
    } catch (err) {
        console.error('Delete listing error:', err);
        req.session.error = 'Failed to delete listing';
        return res.redirect('/admin');
    }
};

// Delete a user (admin)
exports.deleteUser = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            req.session.error = 'User not found';
            return res.redirect('/admin');
        }

        // Prevent deleting yourself
        if (userToDelete._id.toString() === req.session.user.id) {
            req.session.error = 'Cannot delete your own account';
            return res.redirect('/admin');
        }

        // Clean up related data
        await FoodListing.deleteMany({ donor: userToDelete._id });
        await Transaction.deleteMany({
            $or: [{ donor: userToDelete._id }, { volunteer: userToDelete._id }]
        });
        await User.findByIdAndDelete(userToDelete._id);

        req.session.success = 'User deleted successfully';
        return res.redirect('/admin');
    } catch (err) {
        console.error('Delete user error:', err);
        req.session.error = 'Failed to delete user';
        return res.redirect('/admin');
    }
};
