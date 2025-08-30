'use client';

import { useTheme } from '../contexts/ThemeContext';
import colors from '../../colors.json';

const userData = [
  {
    sr: '00001',
    name: 'ABC Restaurant',
    location: 'Food Court, Centaurus Mall',
    assistantId: '370105',
    contact: '0322 9283802',
    plan: 'Yearly'
  },
  {
    sr: '00002',
    name: 'ABC Restaurant',
    location: 'Food Court, Centaurus Mall',
    assistantId: '370105',
    contact: '0322 9283802',
    plan: 'Quarter'
  }
];

interface UserDataTableProps {
  onViewMore: () => void;
}

export default function UserDataTable({ onViewMore }: UserDataTableProps) {
  const { isDark } = useTheme();

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'yearly':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'quarter':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'monthly':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDarkPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'yearly':
        return 'bg-green-900/50 text-green-300 border-green-700';
      case 'quarter':
        return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'monthly':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
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
                Sr.
              </th>
              <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Name
              </th>
              <th scope="col" className={`hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Location
              </th>
              <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="hidden sm:inline">Assistant ID</span>
                <span className="sm:hidden">ID</span>
              </th>
              <th scope="col" className={`hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Contact
              </th>
              <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Plan
              </th>
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
            {userData.map((user, index) => (
              <tr key={user.sr} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  {user.sr}
                </td>
                <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <div>
                    {user.name}
                    <div className={`sm:hidden text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {user.location}
                    </div>
                  </div>
                </td>
                <td className={`hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  {user.location}
                </td>
                <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  {user.assistantId}
                </td>
                <td className={`hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  {user.contact}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${isDark ? getDarkPlanBadgeColor(user.plan) : getPlanBadgeColor(user.plan)}`}>
                    {user.plan}
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
