'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import colors from '../../colors.json';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showError, showSuccess } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://server.kallin.ai/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        showSuccess('Password reset link has been sent to your email!');
      } else {
        showError(data.message || 'Failed to send reset link. Please try again.');
      }
    } catch (error) {
      console.error('Error sending reset link:', error);
      showError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-white'} flex flex-col transition-colors`}>
      {/* Top left logo */}
      <div className="absolute left-4 sm:left-6 top-[-1vh] sm:top-[-3vh] z-10">
        <Image
          src={isDark ? '/logo-dark.png' : '/logo.png'}
          alt="KALLIN.AI"
          width={112}
          height={112}
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
        {/* Left side - Forgot password form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 lg:py-6">
          <div className="max-w-md sm:max-w-lg w-full">
            {!isSuccess ? (
              <>
                {/* Title */}
                <div className="text-center mb-8 sm:mb-10 pt-8 sm:pt-12 lg:pt-0 lg:text-left">
                  <h2 className={`text-3xl sm:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
                    Forgot Password?
                  </h2>
                  <p className={`text-base sm:text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Enter your email and we&apos;ll send you a reset link
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2 sm:mb-3`}>
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`appearance-none relative block w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm sm:text-base ${
                        isDark
                          ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Submit button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`group relative w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${
                        isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
                      }`}
                      style={{ backgroundColor: colors.colors.primary }}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>

                {/* Back to sign in link */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => window.location.href = '/'}
                    className={`text-sm transition-colors hover:underline ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                    }`}
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            ) : (
              // Success message
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: `${colors.colors.primary}20` }}>
                    <svg className="w-8 h-8" style={{ color: colors.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Check Your Email
                  </h3>
                  <p className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    We&apos;ve sent a password reset link to<br/>
                    <strong>{email}</strong>
                    <br/><br/>
                    <span className="text-sm">Please check your inbox and follow the instructions to reset your password.</span>
                  </p>
                </div>

                {/* Back to sign in button */}
                <button
                  onClick={() => window.location.href = '/'}
                  className={`w-full py-3 sm:py-4 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity ${
                    isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
                  }`}
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  Back to Sign In
                </button>

                {/* Resend link */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail('');
                    }}
                    className={`text-sm transition-colors hover:underline ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                    }`}
                  >
                    Didn&apos;t receive the email? Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Login illustration (same as signin) */}
        <div className="hidden lg:flex relative flex-1 min-h-0 items-center justify-center">
          <div className="w-full h-4/5 max-h-[80vh]">
            <Image
              src="/login-image.png"
              alt="KALLIN.AI User Portal"
              width={800}
              height={600}
              className={`h-full w-full object-contain transition-all duration-300 ${isDark ? 'brightness-90 contrast-110' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
