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

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log("Attempting to sign in with Google using Firebase");
    
    // Validate Firebase configuration before attempting authentication
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;
    
    if (!projectId || !apiKey || !appId) {
      console.error("Firebase configuration is incomplete:", {
        hasProjectId: !!projectId,
        hasApiKey: !!apiKey,
        hasAppId: !!appId
      });
      throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
    }
    
    console.log("Firebase configuration validated:", {
      projectId,
      hasApiKey: !!apiKey,
      hasAppId: !!appId,
      authDomain: `${projectId}.firebaseapp.com`,
    });
    
    // Use signInWithRedirect instead of popup as it's more reliable, especially in iframe environments
    await signInWithRedirect(auth, googleProvider);
    
    console.log("Redirect to Google sign-in initiated");
    return null; // We'll handle the redirect result on page load
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/configuration-not-found') {
      throw new Error('Google authentication is not properly configured. Please check that your Firebase project has Google sign-in enabled and is properly set up.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for authentication. Please add your domain in the Firebase console under Authentication > Settings > Authorized domains.');
    } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      throw new Error('The authentication process was cancelled.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('The authentication popup was blocked by your browser. Please allow popups for this site.');
    } else if (error.code?.includes('permission-denied') || error.code?.includes('api-key')) {
      throw new Error('The Firebase API key has been suspended or is incorrectly configured. Please check your Firebase project configuration and billing status.');
    } else if (error.code === 'auth/internal-error') {
      throw new Error('An internal authentication error occurred. Please try again or contact support if the issue persists.');
    } else {
      // For unknown errors, include the original error message if available
      const errorMessage = error.message || 'An unknown error occurred';
      throw new Error(`Google sign-in failed: ${errorMessage}`);
    }
  }
};

// Handle Google redirect auth
export const handleGoogleRedirect = async () => {
  try {
    console.log("Checking for Google Auth redirect result");
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Successfully handled Google redirect auth");
      
      // Get the user's information
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      console.log("Google auth successful - user email:", user.email);
      
      // Return the result with some additional context
      return {
        user,
        credential,
        token,
        success: true
      };
    } else {
      console.log("No redirect result found (expected on first page load)");
      return null;
    }
  } catch (error: any) {
    console.error("Error handling Google redirect:", error);
    
    let errorMessage = "Failed to complete Google Sign-In";
    
    // Provide more specific error messages for common issues
    if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = "An account already exists with the same email address but different sign-in credentials. Try signing in with a different method.";
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = "The authentication process was cancelled.";
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = "The authentication popup was blocked by the browser. Please allow popups for this site.";
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = "The authentication popup was closed before the process completed.";
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = "This domain is not authorized for Google authentication. Please contact the administrator.";
    }
    
    // Throw a more informative error
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).originalError = error;
    (enhancedError as any).code = error.code;
    throw enhancedError;
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