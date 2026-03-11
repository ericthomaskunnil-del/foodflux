const cron = require('node-cron');
const FoodListing = require('../models/FoodListing');

exports.initCronJobs = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running expiry alert cron job...');
        try {
            // Bulk update listings that are available and contain 'today' in expiryTime
            // This is more efficient than a loop for large datasets
            const result = await FoodListing.updateMany(
                {
                    status: 'available',
                    isUrgent: { $ne: true },
                    expiryTime: { $regex: /today/i }
                },
                { $set: { isUrgent: true } }
            );

            console.log(`✅ Expiry cron job finished. Marked ${result.modifiedCount} listings as urgent.`);
        } catch (err) {
            console.error('Error running expiry cron job:', err);
        }
    });

    console.log('✅ Cron jobs initialized.');
};
