/**
 * FoodListing Model
 * Stores surplus food entries posted by donors
 */

const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
    foodName: {
        type: String,
        required: [true, 'Food name is required'],
        trim: true
    },
    quantity: {
        type: String,
        required: [true, 'Quantity is required'],
        trim: true
    },
    pickupTime: {
        type: String,
        required: [true, 'Pickup time is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    locationCoords: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    expiryTime: {
        type: String,
        required: [true, 'Expiry time is required']
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['available', 'picked', 'expired', 'completed'],
        default: 'available'
    },
    approved: {
        type: Boolean,
        default: false
    },
    isUrgent: {
        type: Boolean,
        default: false
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // --- Phase 3: Food Safety Compliance ---
    foodType: {
        type: String,
        enum: ['Veg', 'Non-Veg', 'Mixed'],
        default: 'Veg'
    },
    preparedTime: {
        type: Date,
        required: [true, 'Preparation time is required']
    },
    storageMethod: {
        type: String,
        enum: ['Room Temperature', 'Refrigerated', 'Frozen'],
        default: 'Room Temperature'
    },
    allergens: {
        type: [String],
        default: []
    },
    servingsAvailable: {
        type: Number,
        required: [true, 'Number of servings is required'],
        min: 1
    },

    // --- Phase 3: QR Code Verification ---
    pickupCode: {
        type: String,
        unique: true,
        sparse: true
    },
    pickupVerified: {
        type: Boolean,
        default: false
    },
    actualPickupTime: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FoodListing', foodListingSchema);
