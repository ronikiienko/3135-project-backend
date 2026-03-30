import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ShelterAccountPage from './pages/ShelterAccountPage';
import RenterAccountPage from './pages/RenterAccountPage';
import AdminAccountPage from './pages/AdminAccountPage';
import AdminSheltersPage from './pages/AdminSheltersPage';

const theme = createTheme({
  primaryColor: 'blue',
});

const App: React.FC = () => {
  return (
    <MantineProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shelter/account" element={<ShelterAccountPage />} />
          <Route path="/renter/account" element={<RenterAccountPage />} />
          <Route path="/admin/account" element={<AdminAccountPage />} />
          <Route path="/admin/shelters" element={<AdminSheltersPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
