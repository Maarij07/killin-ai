'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import TotalUsersChart from '../../components/charts/TotalUsersChart';
import MinutesVsBudgetChart from '../../components/charts/MinutesVsBudgetChart';
import NumbersVsCostChart from '../../components/charts/NumbersVsCostChart';
import UserDataTable from '../../components/UserDataTable';

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const router = useRouter();

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
      <UserDataTable onViewMore={handleViewMoreUsers} />
    </div>
  );
}
