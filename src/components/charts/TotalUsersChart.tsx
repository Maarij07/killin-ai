'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchVAPIAnalytics, generateTimeSeriesData } from '../../lib/analytics';
import colors from '../../../colors.json';

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    value: number;
  }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  const { isDark } = useTheme();
  
  if (active && payload && payload.length) {
    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 border rounded-lg shadow-lg`}>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>
          {`${label} 2025`}
        </p>
        <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
          <span className="text-orange-500">●</span> Calls: {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }

  return null;
};

export default function TotalUsersChart() {
  const { isDark } = useTheme();
  const [data, setData] = useState([
    { month: 'Jan', users: 0 },
    { month: 'Feb', users: 0 },
    { month: 'Mar', users: 0 },
    { month: 'Apr', users: 0 },
    { month: 'May', users: 0 },
    { month: 'Jun', users: 0 },
    { month: 'Jul', users: 0 },
    { month: 'Aug', users: 0 },
    { month: 'Sep', users: 0 },
    { month: 'Oct', users: 0 },
    { month: 'Nov', users: 0 },
    { month: 'Dec', users: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadAnalytics = async (isInitialLoad = false) => {
      if (!isInitialLoad) {
        setIsRefreshing(true);
      }
      
      try {
        const analytics = await fetchVAPIAnalytics();
        const totalCalls = analytics.callsByAssistant.reduce((sum, assistant) => sum + assistant.callCount, 0);
        const timeSeriesData = generateTimeSeriesData(totalCalls, 12);
        
        const formattedData = timeSeriesData.map(item => ({
          month: item.month,
          users: item.value
        }));
        
        setData(formattedData);
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

    // Set up auto-refresh every 30 seconds
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Calls by Assistant
          </h3>
          {lastUpdated && (
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Last updated: {lastUpdated.toLocaleTimeString()}
              {isRefreshing && (
                <span className="ml-2 inline-flex items-center">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-1">Updating...</span>
                </span>
              )}
            </p>
          )}
        </div>
        <select className={`text-sm border rounded px-2 py-1 w-fit ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
          <option>2025</option>
          <option>2024</option>
          <option>2023</option>
        </select>
      </div>
      
      <div className="w-full h-48 sm:h-56 lg:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.colors.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors.colors.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="users"
              stroke={colors.colors.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUsers)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
