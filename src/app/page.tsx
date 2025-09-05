'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import UserLanding from '../components/UserLanding';
import UserDashboard from '../components/UserDashboard';
import colors from '../../colors.json';
import '../utils/debugSession'; // Import debug utilities

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  // Debug logging
  useEffect(() => {
    console.log('=== LANDING PAGE STATE ===');
    console.log('User:', user);
    console.log('IsLoading:', isLoading);
    console.log('User AuthType:', user?.authType);
    console.log('User Role:', user?.role);
    console.log('Token in localStorage:', localStorage.getItem('auth_token') ? 'exists' : 'not found');
    console.log('User data in localStorage:', localStorage.getItem('user_data') ? 'exists' : 'not found');
    console.log('==========================');
  }, [user, isLoading]);

  // Handle Firebase admin redirect safely
  useEffect(() => {
    if (!isLoading && user && user.authType === 'firebase') {
      console.log('Redirecting Firebase user to admin dashboard');
      router.replace('/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.colors.primary }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show user dashboard for authenticated API users
  if (user && user.authType === 'api') {
    console.log('Showing UserDashboard for API user');
    return <UserDashboard />;
  }

  // For Firebase admin users, show a redirect message or redirect in a different way
  if (user && user.authType === 'firebase') {
    console.log('Firebase admin detected, showing redirect message');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.colors.primary }}></div>
          <p className="text-gray-600">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  // Show user landing for unauthenticated users
  console.log('Showing UserLanding for unauthenticated user');
  return <UserLanding />;
}
