'use client';

import Image from 'next/image';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { PowerIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import UserPricing from './UserPricing';
import Modal from './Modal';
import StripeErrorBoundary from './StripeErrorBoundary';
import { useState, useEffect } from 'react';
import colors from '../../colors.json';

interface UserDetails {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  minutes_allowed: number;
  minutes_used: number;
  description?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
  join_date?: string;
  [key: string]: string | number | boolean | undefined;
}

export default function UserDashboard() {
  const { user, logout } = useUser();
  const { showSuccess, showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);

  // Fetch user details from /api/auth/users
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('https://server.kallin.ai/api/auth/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('All users data:', data);
          
          // Find current user by ID - handle different response formats
          let currentUserDetails = null;
          if (data.users && Array.isArray(data.users)) {
            currentUserDetails = data.users.find((u: UserDetails) => u.id === parseInt(user.id));
          } else if (Array.isArray(data)) {
            currentUserDetails = data.find((u: UserDetails) => u.id === parseInt(user.id));
          }
          
          if (currentUserDetails) {
            setUserDetails(currentUserDetails);
            console.log('Current user details:', currentUserDetails);
          } else {
            console.log('User not found in users list - account may have been deleted');
            setAccountDeleted(true);
          }
        } else if (response.status === 404 || response.status === 401) {
          // User not found or unauthorized - account deleted
          console.error('User account not found or unauthorized');
          setAccountDeleted(true);
        } else {
          console.error('Failed to fetch users:', response.status);
          showError('Failed to load user details');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        // Check if it's a data.find is not a function error
        if (error instanceof TypeError && error.message.includes('find')) {
          console.log('Account data format issue - account may be deleted');
          setAccountDeleted(true);
        } else {
          showError('Failed to load user details');
        }
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchUserDetails();
  }, [user?.id, user, showError]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    showSuccess('You have been signed out successfully');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // Account deleted state
  if (accountDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
          border: isDark ? '1px solid #4a5568' : '1px solid #cbd5e0',
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Your Account Has Been Deleted
          </h2>
          <p className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            We couldn&apos;t find your account in our system. Your account may have been deleted by an administrator.
          </p>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="px-6 py-3 rounded-lg text-white font-medium transition-all duration-200"
            style={{ backgroundColor: colors.colors.primary }}
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Loading state for user details
  if (isLoadingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
          border: isDark ? '1px solid #4a5568' : '1px solid #cbd5e0',
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      {/* Top Navigation Bar with Glassmorphism */}
      <nav className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: isDark 
            ? `${colors.colors.dark}D9` // Using the same dark color (#1a1a1a) with 85% opacity
            : 'rgba(255, 255, 255, 0.85)', // White with transparency
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: isDark 
            ? `1px solid ${colors.colors.dark}4D` // Same dark color with 30% opacity for border
            : '1px solid rgba(229, 231, 235, 0.3)',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-3">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src={isDark ? '/logo-dark.png' : '/logo.png'}
                alt="KALLIN.AI"
                width={173}
                height={173}
                className="h-24 w-auto transition-opacity duration-300"
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-6">
              {/* User Info */}
              <div className="hidden sm:block">
                <span className={`text-base font-medium ${isDark ? 'text-gray-100' : 'text-gray-700'}`}>
                  Welcome, <span className="font-semibold">{user?.name}</span>
                </span>
              </div>

              {/* Theme Toggle - Desktop style with Glassmorphism */}
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg" 
                style={{ 
                  backgroundColor: isDark 
                    ? `${colors.colors.dark}99` // Same dark color with 60% opacity
                    : 'rgba(243, 244, 246, 0.6)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isDark 
                    ? `1px solid ${colors.colors.dark}4D` // Same dark color with 30% opacity
                    : '1px solid rgba(229, 231, 235, 0.3)'
                }}>
                {/* Light mode box */}
                <button
                  onClick={() => isDark && toggleTheme()}
                  className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: !isDark 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'transparent',
                    color: !isDark 
                      ? '#111827'
                      : isDark ? 'rgba(156, 163, 175, 0.8)' : '#6B7280',
                    backdropFilter: !isDark ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: !isDark ? 'blur(10px)' : 'none',
                    border: !isDark 
                      ? '1px solid rgba(229, 231, 235, 0.3)' 
                      : 'none',
                    boxShadow: !isDark 
                      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (isDark) {
                      e.currentTarget.style.color = 'rgba(209, 213, 219, 1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isDark) {
                      e.currentTarget.style.color = 'rgba(156, 163, 175, 0.8)';
                    }
                  }}
                >
                  <SunIcon className="h-4 w-4 mr-2" />
                  Light
                </button>
                
                {/* Dark mode box */}
                <button
                  onClick={() => !isDark && toggleTheme()}
                  className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: isDark 
                      ? 'rgba(15, 15, 15, 0.9)' 
                      : 'transparent',
                    color: isDark 
                      ? '#FFFFFF'
                      : '#6B7280',
                    backdropFilter: isDark ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: isDark ? 'blur(10px)' : 'none',
                    border: isDark 
                      ? '1px solid rgba(40, 40, 40, 0.5)' 
                      : 'none',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDark) {
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDark) {
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  <MoonIcon className="h-4 w-4 mr-2" />
                  Dark
                </button>
              </div>

              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                className="sm:hidden p-2 rounded-lg transition-all duration-200"
                style={{
                  color: isDark ? '#F3F4F6' : '#6B7280',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark 
                    ? `${colors.colors.dark}99` // Same dark color with 60% opacity
                    : 'rgba(243, 244, 246, 0.6)';
                  e.currentTarget.style.color = isDark ? '#FFFFFF' : '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = isDark ? '#F3F4F6' : '#6B7280';
                }}
                title="Toggle theme"
              >
                {isDark ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="p-3 rounded-lg transition-all duration-200"
                style={{
                  color: isDark ? '#F3F4F6' : '#6B7280',
                  backgroundColor: 'transparent',
                  background: isDark 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                  border: isDark
                    ? '1px solid #4a5568'
                    : '1px solid #cbd5e0',
                  boxShadow: isDark
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark 
                    ? 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 25%, #3d3d3d 50%, #2f2f2f 75%, #3a3a3a 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 25%, #ffffff 50%, #f9f9f9 75%, #ffffff 100%)';
                  e.currentTarget.style.color = isDark ? '#FFFFFF' : '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)';
                  e.currentTarget.style.color = isDark ? '#F3F4F6' : '#6B7280';
                }}
                title="Sign out"
              >
                <PowerIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <StripeErrorBoundary>
          <UserPricing userPlan={userDetails?.plan} />
        </StripeErrorBoundary>
      </main>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        icon={<PowerIcon className="h-6 w-6" />}
        title="Sign out of your account"
        description="Are you sure you want to sign out? You will need to sign in again to access your account."
        primaryButton={{
          text: 'Sign out',
          onClick: handleLogoutConfirm,
          variant: 'primary'
        }}
        secondaryButton={{
          text: 'Cancel',
          onClick: handleLogoutCancel
        }}
      />
    </div>
  );
}
