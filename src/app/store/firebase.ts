import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const configs = import.meta.glob("../../../firebase-applet-config.json", { eager: true }) as Record<string, { default: any }>;
const rawConfig = configs["../../../firebase-applet-config.json"]?.default || {};

const firebaseConfig = {
  apiKey: rawConfig.apiKey || "demo-api-key",
  authDomain: rawConfig.authDomain || "demo.firebaseapp.com",
  projectId: rawConfig.projectId || "demo-project",
  storageBucket: rawConfig.storageBucket || "demo.appspot.com",
  messagingSenderId: rawConfig.messagingSenderId || "000000000000",
  appId: rawConfig.appId || "1:000000000000:web:0000000000000000000000",
};

export const isFirebaseConfigured = Boolean(
  rawConfig.apiKey &&
  rawConfig.apiKey !== "demo-api-key" &&
  rawConfig.projectId &&
  rawConfig.projectId !== "demo-project"
);

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = rawConfig.firestoreDatabaseId 
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  if (!isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
