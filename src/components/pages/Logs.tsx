'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import colors from '../../../colors.json';

// Dummy log data with admin activities
const dummyLogs = [
  {
    id: 'LOG001',
    timestamp: '2024-01-15T14:30:25Z',
    admin: 'John Smith',
    adminId: 'ADM001',
    action: 'User Created',
    target: 'ABC Restaurant',
    targetType: 'User',
    description: 'Created new user account for ABC Restaurant',
    level: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
  },
  {
    id: 'LOG002',
    timestamp: '2024-01-15T14:25:10Z',
    admin: 'Sarah Johnson',
    adminId: 'ADM002',
    action: 'User Updated',
    target: 'Pizza Palace',
    targetType: 'User',
    description: 'Updated user status from Inactive to Active',
    level: 'success',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) Safari/605.1.15'
  },
  {
    id: 'LOG003',
    timestamp: '2024-01-15T14:20:45Z',
    admin: 'John Smith',
    adminId: 'ADM001',
    action: 'Admin Login',
    target: 'System',
    targetType: 'Authentication',
    description: 'Administrator logged into the system',
    level: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
  },
  {
    id: 'LOG004',
    timestamp: '2024-01-15T14:15:30Z',
    admin: 'Mike Chen',
    adminId: 'ADM003',
    action: 'User Deleted',
    target: 'Old Restaurant',
    targetType: 'User',
    description: 'Permanently deleted user account and all associated data',
    level: 'warning',
    ipAddress: '192.168.1.110',
    userAgent: 'Mozilla/5.0 (Linux; Android 10) Mobile Safari/604.1'
  },
  {
    id: 'LOG005',
    timestamp: '2024-01-15T14:10:15Z',
    admin: 'Emily Davis',
    adminId: 'ADM004',
    action: 'Settings Updated',
    target: 'System Configuration',
    targetType: 'Settings',
    description: 'Modified system-wide email notification settings',
    level: 'info',
    ipAddress: '192.168.1.115',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0'
  },
  {
    id: 'LOG006',
    timestamp: '2024-01-15T14:05:00Z',
    admin: 'Sarah Johnson',
    adminId: 'ADM002',
    action: 'Admin Created',
    target: 'Robert Wilson',
    targetType: 'Admin',
    description: 'Created new administrator account with Moderator role',
    level: 'success',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) Safari/605.1.15'
  },
  {
    id: 'LOG007',
    timestamp: '2024-01-15T13:58:40Z',
    admin: 'John Smith',
    adminId: 'ADM001',
    action: 'Failed Login',
    target: 'System',
    targetType: 'Authentication',
    description: 'Failed login attempt with incorrect password',
    level: 'error',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
  },
  {
    id: 'LOG008',
    timestamp: '2024-01-15T13:55:20Z',
    admin: 'Emily Davis',
    adminId: 'ADM004',
    action: 'Data Export',
    target: 'User Analytics',
    targetType: 'Data',
    description: 'Exported user analytics data for Q4 2023 report',
    level: 'info',
    ipAddress: '192.168.1.115',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0'
  },
  {
    id: 'LOG009',
    timestamp: '2024-01-15T13:50:10Z',
    admin: 'Mike Chen',
    adminId: 'ADM003',
    action: 'Permission Changed',
    target: 'Sarah Johnson',
    targetType: 'Admin',
    description: 'Updated admin permissions from User Management to Full Access',
    level: 'warning',
    ipAddress: '192.168.1.110',
    userAgent: 'Mozilla/5.0 (Linux; Android 10) Mobile Safari/604.1'
  },
  {
    id: 'LOG010',
    timestamp: '2024-01-15T13:45:55Z',
    admin: 'John Smith',
    adminId: 'ADM001',
    action: 'System Backup',
    target: 'Database',
    targetType: 'System',
    description: 'Initiated automated daily database backup process',
    level: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
  }
];

export default function Logs() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterLevel !== 'all' || filterAction !== 'all' || selectedTimeRange !== 'today';

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterLevel('all');
    setFilterAction('all');
    setSelectedTimeRange('today');
  };

  // Filter logs based on search and filters
  const filteredLogs = dummyLogs.filter(log => {
    const matchesSearch = 
      log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesAction = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());

    return matchesSearch && matchesLevel && matchesAction;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0', icon: CheckCircleIcon };
      case 'error':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', icon: XCircleIcon };
      case 'warning':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: ExclamationTriangleIcon };
      case 'info':
      default:
        return { bg: '#E0F2FE', text: '#0C4A6E', border: '#BAE6FD', icon: InformationCircleIcon };
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Created')) return PlusIcon;
    if (action.includes('Updated')) return PencilIcon;
    if (action.includes('Deleted')) return TrashIcon;
    if (action.includes('Login')) return ShieldCheckIcon;
    if (action.includes('Settings')) return CogIcon;
    return DocumentTextIcon;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin Activity Logs
          </h1>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor all administrator actions and system activities in real-time
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm shadow-sm ${
              isDark
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors`}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {/* Clear Filters Button - only show when filters are active */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
              title="Clear all filters"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear Filters
            </button>
          )}
          
          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className={`px-3 py-2.5 border rounded-lg text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
          >
            <option value="all">All Levels</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className={`px-3 py-2.5 border rounded-lg text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="settings">Settings</option>
          </select>

          {/* Time Range Filter */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className={`px-3 py-2.5 border rounded-lg text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500`}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Time
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Admin
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Action
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Target
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Level
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredLogs.map((log) => {
                const levelConfig = getLevelColor(log.level);
                const ActionIcon = getActionIcon(log.action);
                const LevelIcon = levelConfig.icon;
                const timeInfo = formatTimestamp(log.timestamp);
                
                return (
                  <tr key={log.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    {/* Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {timeInfo.time}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {timeInfo.date}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {getTimeAgo(log.timestamp)}
                        </div>
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ea580c20' }}>
                            <ShieldCheckIcon className="h-4 w-4" style={{ color: '#ea580c' }} />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {log.admin}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {log.adminId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ActionIcon className={`h-4 w-4 mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {log.target}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {log.targetType}
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <LevelIcon className="h-4 w-4 mr-2" style={{ color: levelConfig.text }} />
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-medium rounded-full border capitalize"
                          style={{
                            backgroundColor: levelConfig.bg,
                            color: levelConfig.text,
                            borderColor: levelConfig.border
                          }}
                        >
                          {log.level}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'} max-w-xs`}>
                      <div className="truncate" title={log.description}>
                        {log.description}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                        IP: {log.ipAddress}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              No logs found
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
