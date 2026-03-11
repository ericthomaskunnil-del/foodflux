/**
 * Seed Messages Script
 * Populates the database with sample conversations for demonstration.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const dotenv = require('dotenv');

dotenv.config();

async function seedMessages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/lfds');
        console.log('Connected to MongoDB for seeding messages...');

        const admin = await User.findOne({ email: 'admin@lfds.com' });
        const donor = await User.findOne({ email: 'donor@lfds.com' });
        const volunteer = await User.findOne({ email: 'volunteer@lfds.com' });

        if (!admin || !donor || !volunteer) {
            console.error('Test users not found. Please ensure the main seed script has been run.');
            process.exit(1);
        }

        const messages = [
            {
                sender: donor._id,
                receiver: volunteer._id,
                content: "Hello! I have some fresh bread and pastries ready for pickup. Can you come around 5 PM?",
                createdAt: new Date(Date.now() - 86400000) // 1 day ago
            },
            {
                sender: volunteer._id,
                receiver: donor._id,
                content: "Hi Eric! Yes, I can be there at 5 PM. Is there parking space available for my van?",
                createdAt: new Date(Date.now() - 82800000) // 23 hours ago
            },
            {
                sender: donor._id,
                receiver: volunteer._id,
                content: "Yes, you can park right in front of the restaurant's loading dock. See you then!",
                createdAt: new Date(Date.now() - 79200000) // 22 hours ago
            },
            {
                sender: admin._id,
                receiver: donor._id,
                content: "Welcome to Food Flux! Your account has been verified. Let us know if you need any assistance.",
                createdAt: new Date(Date.now() - 172800000) // 2 days ago
            },
            {
                sender: volunteer._id,
                receiver: admin._id,
                content: "Quick question: Does the app track mileage for tax purposes?",
                createdAt: new Date(Date.now() - 43200000) // 12 hours ago
            }
        ];

        // Clear existing messages to avoid duplicates during testing
        await Message.deleteMany({});
        console.log('Cleared existing messages.');

        await Message.insertMany(messages);
        console.log('Successfully seeded sample messages!');

        await mongoose.connection.close();
        console.log('Connection closed.');
    } catch (err) {
        console.error('Error seeding messages:', err);
        process.exit(1);
    }
}

seedMessages();
