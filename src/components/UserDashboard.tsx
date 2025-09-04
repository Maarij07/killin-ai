'use client';

import Image from 'next/image';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { PowerIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import UserPricing from './UserPricing';
import Modal from './Modal';
import { useState, useEffect } from 'react';

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

  // Fetch user details from /api/auth/users
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('https://3758a6b3509d.ngrok-free.app/api/auth/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('All users data:', data);
          
          // Find current user by ID
          const currentUserDetails = data.users?.find((u: UserDetails) => u.id === parseInt(user.id)) || data.find((u: UserDetails) => u.id === parseInt(user.id));
          
          if (currentUserDetails) {
            setUserDetails(currentUserDetails);
            console.log('Current user details:', currentUserDetails);
          } else {
            console.log('User not found in users list');
            // Create a basic UserDetails object from context user data
            setUserDetails({
              id: parseInt(user.id),
              name: user.name,
              email: user.email,
              plan: 'Unknown',
              status: 'active',
              minutes_allowed: 0,
              minutes_used: 0
            });
          }
        } else {
          console.error('Failed to fetch users:', response.status);
          // Create a basic UserDetails object from context user data
          setUserDetails({
            id: parseInt(user.id),
            name: user.name,
            email: user.email,
            plan: 'Unknown',
            status: 'active',
            minutes_allowed: 0,
            minutes_used: 0
          });
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        showError('Failed to load user details');
        // Create a basic UserDetails object from context user data
        setUserDetails({
          id: parseInt(user.id),
          name: user.name,
          email: user.email,
          plan: 'Unknown',
          status: 'active',
          minutes_allowed: 0,
          minutes_used: 0
        });
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

  // Loading state for user details
  if (isLoadingDetails) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      {/* Top Navigation Bar */}
      <nav className={`sticky top-0 z-50 border-b transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
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
                <span className={`text-base font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Welcome, <span className="font-semibold">{user?.name}</span>
                </span>
              </div>

              {/* Theme Toggle - Desktop style */}
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}>
                {/* Light mode box */}
                <button
                  onClick={() => isDark && toggleTheme()}
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    !isDark 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <SunIcon className="h-4 w-4 mr-2" />
                  Light
                </button>
                
                {/* Dark mode box */}
                <button
                  onClick={() => !isDark && toggleTheme()}
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700 text-white shadow-sm border border-gray-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <MoonIcon className="h-4 w-4 mr-2" />
                  Dark
                </button>
              </div>

              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                className={`sm:hidden p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
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
                className={`p-3 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
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
        <UserPricing userPlan={userDetails?.plan} />
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
