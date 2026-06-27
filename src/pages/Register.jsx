import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../features/api/apiSlice.js';
import { setCredentials } from '../features/auth/authSlice.js';
import { toast, apiErrorMessage } from '../utils/alert.js';
import { Logo, Spinner } from '../components/UI.jsx';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      const res = await register(form).unwrap();
      dispatch(setCredentials(res));
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-gradient px-6 py-12">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-8 shadow-soft">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center font-display text-2xl font-bold text-navy-900">Create your account</h1>
        <p className="mt-1 text-center text-sm text-navy-500">
          Register to submit and track your property enquiries.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" name="name" required value={form.name} onChange={onChange} className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={onChange} className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={onChange} className="input" placeholder="9876543210" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required value={form.password} onChange={onChange} className="input" placeholder="At least 8 characters" />
          </div>

          <button type="submit" disabled={isLoading} className="btn-gold w-full">
            {isLoading ? <Spinner className="h-5 w-5" /> : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gold-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
