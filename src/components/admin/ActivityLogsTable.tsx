'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LogEntry, getRecentLogs, getLogsByCategory } from '@/lib/logger';
import { useTheme } from '../../contexts/ThemeContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import colors from '../../../colors.json';

interface ActivityLogsTableProps {
  className?: string;
}

const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedLogs: LogEntry[] = [];
      
      if (selectedCategory === 'ALL') {
        fetchedLogs = await getRecentLogs(200);
      } else {
        fetchedLogs = await getLogsByCategory(selectedCategory as LogEntry['category'], 200);
      }
      
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadLogs();
  }, [selectedCategory, loadLogs]);

  // Filter logs based on search term and severity
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  const getSeverityColor = (severity: LogEntry['severity']) => {
    switch (severity) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-blue-600 bg-blue-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: LogEntry['category']) => {
    switch (category) {
      case 'ADMIN_MANAGEMENT': return <ShieldCheckIcon className="h-4 w-4" />;
      case 'USER_MANAGEMENT': return <UserCircleIcon className="h-4 w-4" />;
      case 'AUTHENTICATION': return <ShieldCheckIcon className="h-4 w-4" />;
      case 'SYSTEM': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'SETTINGS': return <InformationCircleIcon className="h-4 w-4" />;
      default: return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border shadow-md ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className={`h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4 w-1/3`}></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border shadow-md ${className}`}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
            <ClockIcon className="h-5 w-5 mr-2" style={{ color: colors.colors.primary }} />
            Activity Logs
          </h2>
          <button
            onClick={loadLogs}
            className="w-full sm:w-auto px-4 py-2 text-white rounded-md transition-colors hover:opacity-90"
            style={{ backgroundColor: colors.colors.primary }}
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'} h-4 w-4`} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
              } focus:outline-none focus:ring-orange-500/20`}
              style={{ '--tw-ring-color': `${colors.colors.primary}33` } as React.CSSProperties}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-2 border rounded-md focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-orange-500/20 focus:border-orange-500`}
            style={{ '--tw-ring-color': `${colors.colors.primary}33` } as React.CSSProperties}
          >
            <option value="ALL">All Categories</option>
            <option value="ADMIN_MANAGEMENT">Admin Management</option>
            <option value="USER_MANAGEMENT">User Management</option>
            <option value="AUTHENTICATION">Authentication</option>
            <option value="SYSTEM">System</option>
            <option value="SETTINGS">Settings</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className={`px-3 py-2 border rounded-md focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-orange-500/20 focus:border-orange-500`}
            style={{ '--tw-ring-color': `${colors.colors.primary}33` } as React.CSSProperties}
          >
            <option value="ALL">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Results Count */}
          <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <FunnelIcon className="h-4 w-4 mr-2" style={{ color: colors.colors.primary }} />
            {filteredLogs.length} results
          </div>
        </div>

        {/* Desktop Table - hidden on small screens */}
        <div className="hidden lg:block overflow-x-auto">
          <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Timestamp
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Admin
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Action
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Severity
                </th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {currentLogs.map((log) => (
                <tr key={log.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {log.adminName}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.adminEmail}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span style={{ color: colors.colors.primary }}>
                        {getCategoryIcon(log.category)}
                      </span>
                      <span className="ml-2">{log.category.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'} max-w-xs truncate`}>
                    <span title={log.details}>
                      {log.details}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Cards - visible below lg */}
        <div className="lg:hidden space-y-3">
          {currentLogs.map((log) => (
            <div key={log.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                    {log.action.replace(/_/g, ' ')}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                  {log.severity}
                </span>
              </div>

              {/* Admin */}
              <div className="mt-3">
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-medium">Admin:</span> {log.adminName}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                  {log.adminEmail}
                </div>
              </div>

              {/* Category and details */}
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className={`flex items-center text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span style={{ color: colors.colors.primary }}>
                    {getCategoryIcon(log.category)}
                  </span>
                  <span className="ml-2">{log.category.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                {log.details}
              </div>
            </div>
          ))}
        </div>

        {/* Empty states */}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon 
              className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
              style={{ color: colors.colors.primary }}
            />
            <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
              No activity logs
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL'
                ? 'No logs match your current filters.'
                : 'No activity logs found.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} results
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <span className={`px-3 py-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsTable;
