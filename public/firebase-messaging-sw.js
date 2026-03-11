// Basic Service Worker for FCM
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// This is a placeholder SW. In a real environment, you'd put your config here.
// firebase.initializeApp({ apiKey: "...", ... });
// const messaging = firebase.messaging();

self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.notification.body,
        icon: '/images/logo.png',
        badge: '/images/badge.png',
        data: data.data
    };
    event.waitUntil(self.registration.showNotification(data.notification.title, options));
});
