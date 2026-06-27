import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useLoginMutation, useGoogleLoginMutation } from '../features/api/apiSlice.js';
import { setCredentials } from '../features/auth/authSlice.js';
import { toast, apiErrorMessage } from '../utils/alert.js';
import { Logo, Spinner } from '../components/UI.jsx';

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: gLoading }] = useGoogleLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Greet by first name, but never crash if name is missing.
  const firstName = (user) => user?.name?.split(' ')[0] || 'there';

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials(res));
      toast.success(`Welcome back, ${firstName(res.user)}`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onGoogle = async (credResponse) => {
    // credResponse.credential is the Google ID token (JWT) we verify on the server.
    if (!credResponse?.credential) {
      toast.error('No credential returned from Google');
      return;
    }
    try {
      const res = await googleLogin({ idToken: credResponse.credential }).unwrap();
      dispatch(setCredentials(res));
      toast.success(`Signed in as ${firstName(res.user)}`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-navy-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-navy-400/20 blur-3xl" />

        <Logo light />

        <div className="relative">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-gold-400">
            Property CRM
          </p>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Turn every enquiry into a&nbsp;
            <span className="text-gold-400">confident</span> sale.
          </h2>
          <p className="mt-4 max-w-md text-navy-100/70">
            Manage leads, schedule site visits, track negotiations and close deals —
            all in one place, built for the Confident sales team.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-white">
            {[
              ['20+', 'Years of trust'],
              ['2766+', 'Homes delivered'],
              ['54', 'RERA projects'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-gold-400">{n}</div>
                <div className="text-xs text-navy-100/60">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-navy-100/50">
          © {new Date().getFullYear()} Confident Group. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="font-display text-2xl font-bold text-navy-900">Sign in</h1>
          <p className="mt-1 text-sm text-navy-500">Welcome back. Please enter your details.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                className="input"
                placeholder="you@confident-group.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? <Spinner className="h-5 w-5 text-white" /> : 'Sign in'}
            </button>
          </form>

          {GOOGLE_ENABLED && (
            <>
              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-navy-100" />
                <span className="text-xs font-medium uppercase tracking-wide text-navy-400">or</span>
                <span className="h-px flex-1 bg-navy-100" />
              </div>
              <div className="flex justify-center [&>div]:w-full">
                {gLoading ? (
                  <Spinner />
                ) : (
                  <GoogleLogin
                    onSuccess={onGoogle}
                    onError={() => toast.error('Google sign-in failed')}
                    width="320"
                    text="continue_with"
                    shape="rectangular"
                    useOneTap={false}
                  />
                )}
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-navy-500">
            New customer?{' '}
            <Link to="/register" className="font-semibold text-gold-600 hover:underline">
              Create an account
            </Link>
          </p>

          {/* Demo credentials (handy for the interview demo). */}
          <div className="mt-8 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
              Demo logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Admin', 'admin@crm.com', 'Admin@12345'],
                ['Staff', 'staff@crm.com', 'Staff@12345'],
                ['Agent', 'agent@crm.com', 'Agent@12345'],
                ['Customer', 'customer@crm.com', 'Customer@12345'],
              ].map(([label, email, pass]) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => fillDemo(email, pass)}
                  className="rounded-lg border border-navy-100 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-navy-600 hover:border-gold-300 hover:bg-gold-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}