import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ShelterAccountPage from './pages/ShelterAccountPage';
import RenterAccountPage from './pages/RenterAccountPage';
import AdminAccountPage from './pages/AdminAccountPage';
import AdminSheltersPage from './pages/AdminSheltersPage';
import ListingPage from './pages/ListingPage';
import ShelterProfilePage from './pages/ShelterProfilePage';
import RenterProfilePage from './pages/RenterProfilePage';
import RentalPage from './pages/RentalPage';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <h2>We can't find that page</h2>
      <p style={{ color: 'gray' }}>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate(-1)}>Go back</button>
    </div>
  );
};

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
          <Route path="/listing/:id" element={<ListingPage />} />
          <Route path="/shelter/profile/:id" element={<ShelterProfilePage />} />
          <Route path="/renter/profile/:id" element={<RenterProfilePage />} />
          <Route path="/rental/:id" element={<RentalPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
