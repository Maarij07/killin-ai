'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { logger } from '../lib/logger';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  authType: 'firebase' | 'api'; // Track which auth system is used
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  loginUser: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const API_BASE_URL = 'https://3758a6b3509d.ngrok-free.app/api';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    console.log('=== UserProvider initializing ===');
    
    // Step 1: Try to restore from localStorage immediately
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_data');
    
    console.log('Stored token:', storedToken ? 'exists' : 'none');
    console.log('Stored user:', storedUser ? 'exists' : 'none');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('✅ Restoring user session:', userData.email);
        
        const restoredUser = {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name,
          role: userData.role || 'user',
          authType: 'api' as const
        };
        
        setUser(restoredUser);
        setIsLoading(false);
        setSessionRestored(true);
        
        console.log('✅ User session restored successfully');
        
        // Validate token in background (don't await)
        validateTokenInBackground(storedToken);
        
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        localStorage.removeItem('user_data');
        localStorage.removeItem('auth_token');
        setIsLoading(false);
      }
    } else {
      // Step 2: No stored session, check for fresh authentication
      console.log('No stored session, checking authentication...');
      initializeAuth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = () => {
    console.log('Initializing fresh authentication check...');
    
    // Only check for tokens if no session was restored
    if (!sessionRestored) {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        console.log('Found token without user data, validating...');
        // Try to get user info with this token
        fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Token invalid');
          }
        })
        .then(userData => {
          console.log('✅ Token valid, setting user:', userData.email);
          const userObj = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.name || userData.email?.split('@')[0] || 'User',
            role: userData.role || 'user',
            authType: 'api' as const
          };
          
          setUser(userObj);
          localStorage.setItem('user_data', JSON.stringify(userObj));
          setIsLoading(false);
        })
        .catch(error => {
          console.log('❌ Token invalid or expired:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          // No API token, check Firebase auth
          checkFirebaseAuth();
        });
      } else {
        // No API token at all, check Firebase auth
        console.log('No authentication token found, checking Firebase...');
        checkFirebaseAuth();
      }
    }
  };

  const checkFirebaseAuth = () => {
    console.log('Setting up Firebase auth listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log('Firebase user found:', firebaseUser.email);
        try {
          const db = getFirestore();
          const adminsCollection = collection(db, 'admins');
          const adminQuery = query(adminsCollection, where('email', '==', (firebaseUser.email || '').toLowerCase()));
          const querySnapshot = await getDocs(adminQuery);
          
          if (!querySnapshot.empty) {
            const adminDoc = querySnapshot.docs[0];
            const adminData = adminDoc.data();
            
            // Check if admin is disabled
            if (adminData.disabled === true) {
              await signOut(auth);
              await logger.logSystemAction(
                'DISABLED_ADMIN_AUTO_SIGNOUT',
                `Disabled admin was automatically signed out: ${firebaseUser.email}`,
                'HIGH'
              );
              setUser(null);
              setIsLoading(false);
              return;
            }
          }
          
          // Admin is not disabled, set user
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
            role: 'admin',
            authType: 'firebase'
          };
          console.log('Setting Firebase admin user:', userData);
          setUser(userData);
          setIsLoading(false);
        } catch (firestoreError) {
          console.error('Error checking admin status:', firestoreError);
          // If Firestore check fails, still allow access
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
            role: 'admin',
            authType: 'firebase'
          };
          setUser(userData);
          setIsLoading(false);
        }
      } else {
        console.log('No Firebase user found');
        setUser(null);
        setIsLoading(false);
      }
    });
    
    // Return cleanup function
    return unsubscribe;
  };

  const validateTokenInBackground = async (token: string) => {
    try {
      console.log('Validating token in background...');
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (response.ok) {
        const currentUserData = await response.json();
        console.log('Token is valid, updating user data:', currentUserData);
        
        const updatedUser = {
          id: currentUserData.id.toString(),
          email: currentUserData.email,
          name: currentUserData.name || currentUserData.email?.split('@')[0] || 'User',
          role: currentUserData.role || 'user',
          authType: 'api' as const
        };
        
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      } else {
        console.log('Token is invalid, clearing session');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setUser(null);
      }
    } catch (error) {
      console.error('Background token validation failed:', error);
      // Don't clear session on network errors, keep user logged in
    }
  };


  const loginUser = async (usernameOrEmail: string, password: string) => {
    // User login via API
    console.log('UserContext - loginUser called with:', usernameOrEmail);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ username: usernameOrEmail, password }) // Send username field as API expects
      });
      
      const data = await response.json();
      console.log('UserContext - API response:', data);
      
      if (response.ok && data.success && data.data && data.data.access_token) {
        // Store token
        localStorage.setItem('auth_token', data.data.access_token);
        
        // Set user data
        const userData: User = {
          id: data.data.user.id,
          email: data.data.user.email,
          name: data.data.user.name || data.data.user.email?.split('@')[0] || data.data.user.username || 'User',
          role: data.data.user.role || 'user',
          authType: 'api'
        };
        console.log('UserContext - Setting user data:', userData);
        setUser(userData);
        
        // Save user data to localStorage for persistence
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        return { success: true };
      } else {
        // Handle API errors
        let errorMessage = 'Unable to sign in. Please try again.';
        
        if (data.message) {
          errorMessage = data.message;
        } else if (response.status === 401) {
          errorMessage = 'Invalid username/email or password. Please check your credentials and try again.';
        } else if (response.status === 404) {
          errorMessage = 'No account found with this username/email.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error: unknown) {
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    // Admin login via Firebase
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Check if admin is disabled in Firestore
      try {
        const db = getFirestore();
        const adminsCollection = collection(db, 'admins');
        const adminQuery = query(adminsCollection, where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(adminQuery);
        
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          const adminData = adminDoc.data();
          
          // Check if admin is disabled
          if (adminData.disabled === true) {
            // Sign out the user immediately
            await signOut(auth);
            
            // Log attempted login by disabled admin
            await logger.logSystemAction(
              'DISABLED_ADMIN_LOGIN_ATTEMPT',
              `Disabled admin attempted to login: ${email}`,
              'HIGH'
            );
            
            return { 
              success: false, 
              error: 'Your account has been disabled. Please contact a system administrator for assistance.' 
            };
          }
        }
        
        // Admin is not disabled or not found in Firestore (allow login for backwards compatibility)
        // Log successful admin login
        await logger.logAdminLogin(email);
        
        return { success: true };
      } catch (firestoreError) {
        console.error('Error checking admin disabled status:', firestoreError);
        
        // If Firestore check fails, still allow login but log the issue
        console.warn('Could not verify admin status, allowing login');
        await logger.logSystemAction(
          'ADMIN_STATUS_CHECK_FAILED',
          `Could not verify admin status for login: ${email}. Error: ${firestoreError}`,
          'MEDIUM'
        );
        
        // Log successful admin login
        await logger.logAdminLogin(email);
        
        return { success: true };
      }
    } catch (error: unknown) {
      let errorMessage = 'Unable to sign in. Please try again.';
      
      const firebaseError = error as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address. Please check your email or create an account.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please check your password and try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been temporarily disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please wait a moment and try again.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        default:
          // Handle generic Firebase errors
          if (firebaseError.message && firebaseError.message.includes('Firebase')) {
            errorMessage = 'Authentication service temporarily unavailable. Please try again later.';
          } else {
            errorMessage = 'Something went wrong during sign in. Please try again.';
          }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Log logout before signing out
      if (user?.email) {
        if (user.authType === 'firebase') {
          await logger.logAdminLogout(user.email);
        }
      }
      
      if (user?.authType === 'firebase') {
        // Firebase logout
        await signOut(auth);
      } else {
        // API logout
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Call logout endpoint to invalidate token on server
          fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            }
          }).catch(() => {}); // Ignore errors for logout
        }
        
        // Remove token and user data from storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Clear user state
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, loginUser, loginAdmin, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
