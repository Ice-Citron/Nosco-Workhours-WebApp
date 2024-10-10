// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMJGLX1bKenk6FEjfwRoWfCtrIUZ9WLTE",
  authDomain: "nosco-app-b5be4.firebaseapp.com",
  projectId: "nosco-app-b5be4",
  storageBucket: "nosco-app-b5be4.appspot.com",
  messagingSenderId: "496900670549",
  appId: "1:496900670549:web:59d3a06ff013e4e9e2c0dc",
  measurementId: "G-19L0MENVMV"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services and app
export { auth, firestore, storage, app };