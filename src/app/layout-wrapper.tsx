'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import AdminLayout from '../components/AdminLayout';
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
    if (pathname === '/admin' || pathname === '/admin/') return 'dashboard';
    if (pathname === '/admin/user-management') return 'user-management';
    if (pathname === '/admin/assistant-management') return 'assistant-management';
    if (pathname === '/admin/admins') return 'admins';
    if (pathname === '/admin/logs') return 'logs';
    if (pathname === '/admin/settings') return 'settings';
    return 'dashboard';
  };

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/admin');
    } else {
      router.push(`/admin/${page}`);
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

  // Special cases - login pages and root page don't need authentication check here
  if (pathname === '/' || pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Admin routes that need authentication and sidebar
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to admin login if trying to access admin pages without auth
      router.push('/admin/login');
      return null;
    }
    
    return (
      <AdminLayout currentPage={getCurrentPage()} onNavigate={handleNavigate}>
        {children}
      </AdminLayout>
    );
  }

  // Default fallback
  return <>{children}</>;
}
