import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

let app;
let auth: any = null;

export function getFirebaseAuth() {
  if (!auth) {
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API key is missing in firebase-applet-config.json.");
    }
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  }
  return auth;
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });
  return provider;
}
