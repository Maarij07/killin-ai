'use client';

import { useTheme } from '../contexts/ThemeContext';
import colors from '../../colors.json';

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  plan: string;
  minutes_allowed: number;
  minutes_used: number;
  description: string;
  location: string;
  created_at: string;
  updated_at: string;
  join_date: string;
}

interface UserDataTableProps {
  users: User[];
  onViewMore: () => void;
}

export default function UserDataTable({ users, onViewMore }: UserDataTableProps) {
  const { isDark } = useTheme();
  
  // Show only first 2 users for dashboard
  const displayUsers = users.slice(0, 2);

  const getPlanBadgeColor = (plan: string) => {
    const normalizedPlan = (plan || '').toLowerCase();
    switch (normalizedPlan) {
      case 'free':
      case '':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'starter':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'popular':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pro':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'yearly':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'quarter':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'monthly':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDarkPlanBadgeColor = (plan: string) => {
    const normalizedPlan = (plan || '').toLowerCase();
    switch (normalizedPlan) {
      case 'free':
      case '':
        return 'bg-gray-900/50 text-gray-400 border-gray-600';
      case 'starter':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'popular':
        return 'bg-green-900/50 text-green-300 border-green-700';
      case 'pro':
        return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'yearly':
        return 'bg-green-900/50 text-green-300 border-green-700';
      case 'quarter':
        return 'bg-teal-900/50 text-teal-300 border-teal-700';
      case 'monthly':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
  };

  // Helper function to get display name for plan
  const getPlanDisplayName = (plan: string) => {
    if (!plan || plan.trim() === '') {
      return 'Free';
    }
    return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden`}>
      {/* Table Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Users
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
            <tr>
              <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ID
              </th>
              <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Name
              </th>
              <th scope="col" className={`hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Email
              </th>
              <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="hidden sm:inline">Status</span>
                <span className="sm:hidden">Status</span>
              </th>
              <th scope="col" className={`hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Minutes
              </th>
              <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Plan
              </th>
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
            {displayUsers.map((user) => (
              <tr key={user.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  #{user.id}
                </td>
                <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <div>
                    {user.name}
                    <div className={`sm:hidden text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className={`hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  {user.email}
                </td>
                <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    user.status.toLowerCase() === 'active' 
                      ? (isDark ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-200')
                      : (isDark ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200')
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className={`hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  {user.minutes_used}/{user.minutes_allowed}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${isDark ? getDarkPlanBadgeColor(user.plan) : getPlanBadgeColor(user.plan)}`}>
                    {getPlanDisplayName(user.plan)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View More Button */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
        <button
          onClick={onViewMore}
          className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          style={{ backgroundColor: colors.colors.primary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 91, 2, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          View More Users
        </button>
      </div>
    </div>
  );
}
