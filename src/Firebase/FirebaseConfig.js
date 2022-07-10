import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage, ref } from "firebase/storage";
const firebaseConfig = {
    apiKey: "AIzaSyDZID4TPI6THURVBbm7QFQwpXzClNLAf0o",
    authDomain: "authentication-b22a4.firebaseapp.com",
    projectId: "authentication-b22a4",
    storageBucket: "authentication-b22a4.appspot.com",
    messagingSenderId: "759188499619",
    appId: "1:759188499619:web:0ea88d5ae68844fead6316"
  };
  

const app = initializeApp(firebaseConfig);
 export  const auth = getAuth(app)
 export const db = getFirestore(app);
 export const database = getDatabase(app);
 export const storage = getStorage();

 export const storageRef = ref(storage);
