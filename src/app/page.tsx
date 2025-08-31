'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import UserLanding from '../components/UserLanding';
import UserDashboard from '../components/UserDashboard';
import colors from '../../colors.json';

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  // Debug logging
  useEffect(() => {
    console.log('LandingPage - User:', user);
    console.log('LandingPage - IsLoading:', isLoading);
  }, [user, isLoading]);

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (!isLoading && user && user.authType === 'firebase') {
      console.log('Redirecting Firebase user to admin dashboard');
      router.push('/admin');
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

  // Show user landing for unauthenticated users
  console.log('Showing UserLanding for unauthenticated user');
  return <UserLanding />;
}
