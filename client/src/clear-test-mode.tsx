// This is a utility component to clear test mode settings
import { useEffect } from 'react';

export function ClearTestMode() {
  useEffect(() => {
    // Clear all test mode settings
    sessionStorage.removeItem('user_test_role');
    document.cookie = 'user_test_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('Test mode settings cleared');
  }, []);
  
  return null;
}