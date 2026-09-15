import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: "talktive-ba533.firebaseapp.com",
  projectId: "talktive-ba533",
  storageBucket: "talktive-ba533.firebasestorage.app",
  messagingSenderId: "727681387639",
  appId: "1:727681387639:web:1435309a9b83423eee8a72",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;