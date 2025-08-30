'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import {
  HomeIcon,
  UsersIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  PowerIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import colors from '../../colors.json';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const navigation = [
  { name: 'Dashboard', href: 'dashboard', icon: HomeIcon, current: true },
  { name: 'Manage Users', href: 'manage-users', icon: UsersIcon, current: false },
  { name: 'Manage Assistants', href: 'manage-assistants', icon: CpuChipIcon, current: false },
  { name: 'Admins', href: 'admins', icon: ShieldCheckIcon, current: false },
  { name: 'Logs', href: 'logs', icon: ClipboardDocumentListIcon, current: false },
];

const bottomNavigation = [
  { name: 'Settings', href: 'settings', icon: Cog6ToothIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminLayout({ children, currentPage = 'dashboard', onNavigate }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const { showSuccess } = useToast();

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

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-0 flex justify-end">
          <div className="relative ml-16 flex w-full max-w-xs flex-1">
            <div className="absolute right-full top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className={`flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-2 ${isDark ? 'bg-gray-800' : 'bg-white'} ring-1 ring-white/10`}>
              <div className="flex h-16 shrink-0 items-center">
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  KALLIN<span style={{ color: colors.colors.primary }}>.AI</span>
                </h1>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <div className={`relative ${currentPage === item.href ? 'pl-1' : ''}`}>
                            {currentPage === item.href && (
                              <div 
                                className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full"
                                style={{ backgroundColor: colors.colors.primary }}
                              />
                            )}
                            <button
                              onClick={() => {
                                onNavigate?.(item.href);
                                setSidebarOpen(false);
                              }}
                              className={classNames(
                                currentPage === item.href
                                  ? 'text-white font-medium relative ml-2'
                                  : `${isDark ? 'text-gray-300' : 'text-gray-700'} hover:bg-gray-100/50 transition-all duration-200`,
                                'group flex gap-x-3 rounded-md p-3 text-sm leading-6 w-full text-left'
                              )}
                              style={currentPage === item.href ? {
                                backgroundColor: colors.colors.primary,
                                color: 'white'
                              } : {}}
                              onMouseEnter={(e) => {
                                if (currentPage !== item.href) {
                                  e.currentTarget.style.color = colors.colors.primary;
                                  const icon = e.currentTarget.querySelector('svg');
                                  if (icon) icon.style.color = colors.colors.primary;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (currentPage !== item.href) {
                                  e.currentTarget.style.color = '';
                                  const icon = e.currentTarget.querySelector('svg');
                                  if (icon) icon.style.color = '';
                                }
                              }}
                            >
                              <item.icon 
                                className="h-5 w-5 shrink-0" 
                                style={currentPage === item.href ? { color: 'white' } : {}}
                              />
                              {item.name}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <ul role="list" className="-mx-2 space-y-1">
                      {bottomNavigation.map((item) => (
                        <li key={item.name}>
                          <div className={`relative ${currentPage === item.href ? 'pl-1' : ''}`}>
                            {currentPage === item.href && (
                              <div 
                                className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full"
                                style={{ backgroundColor: colors.colors.primary }}
                              />
                            )}
                            <button
                              onClick={() => {
                                onNavigate?.(item.href);
                                setSidebarOpen(false);
                              }}
                              className={classNames(
                                currentPage === item.href
                                  ? 'text-white font-medium relative ml-2'
                                  : `${isDark ? 'text-gray-300' : 'text-gray-700'} hover:bg-gray-100/50 transition-all duration-200`,
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium w-full text-left'
                              )}
                              style={currentPage === item.href ? {
                                backgroundColor: colors.colors.primary,
                                color: 'white'
                              } : {}}
                              onMouseEnter={(e) => {
                                if (currentPage !== item.href) {
                                  e.currentTarget.style.color = colors.colors.primary;
                                  const icon = e.currentTarget.querySelector('svg');
                                  if (icon) icon.style.color = colors.colors.primary;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (currentPage !== item.href) {
                                  e.currentTarget.style.color = '';
                                  const icon = e.currentTarget.querySelector('svg');
                                  if (icon) icon.style.color = '';
                                }
                              }}
                            >
                              <item.icon 
                                className="h-6 w-6 shrink-0" 
                                style={currentPage === item.href ? { color: 'white' } : {}}
                              />
                              {item.name}
                            </button>
                          </div>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={handleLogoutClick}
                          className={`${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium w-full text-left`}
                        >
                          <PowerIcon className="h-6 w-6 shrink-0" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className={`flex grow flex-col gap-y-5 overflow-y-auto border-r ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-6`}>
          <div className="flex h-16 shrink-0 items-center">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              KALLIN<span style={{ color: colors.colors.primary }}>.AI</span>
            </h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <div className={`relative ${currentPage === item.href ? 'pl-1' : ''}`}>
                        {currentPage === item.href && (
                          <div 
                            className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full"
                            style={{ backgroundColor: colors.colors.primary }}
                          />
                        )}
                        <button
                          onClick={() => onNavigate?.(item.href)}
                          className={classNames(
                            currentPage === item.href
                              ? 'text-white font-medium relative ml-2'
                              : `${isDark ? 'text-gray-300' : 'text-gray-700'} hover:bg-gray-100/30 transition-all duration-200`,
                            'group flex gap-x-3 rounded-md p-3 text-sm leading-6 w-full text-left'
                          )}
                          style={currentPage === item.href ? {
                            backgroundColor: colors.colors.primary,
                            color: 'white'
                          } : {}}
                          onMouseEnter={(e) => {
                            if (currentPage !== item.href) {
                              e.currentTarget.style.color = colors.colors.primary;
                              const icon = e.currentTarget.querySelector('svg');
                              if (icon) icon.style.color = colors.colors.primary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentPage !== item.href) {
                              e.currentTarget.style.color = '';
                              const icon = e.currentTarget.querySelector('svg');
                              if (icon) icon.style.color = '';
                            }
                          }}
                        >
                          <item.icon 
                            className="h-5 w-5 shrink-0" 
                            style={currentPage === item.href ? { color: 'white' } : {}}
                          />
                          {item.name}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {bottomNavigation.map((item) => (
                    <li key={item.name}>
                      <div className={`relative ${currentPage === item.href ? 'pl-1' : ''}`}>
                        {currentPage === item.href && (
                          <div 
                            className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full"
                            style={{ backgroundColor: colors.colors.primary }}
                          />
                        )}
                        <button
                          onClick={() => onNavigate?.(item.href)}
                          className={classNames(
                            currentPage === item.href
                              ? 'text-white font-medium relative ml-2'
                              : `${isDark ? 'text-gray-300' : 'text-gray-700'} hover:bg-gray-100/30 transition-all duration-200`,
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium w-full text-left'
                          )}
                          style={currentPage === item.href ? {
                            backgroundColor: colors.colors.primary,
                            color: 'white'
                          } : {}}
                          onMouseEnter={(e) => {
                            if (currentPage !== item.href) {
                              e.currentTarget.style.color = colors.colors.primary;
                              const icon = e.currentTarget.querySelector('svg');
                              if (icon) icon.style.color = colors.colors.primary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentPage !== item.href) {
                              e.currentTarget.style.color = '';
                              const icon = e.currentTarget.querySelector('svg');
                              if (icon) icon.style.color = '';
                            }
                          }}
                        >
                          <item.icon 
                            className="h-6 w-6 shrink-0" 
                            style={currentPage === item.href ? { color: 'white' } : {}}
                          />
                          {item.name}
                        </button>
                      </div>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={handleLogoutClick}
                      className={`${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium w-full text-left`}
                    >
                      <PowerIcon className="h-6 w-6 shrink-0" />
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8`}>
          {/* Logo for mobile */}
          <div className="flex lg:hidden">
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              KALLIN<span style={{ color: colors.colors.primary }}>.AI</span>
            </h1>
          </div>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Page title - hidden on mobile */}
              <h1 className={`hidden lg:block text-xl font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {currentPage === 'dashboard' ? 'Dashboard' : currentPage}
              </h1>
            </div>
            
            <div className="ml-auto flex items-center gap-x-2 lg:gap-x-6">
              {/* Mobile theme toggle - icon only */}
              <div className="flex lg:hidden items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDark 
                      ? 'text-yellow-400 hover:bg-gray-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>
              </div>

              {/* Desktop theme toggle boxes */}
              <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}>
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

              {/* Mobile hamburger menu */}
              <button
                type="button"
                className={`lg:hidden -m-2.5 p-2.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className={`py-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-[calc(100vh-4rem)]`}>
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

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
