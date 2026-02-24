importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDCTRbMKCRo-VypR6tL7MCquS9QSCVLaqk",
    authDomain: "rideguard-b23e5.firebaseapp.com",
    projectId: "rideguard-b23e5",
    storageBucket: "rideguard-b23e5.firebasestorage.app",
    messagingSenderId: "152987221322",
    appId: "1:152987221322:web:07025a72e3a975dd6f95b3"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Emergency Alert';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'An emergency alert was triggered.',
        icon: '/vite.svg',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
