'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../lib/logger';
import {
  UserCircleIcon,
  CalendarDaysIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import ChangePasswordModal from '../ChangePasswordModal';
import colors from '../../../colors.json';

export default function Settings() {
  const { isDark } = useTheme();
  const { user } = useUser();
  const { showSuccess, showError } = useToast();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  useEffect(() => {
    // Log settings page access
    logger.logSystemAction(
      'SETTINGS_ACCESSED',
      'Admin accessed settings page',
      'LOW'
    );
  }, []);
  
  // Mock account creation date - in real app this would come from user metadata
  const accountCreated = new Date('2023-01-15').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleChangePassword = () => {
    // Log password change initiation
    logger.logSystemAction(
      'PASSWORD_CHANGE_INITIATED',
      'Admin initiated password change process',
      'MEDIUM'
    );
    
    setShowChangePasswordModal(true);
  };

  return (
    <div className="space-y-6">

      {/* Admin Profile Card */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.colors.primary}20` }}>
            <UserCircleIcon className="w-8 h-8" style={{ color: colors.colors.primary }} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Administrator Profile
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your account details and security information
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email Address */}
          <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.colors.primary}10` }}>
                <UserCircleIcon className="h-5 w-5" style={{ color: colors.colors.primary }} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Email Address
                </label>
                <p className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.email || 'admin@kallin.ai'}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Primary account identifier
                </p>
              </div>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-start justify-between py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.colors.primary}10` }}>
                <CalendarDaysIcon className="h-5 w-5" style={{ color: colors.colors.primary }} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Account Created
                </label>
                <p className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {accountCreated}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Member since
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleChangePassword}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ 
              backgroundColor: colors.colors.primary
            }}
          >
            <LockClosedIcon className="h-4 w-4" />
            Change Password
          </button>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
            Update your account password for enhanced security
          </p>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}
