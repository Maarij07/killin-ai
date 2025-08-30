'use client';

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import colors from '../../../colors.json';

const data = [
  { month: 'Jan', users: 450 },
  { month: 'Feb', users: 520 },
  { month: 'Mar', users: 480 },
  { month: 'Apr', users: 650 },
  { month: 'May', users: 750 },
  { month: 'Jun', users: 850 },
  { month: 'Jul', users: 900 },
  { month: 'Aug', users: 600 },
  { month: 'Sep', users: 720 },
  { month: 'Oct', users: 650 },
  { month: 'Nov', users: 580 },
  { month: 'Dec', users: 780 }
];

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
          <span className="text-orange-500">●</span> Users: {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }

  return null;
};

export default function TotalUsersChart() {
  const { isDark } = useTheme();

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-4 sm:p-6`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Total Users
        </h3>
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
