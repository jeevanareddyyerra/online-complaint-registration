import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AwaitingApproval from './pages/AwaitingApproval';
import Unauthorized from './pages/Unauthorized';
import UserDashboard from './pages/user/UserDashboard';
import CreateComplaint from './pages/user/CreateComplaint';
import ComplaintDetails from './pages/user/ComplaintDetails';
import FeedbackPage from './pages/user/FeedbackPage';
import ChatPage from './pages/chat/ChatPage';
import AgentDashboard from './pages/agent/AgentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAssignments from './pages/admin/AdminAssignments';
import AgentListPage from './pages/admin/AgentListPage';
import UserListPage from './pages/admin/UserListPage';
import FeedbackReviewPage from './pages/admin/FeedbackReviewPage';

import { ThemeProvider } from './context/ThemeContext';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ComplaintProvider>
          <ToastContainer theme="dark" position="top-right" autoClose={3000} />
          <Router>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/awaiting-approval" element={<AwaitingApproval />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Citizen Dashboard Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Ordinary']} />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/lodge" element={<CreateComplaint />} />
              <Route path="/user/complaint/:id" element={<ComplaintDetails />} />
              <Route path="/user/feedback/:complaintId" element={<FeedbackPage />} />
              <Route path="/user/chat/:complaintId" element={<ChatPage />} />
            </Route>

            {/* Agent Dashboard Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Agent']} />}>
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/chat/:complaintId" element={<ChatPage />} />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/assignments" element={<AdminAssignments />} />
              <Route path="/admin/agents" element={<AgentListPage />} />
              <Route path="/admin/users" element={<UserListPage />} />
              <Route path="/admin/feedback" element={<FeedbackReviewPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ComplaintProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
