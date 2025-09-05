// Utility functions for debugging user session persistence

export const debugSession = () => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  
  console.log('=== SESSION DEBUG ===');
  console.log('Auth Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  console.log('User Data:', userData || 'NOT FOUND');
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      console.log('Parsed User Data:', parsed);
    } catch (e) {
      console.log('Error parsing user data:', e);
    }
  }
  
  console.log('===================');
};

export const clearSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  console.log('Session cleared - please reload the page');
};

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugSession = debugSession;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).clearSession = clearSession;
}
