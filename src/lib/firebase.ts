// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhaPnfVZavlfHQ4UEbORmirHOhRHJvw4I",
  authDomain: "kallinai.firebaseapp.com",
  projectId: "kallinai",
  storageBucket: "kallinai.firebasestorage.app",
  messagingSenderId: "293968338314",
  appId: "1:293968338314:web:fe15f7265de96c6ef7bc73",
  measurementId: "G-1LDHKR8B7F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
