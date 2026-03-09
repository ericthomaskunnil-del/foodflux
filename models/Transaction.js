/**
 * Transaction Model
 * Tracks food pickup transactions between donors and volunteers
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodListing',
        required: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['accepted', 'collected', 'completed'],
        default: 'accepted'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
