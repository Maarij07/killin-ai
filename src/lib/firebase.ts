// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCgDAuiCa_flJBgKSOK6TI3PUeoQOgVGbQ",
  authDomain: "kallin-ai.firebaseapp.com",
  projectId: "kallin-ai",
  storageBucket: "kallin-ai.firebasestorage.app",
  messagingSenderId: "47701581765",
  appId: "1:47701581765:web:59432d8101abffa746f5ac",
  measurementId: "G-R93KR21Q2S"
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
