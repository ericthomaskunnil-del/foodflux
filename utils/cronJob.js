const cron = require('node-cron');
const FoodListing = require('../models/FoodListing');

exports.initCronJobs = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running expiry alert cron job...');
        try {
            // Find listings that are still available
            const activeListings = await FoodListing.find({ status: 'available' });

            const now = new Date();
            let updatedCount = 0;

            for (const listing of activeListings) {
                // Determine urgency based on string 'expiryTime' logic.
                // In a production app with Date objects, you'd calculate exact hour differences.
                // Assuming `expiryTime` format includes the word 'Today' for simplistic logic:
                if (listing.expiryTime.toLowerCase().includes('today') && !listing.isUrgent) {
                    listing.isUrgent = true;
                    await listing.save();
                    updatedCount++;
                }
            }

            console.log(`✅ Expiry cron job finished. Marked ${updatedCount} listings as urgent.`);
        } catch (err) {
            console.error('Error running expiry cron job:', err);
        }
    });

    console.log('✅ Cron jobs initialized.');
};
