'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../lib/logger';
import TotalUsersChart from '../../components/charts/TotalUsersChart';
import MinutesVsBudgetChart from '../../components/charts/MinutesVsBudgetChart';
import NumbersVsCostChart from '../../components/charts/NumbersVsCostChart';
import UserDataTable from '../../components/UserDataTable';

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  plan: string;
  minutes_allowed: number;
  minutes_used: number;
  description: string;
  location: string;
  created_at: string;
  updated_at: string;
  join_date: string;
}

// Use local API proxy to avoid CORS issues
const API_BASE_URL = '/api';

export default function AdminDashboard() {
  const { } = useTheme();
  const { showError } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  // const [isLoading, setIsLoading] = useState(true); // unused in current implementation


  // Fetch users for the dashboard table
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('No auth token found');
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || data || []);
          
        } else {
          console.error('Failed to fetch users for dashboard:', response.status);
          
          // Log fetch failure
          logger.logSystemAction(
            'DASHBOARD_USER_DATA_FETCH_FAILED',
            `Failed to fetch users for dashboard: HTTP ${response.status}`,
            'MEDIUM'
          );
        }
      } catch (error) {
        console.error('Error fetching users for dashboard:', error);
        
        // Log API connection error
        logger.logSystemAction(
          'DASHBOARD_USER_API_CONNECTION_FAILED',
          `Failed to connect to user API for dashboard: ${error}`,
          'HIGH'
        );
      } finally {
        // setIsLoading(false); // currently unused
      }
    };

    fetchUsers();
  }, [showError, router]);

  const handleViewMoreUsers = () => {
    router.push('/admin/user-management');
  };

  return (
    <div className="space-y-6">

      {/* Top row: Total Users chart */}
      <TotalUsersChart />

      {/* Bottom row: Two comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MinutesVsBudgetChart />
        <NumbersVsCostChart />
      </div>

      {/* User Data Table */}
      <UserDataTable users={users} onViewMore={handleViewMoreUsers} />
    </div>
  );
}
