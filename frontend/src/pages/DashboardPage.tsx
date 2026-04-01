import React from 'react';
import Topbar from '../components/Topbar';
import AdminDashboard from './dashboard/AdminDashboard';
import ShelterDashboard from './dashboard/ShelterDashboard';
import RenterDashboard from './dashboard/RenterDashboard';
import { useRole } from '../hooks/useRole';

const DashboardPage: React.FC = () => {
  const role = useRole();

  return (
    <>
      <Topbar />
      {role === 'ADMIN'   && <AdminDashboard />}
      {role === 'SHELTER' && <ShelterDashboard />}
      {role === 'RENTER'  && <RenterDashboard />}
    </>
  );
};

export default DashboardPage;