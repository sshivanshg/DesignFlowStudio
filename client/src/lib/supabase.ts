import { createClient } from '@supabase/supabase-js';

// Get environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration is missing or incomplete. Authentication with Supabase will not work properly.');
}

// Create a single supabase client for interacting with your database
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

let supabase;

try {
  // Only initialize if we have both required values
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
    console.log('Supabase client initialized successfully');
  } else {
    // Create a mock client that logs errors
    supabase = new Proxy({}, {
      get: function(target, prop) {
        if (prop === 'auth') {
          return new Proxy({}, {
            get: function() {
              return () => {
                console.error('Supabase is not properly configured. Check your environment variables.');
                return Promise.reject(new Error('Supabase is not properly configured'));
              };
            }
          });
        }
        return () => Promise.reject(new Error('Supabase is not properly configured'));
      }
    });
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Provide a fallback client that always returns errors
  supabase = new Proxy({}, {
    get: function() {
      return () => Promise.reject(new Error('Failed to initialize Supabase client'));
    }
  });
}

export default supabase;