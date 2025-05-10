import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxLJ2DKcBxyZPjeHxlUCaHL8p9N6uEWWI",
  authDomain: "haul-thrift-shop.firebaseapp.com",
  projectId: "haul-thrift-shop",
  storageBucket: "haul-thrift-shop.firebasestorage.app",
  messagingSenderId: "1037279820884",
  appId: "1:1037279820884:web:f033a9907a5762c6b3c1c1",
  measurementId: "G-Y6SQKXGZQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
