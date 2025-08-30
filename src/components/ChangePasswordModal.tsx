'use client';

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import { IconButton } from '@mui/material';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Modal from './Modal';
import colors from '../../colors.json';

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
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        showError('You must be signed in to change your password');
        return;
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        formData.oldPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, formData.newPassword);
      
      showSuccess('Password changed successfully! You are still signed in.');
      handleClose();
    } catch (error: unknown) {
      console.error('Password change error:', error);
      
      // Handle different Firebase error types
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/wrong-password':
          showError('Current password is incorrect. Please try again.');
          break;
        case 'auth/weak-password':
          showError('New password is too weak. Please choose a stronger password.');
          break;
        case 'auth/requires-recent-login':
          showError('For security reasons, please sign out and sign in again before changing your password.');
          break;
        case 'auth/too-many-requests':
          showError('Too many failed attempts. Please wait a moment and try again.');
          break;
        case 'auth/network-request-failed':
          showError('Network error. Please check your internet connection and try again.');
          break;
        case 'auth/invalid-credential':
          showError('Current password is incorrect. Please check and try again.');
          break;
        default:
          showError('Failed to change password. Please try again.');
      }
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

  const modalContent = (
    <div className="space-y-6">
      {/* Current Password */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Current Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.old ? "text" : "password"}
            value={formData.oldPassword}
            onChange={(e) => handleInputChange('oldPassword', e.target.value)}
            className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
            placeholder="Enter your current password"
          />
          <IconButton
            onClick={() => togglePasswordVisibility('old')}
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#9CA3AF' : '#6B7280',
              '&:hover': {
                backgroundColor: 'transparent',
                color: colors.colors.primary
              }
            }}
          >
            {showPasswords.old ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </IconButton>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
            placeholder="Enter your new password"
          />
          <IconButton
            onClick={() => togglePasswordVisibility('new')}
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#9CA3AF' : '#6B7280',
              '&:hover': {
                backgroundColor: 'transparent',
                color: colors.colors.primary
              }
            }}
          >
            {showPasswords.new ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </IconButton>
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Password must be at least 6 characters long
        </p>
      </div>

      {/* Confirm New Password */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
            placeholder="Confirm your new password"
          />
          <IconButton
            onClick={() => togglePasswordVisibility('confirm')}
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? '#9CA3AF' : '#6B7280',
              '&:hover': {
                backgroundColor: 'transparent',
                color: colors.colors.primary
              }
            }}
          >
            {showPasswords.confirm ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={<LockClosedIcon className="h-6 w-6" />}
      title="Change Password"
      description="Update your account password for enhanced security. Please enter your current password and choose a new one."
      primaryButton={{
        text: isSubmitting ? 'Changing Password...' : 'Change Password',
        onClick: handleChangePassword,
        variant: 'primary'
      }}
      secondaryButton={{
        text: 'Cancel',
        onClick: handleClose
      }}
      customContent={modalContent}
    />
  );
}
