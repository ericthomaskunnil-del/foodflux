/**
 * Database Seeder
 * Pre-loads users, food listings, and transactions for demo
 */

const User = require('./models/User');
const FoodListing = require('./models/FoodListing');
const Transaction = require('./models/Transaction');

const Review = require('./models/Review');
const Message = require('./models/Message');

async function seedDatabase() {
    try {
        console.log('🌱 Clearing and seeding database for Phase 2 demo...');

        // Clear existing data to force fresh seed
        await User.deleteMany({});
        await FoodListing.deleteMany({});
        await Transaction.deleteMany({});
        await Review.deleteMany({});
        await Message.deleteMany({});

        // ─── Create Users ─────────────────────────────────────────────
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@lfds.com',
            password: 'admin123',
            role: 'admin',
            phone: '+91 98765 43210',
            address: 'LFDS Head Office, Mumbai'
        });

        const donor = await User.create({
            name: 'Fresh Bites Restaurant',
            email: 'donor@lfds.com',
            password: 'donor123',
            role: 'donor',
            phone: '+91 98765 43211',
            address: '42 Food Street, Kochi',
            restaurantName: 'Fresh Bites Restaurant',
            profileImageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
            description: 'A premium casual dining experience specializing in authentic local cuisine and sustainable practices.',
            trustScore: 4.8,
            ratingsCount: 156,
            locationCoords: { lat: 9.9312, lng: 76.2673 }
        });

        const volunteer = await User.create({
            name: 'Green Earth NGO',
            email: 'volunteer@lfds.com',
            password: 'volunteer123',
            role: 'volunteer',
            phone: '+91 98765 43212',
            address: '88 Service Lane, Kochi'
        });

        // ─── Create Food Listings ─────────────────────────────────────
        const listing1 = await FoodListing.create({
            foodName: 'Biryani & Rice Bowls',
            quantity: '25 servings',
            pickupTime: '6:00 PM - 8:00 PM',
            location: 'Fresh Bites, MG Road, Kochi',
            expiryTime: '10:00 PM Today',
            description: 'Leftover catering order — freshly prepared chicken and veg biryani',
            status: 'completed',
            approved: true,
            donor: donor._id,
            volunteer: volunteer._id
        });

        const listing2 = await FoodListing.create({
            foodName: 'Assorted Sandwiches',
            quantity: '40 pieces',
            pickupTime: '2:00 PM - 4:00 PM',
            location: 'Café Central, Marine Drive, Kochi',
            expiryTime: '6:00 PM Today',
            description: 'Surplus from a corporate event — veg and non-veg options',
            status: 'completed',
            approved: true,
            donor: donor._id,
            volunteer: volunteer._id
        });

        const listing3 = await FoodListing.create({
            foodName: 'Fresh Fruit Platter',
            quantity: '15 kg',
            pickupTime: '10:00 AM - 12:00 PM',
            location: 'Organic Market, Panampilly Nagar, Kochi',
            locationCoords: { lat: 9.9575, lng: 76.2977 },
            expiryTime: '5:00 PM Today',
            description: 'Seasonal fruits — bananas, apples, oranges. Slightly overripe but good for consumption.',
            status: 'available',
            approved: true,
            donor: donor._id,
            volunteer: null
        });

        const listing4 = await FoodListing.create({
            foodName: 'Assorted Bakery Items',
            quantity: '20 pieces',
            pickupTime: '4:00 PM - 6:00 PM',
            location: 'Fort Kochi Bakery, Fort Kochi',
            locationCoords: { lat: 9.9658, lng: 76.2421 },
            expiryTime: '8:00 PM Today',
            description: 'Assorted day-old breads and pastries. Perfectly safe to eat.',
            status: 'available',
            approved: true,
            donor: donor._id,
            volunteer: null
        });

        // ─── Create Completed Transactions ────────────────────────────
        await Transaction.create({
            listing: listing1._id,
            donor: donor._id,
            volunteer: volunteer._id,
            status: 'completed',
            notes: 'Picked up successfully. Distributed to 25 people at the shelter.'
        });

        await Transaction.create({
            listing: listing2._id,
            donor: donor._id,
            volunteer: volunteer._id,
            status: 'completed',
            notes: 'Collected from café. Distributed to children at community center.'
        });

        // ─── Create Mock Database Reviews ─────────────────────────────
        await Review.create({
            reviewer: volunteer._id,
            reviewee: donor._id,
            listing: listing1._id,
            rating: 5,
            comment: 'Fantastic quality and very smooth pickup!'
        });

        await Review.create({
            reviewer: volunteer._id,
            reviewee: donor._id,
            listing: listing2._id,
            rating: 4,
            comment: 'Good food, friendly staff.'
        });

        // ─── Create Mock Messages ─────────────────────────────────────
        await Message.create({
            sender: donor._id,
            receiver: volunteer._id,
            content: 'Hello Green Earth NGO! We have a large batch of surplus biryani today.',
            read: true,
            createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
        });

        await Message.create({
            sender: volunteer._id,
            receiver: donor._id,
            content: 'Hi Fresh Bites! That sounds wonderful. We can send a volunteer by 6:30 PM.',
            read: true,
            createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        });

        await Message.create({
            sender: donor._id,
            receiver: volunteer._id,
            content: 'Perfect, the food is packed and ready. See you soon!',
            read: false,
            createdAt: new Date() // Just now
        });

        console.log('✅ Database seeded successfully');
        console.log('   📧 Admin:     admin@lfds.com / admin123');
        console.log('   📧 Donor:     donor@lfds.com / donor123');
        console.log('   📧 Volunteer: volunteer@lfds.com / volunteer123');
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    }
}

module.exports = seedDatabase;
