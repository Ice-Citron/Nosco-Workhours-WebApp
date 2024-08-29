// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMJGLX1bKenk6FEjfwRoWfCtrIUZ9WLTE",
  authDomain: "nosco-app-b5be4.firebaseapp.com",
  projectId: "nosco-app-b5be4",
  storageBucket: "nosco-app-b5be4.appspot.com",
  messagingSenderId: "496900670549",
  appId: "1:496900670549:web:59d3a06ff013e4e9e2c0dc",
  measurementId: "G-19L0MENVMV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
