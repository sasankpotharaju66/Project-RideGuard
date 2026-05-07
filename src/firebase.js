import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDCtRbMKCRo-VypR6tL7MCquS9QSCVLaqk",
  authDomain: "rideguard-b23e5.firebaseapp.com",
  projectId: "rideguard-b23e5",
  storageBucket: "rideguard-b23e5.firebasestorage.app",
  messagingSenderId: "152987221322",
  appId: "1:152987221322:web:07025a72e3a975dd6f95b3",
  measurementId: "G-4MT8KXP1N6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

let messagingInstance = null;
try {
  messagingInstance = getMessaging(app);
} catch (e) {
  console.warn("Firebase messaging not supported in this environment");
}
export const messaging = messagingInstance;

// Connect to emulators if running locally
if (window.location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8082);
}