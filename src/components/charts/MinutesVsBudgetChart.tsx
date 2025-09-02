'use client';

import { useState, useEffect } from 'react';
import { Bar, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchVAPIAnalytics, generateTimeSeriesData } from '../../lib/analytics';
import colors from '../../../colors.json';

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    color: string;
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
            <span style={{ color: item.color }}>●</span> {item.name}: {item.name.includes('Budget') ? `$${item.value}` : `${item.value} min`}
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
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Minutes</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Budget</span>
      </div>
    </div>
  );
};

export default function MinutesVsBudgetChart() {
  const { isDark } = useTheme();
  const [data, setData] = useState([
    { month: 'Apr', minutes: 0, budget: 0 },
    { month: 'May', minutes: 0, budget: 0 },
    { month: 'Jun', minutes: 0, budget: 0 },
    { month: 'Jul', minutes: 0, budget: 0 },
    { month: 'Aug', minutes: 0, budget: 0 },
    { month: 'Sep', minutes: 0, budget: 0 },
    { month: 'Oct', minutes: 0, budget: 0 }
  ]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analytics = await fetchVAPIAnalytics();
        
        // Calculate total minutes from call duration
        const totalCalls = analytics.callsByAssistant.reduce((sum, assistant) => sum + assistant.callCount, 0);
        const estimatedTotalMinutes = totalCalls * 3.5; // Assuming average 3.5 minutes per call
        
        // Create budget data based on total cost
        const totalCost = analytics.costBreakdown.llm + analytics.costBreakdown.stt + 
                         analytics.costBreakdown.tts + analytics.costBreakdown.vapi;
        
        const minutesTimeSeries = generateTimeSeriesData(estimatedTotalMinutes, 7);
        const budgetTimeSeries = generateTimeSeriesData(totalCost * 20, 7); // Budget as cost * 20
        
        const formattedData = minutesTimeSeries.map((item, index) => ({
          month: item.month,
          minutes: item.value,
          budget: budgetTimeSeries[index]?.value || 0
        }));
        
        setData(formattedData);
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
        Minutes Vs Budget
      </h3>
      
      <div className="w-full h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.colors.primary} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors.colors.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#E5E7EB'} 
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              domain={[0, 'dataMax + 100']}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              tickFormatter={(value) => `$${Math.round(value)}`}
              domain={[0, 'dataMax + 50']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="left"
              dataKey="minutes" 
              fill={colors.colors.primary}
              radius={[4, 4, 0, 0]}
              name="Minutes"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="budget" 
              stroke={isDark ? '#9CA3AF' : '#6B7280'} 
              strokeWidth={3}
              dot={{ r: 5, fill: isDark ? '#9CA3AF' : '#6B7280', strokeWidth: 2, stroke: isDark ? '#374151' : '#E5E7EB' }}
              name="Budget"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <CustomLegend />
    </div>
  );
}
