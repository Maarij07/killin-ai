'use client';

import { useTheme } from '../../contexts/ThemeContext';
import ActivityLogsTable from '../admin/ActivityLogsTable';

export default function Logs() {
  const { isDark } = useTheme();


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activity Logs
          </h1>
          <p className={`mt-1 sm:mt-2 text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="hidden sm:inline">Track and monitor all administrative activities in the system</span>
            <span className="sm:hidden">Monitor administrative activities</span>
          </p>
        </div>
      </div>
      
      {/* Real Activity Logs Table */}
      <ActivityLogsTable className="mt-4 sm:mt-6" />
    </div>
  );
}
