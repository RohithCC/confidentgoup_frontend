import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/leads': 'Lead Management',
  '/properties': 'Properties',
  '/followups': 'Follow-ups',
  '/payments': 'Payments',
  '/users': 'User Management',
  '/profile': 'My Profile',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  // Resolve a title (handle nested routes like /leads/:id).
  const title =
    TITLES[pathname] ||
    (pathname.startsWith('/leads/') ? 'Lead Details' : 'Confident CRM');

  return (
    <div className="flex min-h-screen bg-navy-50/40">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
