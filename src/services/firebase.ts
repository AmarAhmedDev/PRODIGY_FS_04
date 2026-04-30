import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7b9hmwXeJdKQUeaRoDlmJafymUyiagro",
  authDomain: "prodigy-task-1.firebaseapp.com",
  projectId: "prodigy-task-1",
  storageBucket: "prodigy-task-1.firebasestorage.app",
  messagingSenderId: "660032754498",
  appId: "1:660032754498:web:acc94b7d7c6a26a4e6eedb",
  measurementId: "G-T9Q979GDFX",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const IMAGEKIT_PUBLIC_KEY = "public_rqYJ+/XO2EQooB/NX+1cT2Ao8l4=";
export const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/prodigytask";