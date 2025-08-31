'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

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
const API_BASE_URL = 'https://3f7731ee4ca3.ngrok-free.app/api';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    // Check Firebase auth first
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Firebase user found (admin)
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
          role: 'admin',
          authType: 'firebase'
        };
        setUser(userData);
        setIsLoading(false);
        return; // Exit early for Firebase users
      } 
      
      // No Firebase user, check API token
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Validate token with API
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name || userData.email?.split('@')[0] || 'User',
              role: userData.role || 'user',
              authType: 'api'
            });
          } else {
            // Token invalid, remove it
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('API auth check failed:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    // Return unsubscribe function
    return unsubscribe;
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
      return { success: true };
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
        
        // Remove token from storage
        localStorage.removeItem('auth_token');
        
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
