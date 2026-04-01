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
import AdminDisputesPage from './pages/AdminDisputesPage';
import ListingPage from './pages/ListingPage';
import ShelterProfilePage from './pages/ShelterProfilePage';
import RenterProfilePage from './pages/RenterProfilePage';
import RentalPage from './pages/RentalPage';
import RentalHistoryPage from './pages/RentalHistoryPage';
import HelpPage from './pages/HelpPage';
import MessagingPage from './pages/MessagingPage';
import ConversationsPage from './pages/ConversationsPage';
import AdminDisputeChatPage from './pages/AdminDisputeChatPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminReportChatPage from './pages/AdminReportChatPage';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const role = localStorage.getItem('role');
  return role ? element : <Navigate to="/login" replace />;
};

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
          <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
          <Route path="/shelter/account" element={<PrivateRoute element={<ShelterAccountPage />} />} />
          <Route path="/renter/account" element={<PrivateRoute element={<RenterAccountPage />} />} />
          <Route path="/admin/account" element={<PrivateRoute element={<AdminAccountPage />} />} />
          <Route path="/admin/shelters" element={<PrivateRoute element={<AdminSheltersPage />} />} />
          <Route path="/admin/disputes" element={<PrivateRoute element={<AdminDisputesPage />} />} />
          <Route path="/listing/:id" element={<PrivateRoute element={<ListingPage />} />} />
          <Route path="/shelter/profile/:id" element={<PrivateRoute element={<ShelterProfilePage />} />} />
          <Route path="/renter/profile/:id" element={<PrivateRoute element={<RenterProfilePage />} />} />
          <Route path="/rental/:id" element={<PrivateRoute element={<RentalPage />} />} />
          <Route path="/rentals/history" element={<PrivateRoute element={<RentalHistoryPage />} />} />
          <Route path="/help" element={<PrivateRoute element={<HelpPage />} />} />
          <Route path="/messages" element={<PrivateRoute element={<ConversationsPage />} />} />
          <Route path="/messages/:userId" element={<PrivateRoute element={<MessagingPage />} />} />
          <Route path="/admin/dispute/:rentalId/chat" element={<PrivateRoute element={<AdminDisputeChatPage />} />} />
          <Route path="/admin/reports" element={<PrivateRoute element={<AdminReportsPage />} />} />
          <Route path="/admin/report/:reportId/chat" element={<PrivateRoute element={<AdminReportChatPage />} />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
