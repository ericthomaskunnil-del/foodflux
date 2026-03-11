const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin with service account if available
const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
} else {
    console.warn('⚠️ Firebase serviceAccountKey.json not found. Push notifications will be logged only.');
}

/**
 * Send push notification to a user
 * @param {Object} user - User object with fcmTokens
 * @param {Object} payload - Notification payload { title, body, data }
 */
exports.sendNotification = async (user, payload) => {
    if (!user.fcmTokens || user.fcmTokens.length === 0) return;

    const message = {
        notification: {
            title: payload.title,
            body: payload.body
        },
        data: payload.data || {},
        tokens: user.fcmTokens
    };

    try {
        if (admin.apps.length > 0) {
            const response = await admin.messaging().sendMulticast(message);
            console.log(`Successfully sent ${response.successCount} notifications`);
        } else {
            console.log('--- Mock Push Notification ---');
            console.log(`To: ${user.name}`);
            console.log(`Title: ${payload.title}`);
            console.log(`Body: ${payload.body}`);
            console.log('------------------------------');
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};
