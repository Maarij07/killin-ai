'use client';

import { useTheme } from '@/contexts/ThemeContext';
import ActivityLogsTable from '@/components/admin/ActivityLogsTable';

export default function ActivityLogsPage() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activity Logs
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track and monitor all administrative activities in the system
          </p>
        </div>
      </div>
      
      {/* Logs Table */}
      <ActivityLogsTable className="mt-6" />
    </div>
  );
}
