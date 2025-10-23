'use client';

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { 
  XMarkIcon,
  EyeIcon, 
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import colors from '../../colors.json';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` 
  : 'https://server.kallin.ai/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.oldPassword) {
      showError('Please enter your current password');
      return false;
    }
    if (!formData.newPassword) {
      showError('Please enter a new password');
      return false;
    }
    if (formData.newPassword.length < 6) {
      showError('New password must be at least 6 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showError('New passwords do not match');
      return false;
    }
    if (formData.oldPassword === formData.newPassword) {
      showError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        showError('You must be signed in to change your password');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        showError('Server error: Invalid response format');
        return;
      }

      if (result.success) {
        showSuccess(result.message || 'Password changed successfully! You are still signed in.');
        handleClose();
      } else {
        showError(result.message || 'Failed to change password. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Password change error:', error);
      showError('Network error: Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      old: false,
      new: false,
      confirm: false
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleChangePassword();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'
        }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-xl shadow-lg transform transition-all duration-300 scale-100 flex flex-col"
        style={{ 
          backgroundColor: 'transparent',
          background: isDark 
            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
          border: isDark
            ? `2px solid #4a5568`
            : `2px solid #cbd5e0`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div className="p-6 pb-0 rounded-t-xl"
          style={{ 
            backgroundColor: 'transparent'
          }}>
          <div className={`flex items-center justify-between mb-4`}>
            <div>
              <h2 className={`text-2xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Change Password
              </h2>
              <p className={`mt-1 text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Update your account password for enhanced security
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              style={{ 
                color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] 
              }}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="h-px"
            style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[200] }}
          />
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto scrollbar-hide rounded-b-xl"
          style={{
            backgroundColor: 'transparent'
          }}>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Current Password */}
              <div>
                <label htmlFor="oldPassword" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? "text" : "password"}
                    id="oldPassword"
                    required
                    value={formData.oldPassword}
                    onChange={(e) => handleInputChange('oldPassword', e.target.value)}
                    className={`block w-full px-3 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('old')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPasswords.old ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    required
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={`block w-full px-3 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPasswords.new ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`block w-full px-3 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      isDark 
                        ? 'border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      backdropFilter: isDark ? 'blur(10px)' : 'none'
                    }}
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPasswords.confirm ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className={`px-6 py-3 border rounded-lg font-medium transition-all duration-200 ${
                    isDark 
                      ? 'border-gray-500 text-gray-200 hover:bg-gray-600/20' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    backdropFilter: isDark ? 'blur(5px)' : 'none'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.colors.primary }}
                >
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
