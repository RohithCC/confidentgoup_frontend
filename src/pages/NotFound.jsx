import { Link } from 'react-router-dom';
import { Logo } from '../components/UI.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-gradient px-6 text-center">
      <Logo light className="mb-8" />
      <p className="font-display text-7xl font-bold text-gold-400">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-navy-100/70">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link to="/dashboard" className="btn-gold mt-6">Back to dashboard</Link>
    </div>
  );
}
