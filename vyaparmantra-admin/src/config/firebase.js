import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBwvBIp9KarqwiBMQMTYdYCXcFZJpUDO6Y", // Actual API key
  authDomain: "vm-authentication-4d4ea.firebaseapp.com",
  projectId: "vm-authentication-4d4ea",
  storageBucket: "vm-authentication-4d4ea.appspot.com",
  messagingSenderId: "your-sender-id", // Replace with actual sender ID
  appId: "1:1096903709567:web:8c2c8e2e2e2e2e2e2e2e2e" // Replace with your actual App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
