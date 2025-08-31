'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@mui/material';
import colors from '../../colors.json';

export default function UserLanding() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginUser } = useUser();
  const { showError, showSuccess } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!usernameOrEmail.trim()) {
      showError('Username or email is required');
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      showError('Password is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await loginUser(usernameOrEmail, password);
      if (result.success) {
        showSuccess('Welcome back! You have been signed in successfully.');
        // User will be redirected by the layout logic
      } else {
        showError(result.error || 'Sign in failed. Please try again.');
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-white'} flex flex-col transition-colors`}>
      {/* Top left logo */}
      <div className="absolute left-4 sm:left-6 top-[-1vh] sm:top-[-3vh] z-10">
        <img
          src={isDark ? '/logo-dark.png' : '/logo.png'}
          alt="KALLIN.AI"
          className="h-20 sm:h-28 w-auto transition-opacity duration-300"
        />
      </div>

      {/* Theme toggle button - top right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        {/* Mobile theme toggle - icon only */}
        <div className="flex sm:hidden">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'text-yellow-400 hover:bg-gray-800' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop theme toggle boxes */}
        <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-md" style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}>
          {/* Light mode box */}
          <button
            onClick={() => isDark && toggleTheme()}
            className={`flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              !isDark 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <SunIcon className="h-3 w-3 mr-1" />
            Light
          </button>
          
          {/* Dark mode box */}
          <button
            onClick={() => !isDark && toggleTheme()}
            className={`flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-gray-700 text-white shadow-sm border border-gray-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MoonIcon className="h-3 w-3 mr-1" />
            Dark
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left side - Sign in form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 lg:py-6">
          <div className="max-w-md sm:max-w-lg w-full">
            {/* Welcome text - USER VERSION */}
            <div className="text-center mb-8 sm:mb-10 pt-8 sm:pt-12 lg:pt-0 lg:text-left">
              <h2 className={`text-3xl sm:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>Welcome back!</h2>
              <p className={`text-base sm:text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Access your user data and manage your account</p>
            </div>

            {/* Sign in form */}
            <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-5 sm:space-y-6">
                {/* Username or Email field */}
                <div>
                  <label htmlFor="usernameOrEmail" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 sm:mb-3`}>
                    Username or Email
                  </label>
                  <input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    autoComplete="username"
                    required
                    className={`appearance-none relative block w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm sm:text-base ${
                      isDark
                        ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                        : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your username or email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                  />
                </div>

                {/* Password field */}
                <div>
                  <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 sm:mb-3`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className={`appearance-none relative block w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 sm:pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 text-sm sm:text-base ${
                        isDark 
                          ? 'border-gray-600 bg-gray-800 placeholder-gray-400 text-white' 
                          : 'border-gray-300 bg-white placeholder-gray-500 text-gray-900'
                      }`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ 
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: isDark ? '#9CA3AF' : '#9CA3AF',
                        '&:hover': {
                          color: isDark ? '#D1D5DB' : '#6B7280',
                          backgroundColor: 'transparent'
                        }
                      }}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: { xs: '18px', sm: '20px' } }} />
                      ) : (
                        <Visibility sx={{ fontSize: { xs: '18px', sm: '20px' } }} />
                      )}
                    </IconButton>
                  </div>
                </div>
              </div>

              {/* Sign in button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group relative w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${
                    isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
                  }`}
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Admin link */}
            <div className="mt-6 text-center">
              <a
                href="/admin/login"
                className={`text-sm transition-colors hover:underline ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Are you an administrator? Sign in here
              </a>
            </div>
          </div>
        </div>

        {/* Right side - Login illustration */}
        <div className="hidden lg:flex relative flex-1 min-h-0 items-center justify-center">
          <div className="w-full h-4/5 max-h-[80vh]">
            <img
              src="/login-image.png"
              alt="KALLIN.AI User Portal"
              className={`h-full w-full object-contain transition-all duration-300 ${isDark ? 'brightness-90 contrast-110' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
