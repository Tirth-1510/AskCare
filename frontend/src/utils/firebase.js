// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDMLcromvOvkgXBJvdAhXM-8KA97Btw5E",
  authDomain: "askcare.firebaseapp.com",
  projectId: "askcare",
  storageBucket: "askcare.firebasestorage.app",
  messagingSenderId: "654840165541",
  appId: "1:654840165541:web:96e47ecf3c53c94bf1c94c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, googleProvider };
