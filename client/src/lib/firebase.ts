import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signOut as firebaseSignOut
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// OTP Authentication functions
export const setupRecaptcha = (phoneNumber: string, containerID: string) => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerID, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber
    }
  });

  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

// Sign out function
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error("Error signing out: ", error);
    return false;
  }
};

export default app;