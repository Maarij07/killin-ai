'use client';

import { useState, useEffect } from 'react';
import { Area, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchVAPIAnalytics } from '../../lib/analytics';
import colors from '../../../colors.json';

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  const { isDark } = useTheme();
  
  if (active && payload && payload.length) {
    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 border rounded-lg shadow-lg`}>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium mb-1`}>
          {label}
        </p>
        {payload.map((item, index) => (
          <p key={index} className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-sm`}>
            <span style={{ color: item.color }}>●</span> {item.name}: {item.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const CustomLegend = () => {
  const { isDark } = useTheme();
  
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.colors.primary }}></div>
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Inbound Calls</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Web Calls</span>
      </div>
    </div>
  );
};

// Helper function to generate inbound/web call time series - NO random variation, consistent data
function generateCallsTypeSeries(inboundTotal: number, webTotal: number, days: number = 7): Array<{ date: string; inbound: number; web: number }> {
  const result: Array<{ date: string; inbound: number; web: number }> = [];
  const today = new Date();
  const avgInbound = Math.round(inboundTotal / days);
  const avgWeb = Math.round(webTotal / days);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Use consistent average - no random variation
    result.push({ date: dateStr, inbound: avgInbound, web: avgWeb });
  }
  
  return result;
}

export default function NumbersVsCostChart() {
  const { isDark } = useTheme();
  const [data, setData] = useState<Array<{ date: string; inbound: number; web: number }>>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analytics = await fetchVAPIAnalytics();
        
        // Generate time series from aggregate data
        const timeSeries = generateCallsTypeSeries(analytics.callsByType.inbound, analytics.callsByType.web, 7);
        setData(timeSeries);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadAnalytics();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadAnalytics();
    }, 20000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 sm:p-6`}>
      <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
        Calls by Type
      </h3>
      
      <div className="w-full h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorNumbers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.colors.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors.colors.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#E5E7EB'} 
            />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="inbound"
              stroke={colors.colors.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNumbers)"
              name="Inbound Calls"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="web" 
              stroke={isDark ? '#9CA3AF' : '#6B7280'} 
              strokeWidth={2}
              dot={{ r: 4, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              name="Web Calls"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <CustomLegend />
    </div>
  );
}
