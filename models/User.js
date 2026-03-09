/**
 * User Model
 * Stores donor, volunteer, and admin accounts
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'donor', 'volunteer'],
        required: [true, 'Role is required']
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },

    // --- Phase 2: Restaurant & Trust Fields (Primarily for Donors) ---
    restaurantName: {
        type: String,
        default: ''
    },
    profileImageUrl: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    locationCoords: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    trustScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    ratingsCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
