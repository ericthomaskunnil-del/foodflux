/**
 * Volunteer Controller
 * Handles volunteer dashboard, accepting pickups, and marking collected
 */

const FoodListing = require('../models/FoodListing');
const Transaction = require('../models/Transaction');

// Volunteer dashboard — show available listings and pickup history
exports.getDashboard = async (req, res) => {
    try {
        // Fetch full user data for verification status display
        const User = require('../models/User');
        const currentUser = await User.findById(req.session.user.id);
        if (currentUser) {
            res.locals.user.isVerifiedVolunteer = currentUser.isVerifiedVolunteer;
            res.locals.user.verificationStatus = currentUser.verificationStatus;
        }

        // Available approved listings
        const availableListings = await FoodListing.find({
            status: 'available',
            approved: true
        })
            .populate('donor', 'name email phone address')
            .sort({ createdAt: -1 });

        // This volunteer's transactions
        const myPickups = await Transaction.find({ volunteer: req.session.user.id })
            .populate('listing')
            .populate('donor', 'name email')
            .sort({ createdAt: -1 });

        res.render('volunteer/dashboard', {
            title: 'Volunteer Dashboard — Food Flux',
            availableListings,
            myPickups
        });
    } catch (err) {
        console.error('Volunteer dashboard error:', err);
        req.session.error = 'Failed to load dashboard';
        res.redirect('/');
    }
};

// Volunteer Directory — show all donors/restaurants
exports.getDirectory = async (req, res) => {
    try {
        const User = require('../models/User'); // ensure it's loaded if not at top
        const donors = await User.find({ role: 'donor' }).sort({ trustScore: -1 });

        // Optionally fetch active listings count for each donor
        const directoryData = await Promise.all(donors.map(async (donor) => {
            const activeListingsCount = await FoodListing.countDocuments({
                donor: donor._id,
                status: 'available',
                approved: true
            });
            return {
                ...donor.toObject(),
                activeListingsCount
            };
        }));

        res.render('volunteer/directory', {
            title: 'Restaurant Directory — Food Flux',
            donors: directoryData
        });
    } catch (err) {
        console.error('Directory error:', err);
        req.session.error = 'Failed to load directory';
        res.redirect('/volunteer');
    }
};

// Accept a pickup
exports.acceptPickup = async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id);

        if (!listing) {
            req.session.error = 'Listing not found';
            return res.redirect('/volunteer');
        }

        if (listing.status !== 'available') {
            req.session.error = 'This listing is no longer available';
            return res.redirect('/volunteer');
        }

        // Update listing status
        listing.status = 'picked';
        listing.volunteer = req.session.user.id;
        await listing.save();

        // Create transaction
        const transaction = new Transaction({
            listing: listing._id,
            donor: listing.donor,
            volunteer: req.session.user.id,
            status: 'accepted'
        });
        await transaction.save();

        req.session.success = 'Pickup accepted! Please collect the food.';
        return res.redirect('/volunteer');
    } catch (err) {
        console.error('Accept pickup error:', err);
        req.session.error = 'Failed to accept pickup';
        return res.redirect('/volunteer');
    }
};

// Mark as collected
exports.markCollected = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            volunteer: req.session.user.id
        });

        if (!transaction) {
            req.session.error = 'Transaction not found';
            return res.redirect('/volunteer');
        }

        // Update transaction
        transaction.status = 'completed';
        await transaction.save();

        // Update listing status
        await FoodListing.findByIdAndUpdate(transaction.listing, {
            status: 'completed'
        });

        req.session.success = 'Marked as collected! Thank you for volunteering. Please rate the donor.';
        return res.redirect(`/volunteer/rate/${transaction._id}`);
    } catch (err) {
        console.error('Mark collected error:', err);
        req.session.error = 'Failed to update status';
        return res.redirect('/volunteer');
    }
};

// Show rate donor form
exports.showRateDonor = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId)
            .populate('donor', 'name restaurantName profileImageUrl')
            .populate('listing', 'foodName');

        if (!transaction || transaction.volunteer.toString() !== req.session.user.id) {
            req.session.error = 'Invalid transaction for rating';
            return res.redirect('/volunteer');
        }

        res.render('volunteer/rate', {
            title: 'Rate Donor — Food Flux',
            transaction
        });
    } catch (err) {
        console.error('Show rate error:', err);
        req.session.error = 'Failed to load rating form';
        res.redirect('/volunteer');
    }
};

// Submit rating
exports.submitRating = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const transaction = await Transaction.findById(req.params.transactionId);

        if (!transaction || transaction.volunteer.toString() !== req.session.user.id) {
            req.session.error = 'Invalid transaction';
            return res.redirect('/volunteer');
        }

        const Review = require('../models/Review');
        const User = require('../models/User');

        // Check if already rated
        const existingReview = await Review.findOne({ listing: transaction.listing });
        if (existingReview) {
            req.session.error = 'You have already rated this donor for this listing';
            return res.redirect('/volunteer');
        }

        const numRating = Number(rating);

        // Create review
        await Review.create({
            reviewer: req.session.user.id,
            reviewee: transaction.donor,
            listing: transaction.listing,
            rating: numRating,
            comment: comment || ''
        });

        // Update donor trust score
        const donor = await User.findById(transaction.donor);
        const newCount = donor.ratingsCount + 1;
        // Calculate new moving average
        const newScore = ((donor.trustScore * donor.ratingsCount) + numRating) / newCount;

        donor.trustScore = newScore;
        donor.ratingsCount = newCount;
        await donor.save();

        req.session.success = 'Rating submitted successfully! Thank you.';
        res.redirect('/volunteer');
    } catch (err) {
        console.error('Submit rating error:', err);
        req.session.error = 'Failed to submit rating';
        res.redirect('/volunteer');
    }
};

// Verify pickup with QR code/manual code
exports.verifyPickup = async (req, res) => {
    try {
        const { pickupCode } = req.body;
        const transactionId = req.params.transactionId;

        const transaction = await Transaction.findOne({
            _id: transactionId,
            volunteer: req.session.user.id
        }).populate('listing');

        if (!transaction || !transaction.listing) {
            req.session.error = 'Transaction not found';
            return res.redirect('/volunteer');
        }

        if (transaction.listing.pickupCode !== pickupCode) {
            req.session.error = 'Invalid verification code. Please try again.';
            return res.redirect('/volunteer');
        }

        // Success: Mark everything as completed
        transaction.status = 'completed';
        await transaction.save();

        const listing = transaction.listing;
        listing.status = 'completed';
        listing.pickupVerified = true;
        listing.actualPickupTime = new Date();
        await listing.save();

        req.session.success = 'Pickup verified successfully! Thank you for your service.';
        res.redirect(`/volunteer/rate/${transaction._id}`);
    } catch (err) {
        console.error('Verify pickup error:', err);
        req.session.error = 'Failed to verify pickup';
        res.redirect('/volunteer');
    }
};

// Request verification
exports.requestVerification = async (req, res) => {
    try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.session.user.id, {
            verificationStatus: 'pending'
        });
        req.session.success = 'Verification request submitted! Admin will review your profile.';
        res.redirect('/volunteer');
    } catch (err) {
        console.error('Request verification error:', err);
        req.session.error = 'Failed to submit request';
        res.redirect('/volunteer');
    }
};

