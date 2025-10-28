'use client';

import { useState, useEffect } from 'react';
import { Cell, PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchVAPIAnalytics } from '../../lib/analytics';
import colors from '../../../colors.json';

const COLORS = [colors.colors.primary, '#9CA3AF'];

interface CallData {
  name: string;
  value: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  const { isDark } = useTheme();
  
  if (active && payload && payload.length) {
    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-2 border rounded-lg shadow-lg`}>
        <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-sm`}>
          {payload[0].name}: {payload[0].value} calls
        </p>
      </div>
    );
  }

  return null;
};

export default function TotalUsersChart() {
  const { isDark } = useTheme();
  const [data, setData] = useState<CallData[]>([]);
  const [, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, inbound: 0, web: 0 });

  useEffect(() => {
    const loadAnalytics = async (isInitialLoad = false) => {
      if (!isInitialLoad) {
        setIsRefreshing(true);
      }
      
      try {
        const analytics = await fetchVAPIAnalytics();
        
        // Get real data from API
        const callData: CallData[] = [
          { name: 'Inbound Calls', value: analytics.callsByType.inbound },
          { name: 'Web Calls', value: analytics.callsByType.web }
        ];
        
        const totalCalls = analytics.callsByType.inbound + analytics.callsByType.web;
        
        setData(callData);
        setStats({
          total: totalCalls,
          inbound: analytics.callsByType.inbound,
          web: analytics.callsByType.web
        });
        setLastUpdated(analytics.lastUpdated);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    // Initial load
    loadAnalytics(true);

    // Set up auto-refresh every 20 seconds
    const refreshInterval = setInterval(() => {
      loadAnalytics(false);
    }, 20000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 sm:p-6`}>
      <div className="mb-4">
        <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Call Distribution
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Total Calls: <span className="font-semibold text-lg" style={{ color: colors.colors.primary }}>{stats.total}</span>
        </p>
        {lastUpdated && (
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isRefreshing && <span className="ml-2">Updating...</span>}
          </p>
        )}
      </div>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent ? (percent * 100).toFixed(0) : 0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Inbound Calls</p>
            <p className="text-2xl font-bold" style={{ color: colors.colors.primary }}>{stats.inbound}</p>
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Web Calls</p>
            <p className="text-2xl font-bold" style={{ color: '#9CA3AF' }}>{stats.web}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
