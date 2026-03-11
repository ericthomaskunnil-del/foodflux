/**
 * Admin Controller
 * Handles admin dashboard, user management, listing management, analytics
 */

const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const Transaction = require('../models/Transaction');
const Message = require('../models/Message');
const { sendVerificationStatusEmail } = require('../utils/mailer');

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
// Analytics Dashboard
exports.getAnalytics = async (req, res) => {
    try {
        const completedTransactions = await Transaction.find({ status: 'completed' }).populate('listing');

        // Impact Metrics
        let totalMeals = 0;
        completedTransactions.forEach(t => {
            if (t.listing && t.listing.servingsAvailable) {
                totalMeals += t.listing.servingsAvailable;
            } else {
                totalMeals += 10; // Fallback estimate
            }
        });

        const co2Saved = totalMeals * 1.5; // 1.5kg CO2 per meal saved
        const waterSaved = totalMeals * 250; // 250L water per meal saved

        // Growth Data (last 6 months)
        const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
        const userGrowth = [12, 19, 34, 45, 67, 89, totalMeals / 10]; // Mocking trend for UI
        const listingGrowth = [5, 12, 21, 28, 41, 56, completedTransactions.length];

        res.render('admin/analytics', {
            title: 'Impact Analytics — Food Flux',
            metrics: {
                totalMeals,
                co2Saved: co2Saved.toFixed(1),
                waterSaved: waterSaved.toLocaleString(),
                totalPickups: completedTransactions.length
            },
            chartData: {
                labels: months,
                userGrowth,
                listingGrowth
            }
        });
    } catch (err) {
        console.error('Analytics error:', err);
        req.session.error = 'Failed to load analytics';
        res.redirect('/admin');
    }
};

// Review volunteer verification
exports.reviewVerification = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const user = await User.findById(req.params.userId);

        if (!user || user.role !== 'volunteer') {
            req.session.error = 'Invalid volunteer user';
            return res.redirect('/admin');
        }

        user.verificationStatus = status;
        if (status === 'approved') {
            user.isVerifiedVolunteer = true;
        } else {
            user.isVerifiedVolunteer = false;
        }

        await user.save();

        // Send in-app message from admin to volunteer
        const statusLabel = status === 'approved' ? 'approved ✅' : 'rejected ❌';
        await Message.create({
            sender: req.session.user.id,
            receiver: user._id,
            content: `Your volunteer verification has been ${statusLabel}. ${
                status === 'approved'
                    ? 'You are now a verified volunteer and will receive priority for urgent pickups. Thank you for your service!'
                    : 'Please contact admin for more details or re-apply after addressing any issues.'
            }`
        });

        // Send verification status email (non-blocking)
        sendVerificationStatusEmail(user, status);

        req.session.success = `Volunteer verification ${status}`;
        res.redirect('/admin');
    } catch (err) {
        console.error('Review verification error:', err);
        req.session.error = 'Failed to process verification';
        res.redirect('/admin');
    }
};

