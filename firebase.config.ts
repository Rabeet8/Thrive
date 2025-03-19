import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAeVbdgXYS985qgbLvGKXhJrvAjcIz6_Sw",
  authDomain: "thrive-73805.firebaseapp.com",
  projectId: "thrive-73805",
  storageBucket: "thrive-73805.appspot.com",
  messagingSenderId: "373590173283",
  appId: "1:373590173283:android:7d3799a0c64fb2c56a7a56"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;