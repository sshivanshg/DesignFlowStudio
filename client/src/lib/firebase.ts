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
export const setupRecaptcha = async (phoneNumber: string, containerID: string) => {
  try {
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

    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  } catch (error: any) {
    console.error("Phone authentication failed:", error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('The phone number is invalid. Please enter a valid phone number with country code (e.g., +1234567890).');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('The reCAPTCHA verification failed. Please try again.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota has been exceeded. Please try again later.');
    } else if (error.code?.includes('permission-denied') || error.code?.includes('api-key')) {
      throw new Error('The Firebase API key has been suspended or is incorrectly configured. Please check your Firebase project configuration and billing status.');
    } else {
      throw error;
    }
  }
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
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for authentication. Please add your domain in the Firebase console under Authentication > Settings > Authorized domains.');
    } else if (error.code?.includes('permission-denied') || error.code?.includes('api-key')) {
      throw new Error('The Firebase API key has been suspended or is incorrectly configured. Please check your Firebase project configuration and billing status.');
    } else {
      throw error;
    }
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