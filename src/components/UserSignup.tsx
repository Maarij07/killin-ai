'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import colors from '../../colors.json';

interface SignupData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  restaurant_name: string;
  contact_no: string;
  location: string;
  restaurant_description: string;
  menu_text: string;
  menu_image?: File;
}

export default function UserSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [signupData, setSignupData] = useState<SignupData>({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    restaurant_name: '',
    contact_no: '',
    location: '',
    restaurant_description: '',
    menu_text: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { } = useUser();
  const { showError, showSuccess } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` : 'https://server.kallin.ai/api';

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const updateSignupData = (field: keyof SignupData, value: string | File) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Process menu image and extract menu items
  const processMenuImage = async (file: File) => {
    console.log('📸 Processing menu image:', file.name);
    setIsProcessingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('menu_image', file);
      
      const response = await fetch(`${API_BASE_URL}/upload/menu-image`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Image processing successful:', data);
        
        // Extract menu items from API response
        let extractedMenuItems = '';
        if (data.menu_items) {
          if (typeof data.menu_items === 'string') {
            extractedMenuItems = data.menu_items;
          } else if (Array.isArray(data.menu_items)) {
            extractedMenuItems = data.menu_items.join('\n');
          } else if (data.menu_items.items) {
            extractedMenuItems = Array.isArray(data.menu_items.items) 
              ? data.menu_items.items.join('\n')
              : data.menu_items.items.toString();
          }
        } else if (data.items) {
          extractedMenuItems = Array.isArray(data.items) 
            ? data.items.join('\n')
            : data.items.toString();
        } else if (data.extracted_text) {
          extractedMenuItems = data.extracted_text;
        }
        
        if (extractedMenuItems) {
          // Add extracted menu items to existing menu text
          const currentMenuText = signupData.menu_text.trim();
          const newMenuText = currentMenuText 
            ? `${currentMenuText}\n\n--- Extracted from image ---\n${extractedMenuItems}`
            : extractedMenuItems;
          
          updateSignupData('menu_text', newMenuText);
          showSuccess('Menu items extracted from image and added to your menu!');
        } else {
          showError('No menu items could be extracted from the image. Please add them manually.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Image processing failed:', response.status, errorData);
        showError(`Failed to process image: ${errorData.message || errorData.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('❌ Error processing menu image:', error);
      showError(`Failed to process image: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!signupData.username) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(signupData.username)) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
    }
    
    if (!signupData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(signupData.password)) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (!signupData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!signupData.restaurant_name) {
      newErrors.restaurant_name = 'Restaurant name is required';
    }
    
    if (!signupData.contact_no) {
      newErrors.contact_no = 'Contact number is required';
    } else if (!validatePhone(signupData.contact_no)) {
      newErrors.contact_no = 'Please enter a valid phone number with country code';
    }
    
    if (!signupData.location) {
      newErrors.location = 'Location is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send email verification
  const sendEmailVerification = async () => {
    console.log('📧 Sending email verification to:', signupData.email);
    setIsSubmitting(true);
    setVerificationError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          username: signupData.username
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setEmailVerificationSent(true);
        showSuccess(`Verification email sent to ${signupData.email}. Please check your inbox.`);
        console.log('✅ Verification email sent successfully');
      } else {
        console.error('❌ Failed to send verification email:', data.message);
        setVerificationError(data.message || 'Failed to send verification email. Please try again.');
        showError(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setVerificationError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify email code
  const verifyEmailCode = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Please enter the verification code.');
      return;
    }
    
    console.log('🔍 Verifying email code:', verificationCode);
    setIsVerifyingEmail(true);
    setVerificationError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          verification_code: verificationCode.trim()
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Email verified successfully');
        showSuccess('Email verified successfully! Proceeding to next step.');
        // Proceed to step 2 after successful verification
        setTimeout(() => {
          setCurrentStep(2);
        }, 1000);
      } else {
        console.error('❌ Email verification failed:', data.message);
        setVerificationError(data.message || 'Invalid verification code. Please try again.');
        showError(data.message || 'Invalid verification code.');
      }
    } catch (error) {
      console.error('❌ Error verifying email:', error);
      const errorMessage = 'Network error. Please try again.';
      setVerificationError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    await sendEmailVerification();
  };

  const handleStep1 = async () => {
    if (!validateStep1()) return;
    
    // If email verification hasn't been sent yet, send it
    if (!emailVerificationSent) {
      await sendEmailVerification();
      return;
    }
    
    // If verification was sent but not verified, verify the code
    await verifyEmailCode();
  };

  const handleStep2 = async () => {
    if (!validateStep2()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup/step2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: signupData.restaurant_name,
          contact_no: signupData.contact_no,
          location: signupData.location
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCurrentStep(3);
        showSuccess('Step 2 completed! Restaurant information validated.');
      } else {
        showError(data.message || 'Please check your restaurant information.');
      }
    } catch (_error) {
      showError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3 = async () => {
    setIsSubmitting(true);
    try {
      // Complete registration (image processing already done when image was uploaded)
      const response = await fetch(`${API_BASE_URL}/auth/signup/step3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          confirm_password: signupData.confirm_password,
          restaurant_name: signupData.restaurant_name,
          contact_no: signupData.contact_no,
          location: signupData.location,
          restaurant_description: signupData.restaurant_description,
          menu_text: signupData.menu_text
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showSuccess('Welcome to KALLIN.AI! Your restaurant account has been created successfully. Please sign in to continue.');
        // Redirect to sign-in page after successful signup
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showError(data.message || 'Registration failed. Please try again.');
      }
    } catch (_error) {
      showError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Account Details';
      case 2: return 'Restaurant Information';
      case 3: return 'Menu & Description';
      default: return 'Sign Up';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Create your login credentials';
      case 2: return 'Tell us about your restaurant';
      case 3: return 'Add your menu and description';
      default: return 'Join KALLIN.AI!';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            {!emailVerificationSent ? (
              // Show normal signup form before email verification
              <>
                {/* Username field */}
                <div>
                  <label htmlFor="username" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                      errors.username
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : isDark
                          ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Choose a username"
                    value={signupData.username}
                    onChange={(e) => updateSignupData('username', e.target.value)}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                {/* Email field */}
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                      errors.email
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : isDark
                          ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your email address"
                    value={signupData.email}
                    onChange={(e) => updateSignupData('email', e.target.value)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className={`appearance-none relative block w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                        errors.password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : isDark 
                            ? 'border-gray-600 bg-gray-800 placeholder-gray-400 text-white focus:ring-orange-500 focus:border-orange-500' 
                            : 'border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                      }`}
                      placeholder="Create a strong password"
                      value={signupData.password}
                      onChange={(e) => updateSignupData('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                      }`}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: '18px' }} />
                      ) : (
                        <Visibility sx={{ fontSize: '18px' }} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password field */}
                <div>
                  <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className={`appearance-none relative block w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                        errors.confirm_password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : isDark 
                            ? 'border-gray-600 bg-gray-800 placeholder-gray-400 text-white focus:ring-orange-500 focus:border-orange-500' 
                            : 'border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
                      }`}
                      placeholder="Confirm your password"
                      value={signupData.confirm_password}
                      onChange={(e) => updateSignupData('confirm_password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                      }`}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff sx={{ fontSize: '18px' }} />
                      ) : (
                        <Visibility sx={{ fontSize: '18px' }} />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                  )}
                </div>
              </>
            ) : (
              // Show email verification form after email is sent
              <>
                <div className={`text-center p-6 rounded-lg border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: `${colors.colors.primary}20` }}>
                    <svg className="w-8 h-8" style={{ color: colors.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Check Your Email
                  </h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    We've sent a verification code to<br/>
                    <strong>{signupData.email}</strong>
                  </p>
                </div>

                {/* Verification Code Input */}
                <div>
                  <label htmlFor="verificationCode" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    type="text"
                    required
                    maxLength={6}
                    className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm text-center tracking-widest ${
                      verificationError
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : isDark
                          ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setVerificationError('');
                    }}
                  />
                  {verificationError && (
                    <p className="mt-1 text-sm text-red-600">{verificationError}</p>
                  )}
                </div>

                {/* Resend Email Link */}
                <div className="text-center">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Didn't receive the email?{' '}
                    <button
                      type="button"
                      onClick={resendVerificationEmail}
                      disabled={isSubmitting}
                      className={`font-medium transition-colors ${
                        isSubmitting 
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:underline'
                      }`}
                      style={{ color: colors.colors.primary }}
                    >
                      Resend Code
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            {/* Restaurant Name field */}
            <div>
              <label htmlFor="restaurant_name" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Restaurant Name
              </label>
              <input
                id="restaurant_name"
                type="text"
                required
                className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                  errors.restaurant_name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : isDark
                      ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                      : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter your restaurant name"
                value={signupData.restaurant_name}
                onChange={(e) => updateSignupData('restaurant_name', e.target.value)}
              />
              {errors.restaurant_name && (
                <p className="mt-1 text-sm text-red-600">{errors.restaurant_name}</p>
              )}
            </div>

            {/* Contact Number field */}
            <div>
              <label htmlFor="contact_no" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Contact Number
              </label>
              <input
                id="contact_no"
                type="tel"
                required
                className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                  errors.contact_no
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : isDark
                      ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                      : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="+1234567890"
                value={signupData.contact_no}
                onChange={(e) => updateSignupData('contact_no', e.target.value)}
              />
              {errors.contact_no && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_no}</p>
              )}
            </div>

            {/* Location field */}
            <div>
              <label htmlFor="location" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Location
              </label>
              <input
                id="location"
                type="text"
                required
                className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                  errors.location
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : isDark
                      ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                      : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="City, State or Full Address"
                value={signupData.location}
                onChange={(e) => updateSignupData('location', e.target.value)}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            {/* Restaurant Description field */}
            <div>
              <label htmlFor="restaurant_description" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Restaurant Description
              </label>
              <textarea
                id="restaurant_description"
                rows={3}
                className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm resize-none ${
                  isDark
                    ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                    : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Describe your restaurant (e.g., Family-owned Italian restaurant serving authentic dishes since 1995)"
                value={signupData.restaurant_description}
                onChange={(e) => updateSignupData('restaurant_description', e.target.value)}
              />
            </div>

            {/* Menu Text field */}
            <div>
              <label htmlFor="menu_text" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Menu Items
              </label>
              <textarea
                id="menu_text"
                rows={4}
                className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm resize-none ${
                  isDark
                    ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white placeholder-gray-400'
                    : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-500'
                }`}
                placeholder="List your menu items (e.g., Margherita Pizza - $12, Caesar Salad - $8, Pasta Carbonara - $14)"
                value={signupData.menu_text}
                onChange={(e) => updateSignupData('menu_text', e.target.value)}
              />
            </div>

            {/* Menu Image field */}
            <div>
              <label htmlFor="menu_image" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Menu Image (Optional)
                {isProcessingImage && (
                  <span className="ml-2 text-xs text-orange-500 animate-pulse">
                    Processing...
                  </span>
                )}
              </label>
              <input
                id="menu_image"
                type="file"
                accept="image/*"
                disabled={isProcessingImage}
                className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                  isProcessingImage ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDark
                    ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white'
                    : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900'
                }`}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateSignupData('menu_image', file);
                    // Process the image immediately to extract menu items
                    await processMenuImage(file);
                  }
                }}
              />
              {isProcessingImage ? (
                <div className="mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent mr-2"></div>
                  <p className="text-xs text-orange-500">
                    Processing your menu image to extract items...
                  </p>
                </div>
              ) : (
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload an image of your menu for automatic AI processing
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
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
        {/* Left side - Illustration (INVERTED) */}
        <div className="hidden lg:flex relative flex-1 min-h-0 items-center justify-center">
          <div className="w-full h-4/5 max-h-[80vh]">
            <Image
              src="/login-image.png"
              alt="KALLIN.AI Restaurant Portal"
              width={800}
              height={600}
              className={`h-full w-full object-contain transition-all duration-300 ${isDark ? 'brightness-90 contrast-110' : ''}`}
            />
          </div>
        </div>

        {/* Right side - Signup wizard (INVERTED) */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-8 lg:py-6">
          <div className="max-w-md sm:max-w-lg w-full">
            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4 mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      step < currentStep
                        ? `bg-orange-500 border-orange-500 text-white`
                        : step === currentStep
                          ? `border-orange-500 ${isDark ? 'bg-gray-800 text-orange-500' : 'bg-white text-orange-500'}`
                          : `border-gray-300 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-400'}`
                    }`}>
                      {step < currentStep ? (
                        <CheckCircle sx={{ fontSize: '20px' }} />
                      ) : (
                        <span className="text-sm font-semibold">{step}</span>
                      )}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-0.5 ml-2 ${
                        step < currentStep ? 'bg-orange-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="text-center mb-8">
              <h2 className={`text-2xl sm:text-3xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {getStepTitle()}
              </h2>
              <p className={`text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {getStepDescription()}
              </p>
            </div>

            {/* Form content */}
            <div className="space-y-6">
              {renderStepContent()}

              {/* Navigation buttons */}
              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className={`flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:bg-gray-700 border-gray-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                )}
                <button
                  type="button"
                  onClick={currentStep === 1 ? handleStep1 : currentStep === 2 ? handleStep2 : handleStep3}
                  disabled={isSubmitting || isVerifyingEmail || (currentStep === 3 && isProcessingImage)}
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'} py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  {isSubmitting 
                    ? (currentStep === 3 ? 'Creating Account...' : emailVerificationSent ? 'Verifying...' : 'Sending Email...')
                    : isProcessingImage && currentStep === 3
                      ? 'Processing Image...'
                      : isVerifyingEmail
                        ? 'Verifying Code...'
                        : currentStep === 1 && emailVerificationSent
                          ? 'Verify Email'
                          : currentStep === 1 && !emailVerificationSent
                            ? 'Send Verification'
                            : (currentStep === 3 ? 'Create Account' : 'Next Step')
                  }
                </button>
              </div>
            </div>

            {/* Navigation links */}
            <div className="mt-8 space-y-3 text-center">
              <Link
                href="/"
                className={`block text-sm transition-colors hover:underline ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Already have an account? Sign in here
              </Link>
              <Link
                href="/admin/login"
                className={`block text-sm transition-colors hover:underline ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Are you an administrator? Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
