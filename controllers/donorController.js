/**
 * Donor Controller
 * Handles donor dashboard and food listing CRUD operations
 */

const FoodListing = require('../models/FoodListing');
const Transaction = require('../models/Transaction');
const { geocodeAddress } = require('../utils/geocoder');

// Donor dashboard — show all listings by this donor
exports.getDashboard = async (req, res) => {
    try {
        const listings = await FoodListing.find({ donor: req.session.user.id })
            .sort({ createdAt: -1 });

        const transactions = await Transaction.find({ donor: req.session.user.id })
            .populate('listing')
            .populate('volunteer', 'name email')
            .sort({ createdAt: -1 });

        const view = req.session.user.role === 'corporate_partner' ? 'partner/dashboard' : 'donor/dashboard';

        res.render(view, {
            title: req.session.user.role === 'corporate_partner' ? 'Partner Dashboard — Food Flux' : 'Donor Dashboard — Food Flux',
            listings,
            transactions
        });
    } catch (err) {
        console.error('Donor dashboard error:', err);
        req.session.error = 'Failed to load dashboard';
        res.redirect('/');
    }
};

// Show add listing form
exports.getAddListing = (req, res) => {
    res.render('donor/addListing', {
        title: 'Add Food Listing — Food Flux',
        listing: null
    });
};

// Handle creating a new listing
exports.postAddListing = async (req, res) => {
    try {
        const {
            foodName, quantity, pickupTime, location, expiryTime, description,
            foodType, preparedTime, storageMethod, allergens, servingsAvailable
        } = req.body;

        // Validation
        if (!foodName || !quantity || !pickupTime || !location || !expiryTime || !preparedTime || !servingsAvailable) {
            req.session.error = 'Please fill in all required fields';
            return res.redirect('/donor/add');
        }

        const coords = await geocodeAddress(location);

        // Generate preliminary pickup code for Phase 3 QR workflow
        const crypto = require('crypto');
        const pickupCode = crypto.randomBytes(4).toString('hex').toUpperCase();

        const listing = new FoodListing({
            foodName,
            quantity,
            pickupTime,
            location,
            locationCoords: coords,
            expiryTime,
            description: description || '',
            donor: req.session.user.id,
            status: 'available',
            approved: false,
            // Phase 3 fields
            foodType: foodType || 'Veg',
            preparedTime: new Date(preparedTime),
            storageMethod: storageMethod || 'Room Temperature',
            allergens: allergens ? (Array.isArray(allergens) ? allergens : allergens.split(',').map(s => s.trim())) : [],
            servingsAvailable: parseInt(servingsAvailable),
            pickupCode
        });

        await listing.save();

        // --- Automated Matching System ---
        // Find all volunteers
        const { sendMatchEmail } = require('../utils/mailer');
        const User = require('../models/User');

        // Simple matching logic: notify all active volunteers (Can be extended with distance queries)
        const volunteers = await User.find({ role: 'volunteer' });

        volunteers.forEach(volunteer => {
            sendMatchEmail(volunteer, listing);
            // Optionally emit a socket event if real-time web UI notifications are desired
            const io = req.app.get('io');
            if (io) {
                io.to(volunteer._id.toString()).emit('newMatch', listing);
            }
        });
        req.session.success = 'Food listing added successfully! Awaiting admin approval.';
        return res.redirect('/donor');
    } catch (err) {
        console.error('Add listing error:', err);
        req.session.error = 'Failed to add listing';
        return res.redirect('/donor/add');
    }
};

// Show edit listing form
exports.getEditListing = async (req, res) => {
    try {
        const listing = await FoodListing.findOne({
            _id: req.params.id,
            donor: req.session.user.id
        });

        if (!listing) {
            req.session.error = 'Listing not found';
            return res.redirect('/donor');
        }

        res.render('donor/addListing', {
            title: 'Edit Listing — Food Flux',
            listing
        });
    } catch (err) {
        console.error('Edit listing error:', err);
        req.session.error = 'Failed to load listing';
        return res.redirect('/donor');
    }
};

// Handle updating a listing
exports.postEditListing = async (req, res) => {
    try {
        const {
            foodName, quantity, pickupTime, location, expiryTime, description,
            foodType, preparedTime, storageMethod, allergens, servingsAvailable
        } = req.body;

        const listing = await FoodListing.findOne({
            _id: req.params.id,
            donor: req.session.user.id
        });

        if (!listing) {
            req.session.error = 'Listing not found';
            return res.redirect('/donor');
        }

        // Only allow editing if not picked up
        if (listing.status === 'picked' || listing.status === 'completed') {
            req.session.error = 'Cannot edit a listing that has been picked up';
            return res.redirect('/donor');
        }

        listing.foodName = foodName;
        listing.quantity = quantity;
        listing.pickupTime = pickupTime;
        listing.location = location;

        // Update coords if location changes
        if (listing.isModified('location')) {
            const coords = await geocodeAddress(location);
            listing.locationCoords = coords;
        }

        listing.expiryTime = expiryTime;
        listing.description = description || '';

        // Phase 3 fields
        listing.foodType = foodType || 'Veg';
        if (preparedTime) listing.preparedTime = new Date(preparedTime);
        listing.storageMethod = storageMethod || 'Room Temperature';
        listing.allergens = allergens ? (Array.isArray(allergens) ? allergens : allergens.split(',').map(s => s.trim())) : [];
        listing.servingsAvailable = parseInt(servingsAvailable);

        await listing.save();
        req.session.success = 'Listing updated successfully!';
        return res.redirect('/donor');
    } catch (err) {
        console.error('Update listing error:', err);
        req.session.error = 'Failed to update listing';
        return res.redirect('/donor');
    }
};

// Handle deleting a listing
exports.deleteListing = async (req, res) => {
    try {
        const listing = await FoodListing.findOne({
            _id: req.params.id,
            donor: req.session.user.id
        });

        if (!listing) {
            req.session.error = 'Listing not found';
            return res.redirect('/donor');
        }

        if (listing.status === 'picked') {
            req.session.error = 'Cannot delete a listing that is being picked up';
            return res.redirect('/donor');
        }

        // Delete related transactions
        await Transaction.deleteMany({ listing: listing._id });
        await FoodListing.findByIdAndDelete(listing._id);

        req.session.success = 'Listing deleted successfully';
        return res.redirect('/donor');
    } catch (err) {
        console.error('Delete listing error:', err);
        req.session.error = 'Failed to delete listing';
        return res.redirect('/donor');
    }
};

// Generate QR code for pickup verification
exports.getPickupQR = async (req, res) => {
    try {
        const QRCode = require('qrcode');
        const listing = await FoodListing.findOne({
            _id: req.params.id,
            donor: req.session.user.id
        });

        if (!listing || !listing.pickupCode) {
            req.session.error = 'Listing or pickup code not found';
            return res.redirect('/donor');
        }

        // Generate QR code as Data URI
        const qrDataUri = await QRCode.toDataURL(listing.pickupCode);

        res.render('donor/viewQR', {
            title: 'Pickup QR Code — Food Flux',
            listing,
            qrDataUri
        });
    } catch (err) {
        console.error('QR generation error:', err);
        req.session.error = 'Failed to generate QR code';
        res.redirect('/donor');
    }
};
