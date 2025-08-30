'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import AdminLayout from '../components/AdminLayout';
import SignIn from '../components/SignIn';
import colors from '../../colors.json';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();

  // Get current page from pathname
  const getCurrentPage = () => {
    if (pathname === '/') return 'dashboard';
    if (pathname === '/manage-users') return 'manage-users';
    if (pathname === '/manage-assistants') return 'manage-assistants';
    if (pathname === '/admins') return 'admins';
    if (pathname === '/logs') return 'logs';
    if (pathname === '/settings') return 'settings';
    return 'dashboard';
  };

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/');
    } else if (page === 'manage-users') {
      router.push('/manage-users');
    } else if (page === 'manage-assistants') {
      router.push('/manage-assistants');
    } else {
      router.push(`/${page}`);
    }
  };

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

  if (!user) {
    return <SignIn />;
  }

  return (
    <AdminLayout currentPage={getCurrentPage()} onNavigate={handleNavigate}>
      {children}
    </AdminLayout>
  );
}
