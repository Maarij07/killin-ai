'use client';

import { useState, useEffect } from 'react';
import { Cell, PieChart, Pie, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchVAPIAnalytics } from '../../lib/analytics';
import colors from '../../../colors.json';


interface CostData {
  name: string;
  cost: number;
}

const COST_COLORS = ['#FF9D28', '#4F46E5', '#06B6D4', '#EC4899'];

export default function MinutesVsBudgetChart() {
  const { isDark } = useTheme();
  const [data, setData] = useState<CostData[]>([]);
  const [, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, duration: 0, durationMin: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analytics = await fetchVAPIAnalytics();
        
        // Get real cost breakdown from API
        const costBreakdown: CostData[] = [
          { name: 'LLM', cost: analytics.costBreakdown.llm },
          { name: 'STT', cost: analytics.costBreakdown.stt },
          { name: 'TTS', cost: analytics.costBreakdown.tts },
          { name: 'VAPI', cost: analytics.costBreakdown.vapi }
        ];
        
        setData(costBreakdown);
        setStats({
          total: analytics.totalCost,
          duration: Math.round(analytics.totalDuration),
          durationMin: Math.round(analytics.totalDuration / 60)
        });
        setLastUpdated(analytics.lastUpdated);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadAnalytics();

    // Set up auto-refresh every 20 seconds
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
      <div className="mb-4">
        <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Cost Breakdown
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Total Cost: <span className="font-semibold text-lg" style={{ color: colors.colors.primary }}>${stats.total.toFixed(2)}</span>
        </p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Total Duration: <span className="font-semibold">{stats.duration}s ({stats.durationMin}m)</span>
        </p>
        {lastUpdated && (
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
                border: 'none',
                borderRadius: '6px',
                color: isDark ? '#E5E7EB' : '#1F2937'
              }}
            />
            <Bar dataKey="cost" fill={colors.colors.primary} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COST_COLORS[index % COST_COLORS.length]}
                  style={{ opacity: 1, filter: 'brightness(1.15)' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
