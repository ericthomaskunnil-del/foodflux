/**
 * Database Seeder
 * Pre-loads users, food listings, and transactions for demo
 */

const User = require('./models/User');
const FoodListing = require('./models/FoodListing');
const Transaction = require('./models/Transaction');

const Review = require('./models/Review');
const Message = require('./models/Message');
const crypto = require('crypto');

async function seedDatabase() {
    try {
        console.log('🌱 Clearing and seeding database...');

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
            address: '88 Service Lane, Kochi',
            isVerifiedVolunteer: true,
            verificationStatus: 'approved'
        });

        // ─── Create Food Listings ─────────────────────────────────────
        const pickupCode1 = crypto.randomBytes(4).toString('hex').toUpperCase();
        const pickupCode2 = crypto.randomBytes(4).toString('hex').toUpperCase();

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
            volunteer: volunteer._id,
            foodType: 'Mixed',
            preparedTime: new Date(Date.now() - 3600000 * 6), // 6 hours ago
            storageMethod: 'Room Temperature',
            allergens: ['Nuts', 'Dairy'],
            servingsAvailable: 25,
            pickupCode: pickupCode1,
            pickupVerified: true,
            actualPickupTime: new Date(Date.now() - 3600000 * 4)
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
            volunteer: volunteer._id,
            foodType: 'Mixed',
            preparedTime: new Date(Date.now() - 3600000 * 8), // 8 hours ago
            storageMethod: 'Refrigerated',
            allergens: ['Gluten', 'Eggs'],
            servingsAvailable: 40,
            pickupCode: pickupCode2,
            pickupVerified: true,
            actualPickupTime: new Date(Date.now() - 3600000 * 5)
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
            volunteer: null,
            foodType: 'Veg',
            preparedTime: new Date(Date.now() - 3600000 * 2), // 2 hours ago
            storageMethod: 'Room Temperature',
            allergens: [],
            servingsAvailable: 30
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
            volunteer: null,
            foodType: 'Veg',
            preparedTime: new Date(Date.now() - 3600000 * 3), // 3 hours ago
            storageMethod: 'Room Temperature',
            allergens: ['Gluten', 'Dairy'],
            servingsAvailable: 20
        });

        const listing5 = await FoodListing.create({
            foodName: 'Dal Tadka & Naan',
            quantity: '15 servings',
            pickupTime: '7:00 PM - 9:00 PM',
            location: 'Fresh Bites, MG Road, Kochi',
            locationCoords: { lat: 9.9312, lng: 76.2673 },
            expiryTime: '11:00 PM Today',
            description: 'Dinner surplus — fresh dal tadka with butter naan and jeera rice.',
            status: 'available',
            approved: false,
            isUrgent: true,
            donor: donor._id,
            volunteer: null,
            foodType: 'Veg',
            preparedTime: new Date(Date.now() - 3600000 * 1), // 1 hour ago
            storageMethod: 'Room Temperature',
            allergens: ['Dairy', 'Gluten'],
            servingsAvailable: 15
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

        // ─── Create Mock Reviews ──────────────────────────────────────
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

        // ─── Create Sample Messages (all 3 accounts) ─────────────────
        await Message.insertMany([
            // Admin ↔ Donor
            {
                sender: admin._id,
                receiver: donor._id,
                content: 'Welcome to Food Flux! Your business profile has been verified for tax-deductible contributions. Feel free to start posting surplus listings!',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 5)
            },
            {
                sender: donor._id,
                receiver: admin._id,
                content: 'Thank you! We are excited to be part of this initiative. We have surplus food almost daily from our restaurant.',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 4.9)
            },
            {
                sender: admin._id,
                receiver: donor._id,
                content: 'That\'s wonderful to hear! Make sure to set accurate pickup times so volunteers can plan their routes efficiently.',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 4.8)
            },

            // Admin ↔ Volunteer
            {
                sender: admin._id,
                receiver: volunteer._id,
                content: 'Welcome to Food Flux, Green Earth NGO! Your volunteer account has been verified ✅. You now have priority access to urgent pickups.',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 4)
            },
            {
                sender: volunteer._id,
                receiver: admin._id,
                content: 'Thank you for verifying our account! Our team of 12 volunteers is ready to help. Is there a way to get notified about urgent listings?',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 3.9)
            },
            {
                sender: admin._id,
                receiver: volunteer._id,
                content: 'Absolutely! You\'ll receive real-time notifications on your dashboard and via email when new food is available nearby. Keep an eye on the live map too!',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 3.8)
            },
            {
                sender: volunteer._id,
                receiver: admin._id,
                content: 'I noticed a bug in the map pins on iPhone 12. Should I report this on GitHub?',
                read: false,
                createdAt: new Date(Date.now() - 3600000 * 5)
            },

            // Donor ↔ Volunteer
            {
                sender: donor._id,
                receiver: volunteer._id,
                content: 'Hello Green Earth NGO! We have a large batch of surplus biryani today — about 25 servings. Can you send someone by 6 PM?',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 2)
            },
            {
                sender: volunteer._id,
                receiver: donor._id,
                content: 'Hi Fresh Bites! That sounds wonderful. We can send a volunteer by 6:30 PM. Please keep it packed and ready.',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 1.9)
            },
            {
                sender: donor._id,
                receiver: volunteer._id,
                content: 'Perfect, the food is packed and ready at the counter. Ask for the manager when you arrive!',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 1.8)
            },
            {
                sender: volunteer._id,
                receiver: donor._id,
                content: 'Picked up successfully! Distributed all 25 servings at the community shelter. Everyone loved the biryani. Thank you so much! 🙏',
                read: true,
                createdAt: new Date(Date.now() - 3600000 * 24 * 1.5)
            },
            {
                sender: donor._id,
                receiver: volunteer._id,
                content: 'A new listing "Assorted Bakery Items" is ready. Are you available for pickup tomorrow morning?',
                read: false,
                createdAt: new Date()
            }
        ]);

        console.log('✅ Database seeded successfully');
        console.log('   📧 Admin:     admin@lfds.com / admin123');
        console.log('   📧 Donor:     donor@lfds.com / donor123');
        console.log('   📧 Volunteer: volunteer@lfds.com / volunteer123');
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    }
}

module.exports = seedDatabase;
