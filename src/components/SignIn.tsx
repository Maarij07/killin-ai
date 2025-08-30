'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import colors from '../../colors.json';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { login } = useUser();
  const { showError, showSuccess } = useToast();

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEmailError('');

    // Validate email before submission
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      showError('Password is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (result.success) {
        showSuccess('Welcome back! You have been signed in successfully.');
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top left logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          KALLIN<span style={{ color: colors.colors.primary }}>.AI</span>
        </h1>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left side - Sign in form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 lg:py-6">
          <div className="max-w-md sm:max-w-lg w-full">
            {/* Welcome text */}
            <div className="text-center mb-8 sm:mb-10 pt-8 sm:pt-12 lg:pt-0 lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 sm:mb-4">Welcome back!</h2>
              <p className="text-base sm:text-lg text-gray-600">Access your Admin Panel to manage data</p>
            </div>

            {/* Sign in form */}
            <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-5 sm:space-y-6">
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`appearance-none relative block w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm sm:text-base ${
                      emailError 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                    } placeholder-gray-500 text-gray-900`}
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleEmailChange}
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="appearance-none relative block w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 sm:pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 text-sm sm:text-base"
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
                        color: '#9CA3AF',
                        '&:hover': {
                          color: '#6B7280',
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
                  className="group relative w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Login illustration */}
        <div className="hidden lg:block relative flex-1 min-h-0">
          <div className="absolute inset-0 h-full w-full">
            <img
              src="/login-image.png"
              alt="KALLIN.AI Admin Panel"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
