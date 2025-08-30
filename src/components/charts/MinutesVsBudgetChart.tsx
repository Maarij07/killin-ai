'use client';

import { Bar, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import colors from '../../../colors.json';

const data = [
  { month: 'Apr', minutes: 350, budget: 120 },
  { month: 'May', minutes: 400, budget: 150 },
  { month: 'Jun', minutes: 650, budget: 180 },
  { month: 'Jul', minutes: 600, budget: 220 },
  { month: 'Aug', minutes: 0, budget: 200 },
  { month: 'Sep', minutes: 0, budget: 180 },
  { month: 'Oct', minutes: 0, budget: 160 }
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
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

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 sm:p-6`}>
      <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
        Minutes Vs Budget
      </h3>
      
      <div className="w-full h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#E5E7EB'} 
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
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="left"
              dataKey="minutes" 
              fill={colors.colors.primary}
              fillOpacity={0.7}
              radius={[2, 2, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="budget" 
              stroke={isDark ? '#9CA3AF' : '#6B7280'} 
              strokeWidth={2}
              dot={{ r: 4, fill: isDark ? '#9CA3AF' : '#6B7280' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <CustomLegend />
    </div>
  );
}
