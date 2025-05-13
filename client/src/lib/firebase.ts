import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
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
  // Create a new RecaptchaVerifier instance, or clear and recreate if it exists
  if ((window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier.clear();
  }
  
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerID, {
    size: 'invisible',
    callback: () => {
      console.log("reCAPTCHA solved, allowing signInWithPhoneNumber");
    },
    'expired-callback': () => {
      console.log("reCAPTCHA expired");
    }
  });
  
  // Store in window for potential reuse
  (window as any).recaptchaVerifier = recaptchaVerifier;

  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

// Google authentication provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google Popup
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Handle Google redirect auth
export const handleGoogleRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Error handling Google redirect:", error);
    throw error;
  }
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