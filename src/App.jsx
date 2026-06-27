import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthed } from './features/auth/authSlice.js';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import { ROLES } from './utils/constants.js';

import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';   // match your folder
import Catalog from './pages/Catalog.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import Properties from './pages/Properties.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';
import FollowUps from './pages/FollowUps.jsx';
import Payments from './pages/Payments.jsx';
import Users from './pages/Users.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const isAuthed = useSelector(selectIsAuthed);

  return (
    <Routes>
      {/* Public landing + catalog — no login required */}
      <Route path="/" element={<Home />} />
      
      <Route path="/catalog" element={<Catalog />} />

      {/* Public auth pages — redirect to dashboard if already signed in */}
      <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthed ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* Protected app shell */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />

        <Route
          path="/leads"
          element={
            <RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT]}>
              <Leads />
            </RoleRoute>
          }
        />
        <Route
          path="/leads/:id"
          element={
            <RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT, ROLES.USER]}>
              <LeadDetail />
            </RoleRoute>
          }
        />
        <Route
          path="/followups"
          element={
            <RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT]}>
              <FollowUps />
            </RoleRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT, ROLES.USER]}>
              <Payments />
            </RoleRoute>
          }
        />
        <Route
          path="/users"
          element={
            <RoleRoute roles={[ROLES.SUPER_ADMIN]}>
              <Users />
            </RoleRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}