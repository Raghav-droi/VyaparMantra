import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBwvBIp9KarqwiBMQMTYdYCXcFZJpUDO6Y",
  authDomain: "vm-authentication-4d4ea.firebaseapp.com",
  projectId: "vm-authentication-4d4ea",
  storageBucket: "vm-authentication-4d4ea.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "1:1096903709567:web:8c2c8e2e2e2e2e2e2e2e2e"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export { firebase, auth };