'use client';

import { useState, useRef, useEffect } from 'react';
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
  service_type: string;
  restaurant_description: string;
  menu_text: string;
  menu_image?: File;
  logo?: File;
}

interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  isProcessing: boolean;
  processedText?: string;
  error?: string;
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
    service_type: '',
    restaurant_description: '',
    menu_text: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { } = useUser();
  const { showError, showSuccess } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
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

  // Process menu image and extract menu items (single image - kept for backward compatibility)
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
        if (data.data && data.data.menu_text) {
          extractedMenuItems = data.data.menu_text;
        } else if (data.menu_text) {
          extractedMenuItems = data.menu_text;
        } else if (data.menu_items) {
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

  // Process multiple menu images and extract menu items
  const processAllImages = async () => {
    if (uploadedImages.length === 0) {
      showError('Please add at least one image');
      return;
    }

    // Update all images to processing state
    setUploadedImages(prev => prev.map(img => ({ ...img, isProcessing: true })));
    setIsProcessingImage(true);
    
    try {
      let allExtractedText = '';
      let hasErrors = false;
      
      // Process each image individually
      for (const image of uploadedImages) {
        try {
          const formData = new FormData();
          formData.append('menu_image', image.file);
          
          const response = await fetch(`${API_BASE_URL}/upload/menu-image`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json'
            },
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Image ${image.file.name} processing successful:`, data);
            
            // Extract menu items from API response
            let extractedMenuItems = '';
            if (data.data && data.data.menu_text) {
              extractedMenuItems = data.data.menu_text;
            } else if (data.menu_text) {
              extractedMenuItems = data.menu_text;
            } else if (data.menu_items) {
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
            
            // Update image with processed text
            setUploadedImages(prev => prev.map(img => 
              img.id === image.id ? { ...img, isProcessing: false, processedText: extractedMenuItems } : img
            ));
            
            if (extractedMenuItems) {
              allExtractedText += extractedMenuItems + '\n\n';
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error(`❌ Image ${image.file.name} processing failed:`, response.status, errorData);
            
            setUploadedImages(prev => prev.map(img => 
              img.id === image.id ? { 
                ...img, 
                isProcessing: false, 
                error: errorData.message || errorData.error || 'Processing failed' 
              } : img
            ));
            hasErrors = true;
          }
        } catch (error) {
          console.error(`❌ Error processing image ${image.file.name}:`, error);
          
          setUploadedImages(prev => prev.map(img => 
            img.id === image.id ? { 
              ...img, 
              isProcessing: false, 
              error: error instanceof Error ? error.message : 'Network error' 
            } : img
          ));
          hasErrors = true;
        }
      }
      
      // Add all extracted text to the menu text
      if (allExtractedText) {
        const currentMenuText = signupData.menu_text.trim();
        const newMenuText = currentMenuText 
          ? `${currentMenuText}\n\n${allExtractedText}`
          : allExtractedText;
        
        updateSignupData('menu_text', newMenuText);
        showSuccess(`${uploadedImages.length} image(s) processed successfully! Menu items added.`);
      } else if (!hasErrors) {
        showError('No menu items could be extracted from any images');
      }
    } catch (error) {
      console.error('❌ Error processing images:', error);
      showError('Error processing images');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showError(`File ${file.name} is not a valid image file`);
        continue;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError(`File ${file.name} size must be less than 10MB`);
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl,
        isProcessing: false
      });
    }

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
      showSuccess(`${newImages.length} image(s) added for upload`);
    }

    // Reset file input
    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
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
    
    if (!signupData.service_type) {
      newErrors.service_type = 'Service type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Logo size must be less than 5MB');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    updateSignupData('logo', file);
    showSuccess('Logo uploaded successfully');
  };

  const removeLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    updateSignupData('logo', '');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Send email verification
  const sendEmailVerification = async () => {
    console.log('📧 Sending email verification to:', signupData.email);
    setIsSubmitting(true);
    setVerificationError('');
    
    try {
      const response = await fetch(`/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          username: signupData.username
        })
      });
      
      let data: { success?: boolean; message?: string } = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = (await response.json()) as { success: boolean; message?: string };
      } else {
        const text = await response.text();
        data = { success: response.ok, message: text };
      }
      
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
      const response = await fetch(`/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupData.email,
          verification_code: verificationCode.trim()
        })
      });
      
      let data: { success?: boolean; message?: string } = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = (await response.json()) as { success: boolean; message?: string };
      } else {
        const text = await response.text();
        data = { success: response.ok, message: text };
      }
      
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
    
    // If email verification hasn't been sent yet, check username and password first
    if (!emailVerificationSent) {
      // Check username availability and password strength
      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_BASE_URL}/auth/signup/step1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: signupData.username,
            email: signupData.email,
            password: signupData.password,
            confirm_password: signupData.confirm_password
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Username is available and password is strong, now send verification email
          await sendEmailVerification();
        } else {
          // Show validation errors
          showError(data.message || 'Please check your account details.');
          
          // Set specific field errors if provided
          if (data.errors) {
            setErrors(data.errors);
          }
        }
      } catch (error) {
        console.error('Network error:', error);
        showError('Network error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
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
    } catch (error) {
      console.error('Network error:', error);
      showError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3 = async () => {
    setIsSubmitting(true);
    try {
      // Complete registration (image processing already done when images were uploaded)
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
    } catch (error) {
      console.error('Network error:', error);
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
      case 1: return 'Create your login credentials and verify your email';
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
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer ${
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
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer ${
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
                    We&apos;ve sent a verification code to<br/>
                    <strong>{signupData.email}</strong>
                    <br/><br/>
                    <span className="text-xs">Note: Please check your spam/junk folder if you don&apos;t see the email.</span>
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
                    Didn&apos;t receive the email?{' '}
                    <button
                      type="button"
                      onClick={resendVerificationEmail}
                      disabled={isSubmitting}
                      className={`font-medium transition-colors cursor-pointer ${
                        isSubmitting 
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:underline'
                      }`}
                      style={{ color: colors.colors.primary }}
                    >
                      {isSubmitting ? 'Resending...' : 'Resend Code'}
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

            {/* Fourth row: Logo Upload and Service Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Upload Logo */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                  Upload Logo
                </label>
                {!logoPreview ? (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors h-[48px] ${
                      isDark
                        ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Click to upload logo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-[48px]">
                    <div className="border rounded-lg px-3 h-full flex items-center gap-3" style={{
                      backgroundColor: isDark ? 'rgba(42, 42, 42, 0.5)' : '#f9fafb',
                      border: isDark ? '1px solid #4a5568' : '1px solid #cbd5e0'
                    }}>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-8 w-8 object-contain rounded"
                      />
                      <span className={`text-xs flex-1 truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Logo uploaded
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Service Type */}
              <div>
                <label htmlFor="service_type" className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                  Service Type
                </label>
                <select
                  id="service_type"
                  required
                  className={`appearance-none relative block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 text-sm ${
                    errors.service_type
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : isDark
                        ? 'border-gray-600 focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white'
                        : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900'
                  }`}
                  value={signupData.service_type}
                  onChange={(e) => updateSignupData('service_type', e.target.value)}
                >
                  <option value="">Select service type</option>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="both">Both (Pickup & Delivery)</option>
                </select>
                {errors.service_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.service_type}</p>
                )}
              </div>
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

            {/* Menu Images section */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Menu Images (Optional)
                {isProcessingImage && (
                  <span className="ml-2 text-xs text-orange-500 animate-pulse">
                    Processing...
                  </span>
                )}
              </label>
              
              {/* Add Images button */}
              <button
                type="button"
                onClick={() => multiFileInputRef.current?.click()}
                disabled={isProcessingImage}
                className={`w-full py-3 px-4 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isProcessingImage 
                    ? 'opacity-50 cursor-not-allowed' 
                    : isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Add Menu Images
              </button>
              
              {/* Hidden file input for multiple images */}
              <input
                ref={multiFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMultiFileSelect}
                multiple
                className="hidden"
              />
              
              {/* Uploaded images preview */}
              {uploadedImages.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedImages.map((image) => (
                    <div 
                      key={image.id}
                      className="flex items-center p-2 rounded-lg"
                      style={{
                        backgroundColor: isDark ? 'rgba(42, 42, 42, 0.5)' : '#f9fafb',
                        border: isDark ? '1px solid #4a5568' : '1px solid #cbd5e0'
                      }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                        <img 
                          src={image.previewUrl} 
                          alt={image.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: isDark ? '#f3f4f6' : '#1f2937' }}>
                          {image.file.name}
                        </p>
                        <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                          {(image.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {image.isProcessing && (
                          <p className="text-xs text-yellow-500">Processing...</p>
                        )}
                        {image.processedText && (
                          <p className="text-xs text-green-500">Processed successfully</p>
                        )}
                        {image.error && (
                          <p className="text-xs text-red-500">Error: {image.error}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        disabled={image.isProcessing}
                      >
                        <svg className="w-4 h-4" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* Process All Images button */}
                  <button
                    type="button"
                    onClick={processAllImages}
                    disabled={isProcessingImage || uploadedImages.some(img => img.isProcessing)}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer ${
                      isProcessingImage ? 'cursor-not-allowed' : 'hover:opacity-90'
                    }`}
                    style={{ backgroundColor: colors.colors.primary }}
                  >
                    {isProcessingImage ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Images...
                      </>
                    ) : (
                      `Process ${uploadedImages.length} Image${uploadedImages.length > 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              )}
              
              {isProcessingImage ? (
                <div className="mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent mr-2"></div>
                  <p className="text-xs text-orange-500">
                    Processing your menu images to extract items...
                  </p>
                </div>
              ) : (
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload images of your menu for automatic AI processing. You can select multiple images.
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, [uploadedImages]);
  
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
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
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
            className={`flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer ${
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
            className={`flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer ${
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
          <div className="max-w-md sm:max-w-lg w-full pt-16 sm:pt-0">
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
                    className={`flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
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
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'} py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  {isSubmitting 
                    ? (currentStep === 1 ? 'Checking Details...' : emailVerificationSent ? 'Verifying...' : 'Sending Email...')
                    : isProcessingImage && currentStep === 3
                      ? 'Processing Image...'
                      : isVerifyingEmail
                        ? 'Verifying Code...'
                        : currentStep === 1 && emailVerificationSent
                          ? 'Verify Email'
                          : currentStep === 1 && !emailVerificationSent
                            ? 'Check Details & Send Verification'
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
