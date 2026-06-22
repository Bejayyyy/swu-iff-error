import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import systemLogo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { INSTITUTIONAL_EMAIL_DOMAIN, isDevSignupEnabled } from '../firebase/constants';
import { validateInstitutionalEmail } from '../firebase/authHelpers';

export default function DeveloperSignup() {
  const navigate = useNavigate();
  const { signupDeveloper } = useAuth();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'IT',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isDevSignupEnabled()) {
    return <Navigate to="/login" replace />;
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = validateInstitutionalEmail(form.email);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { redirectTo } = await signupDeveloper({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        department: form.department,
      });
      navigate(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: '#1e3a5f' }}
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full px-10 py-10" style={{ maxWidth: 440 }}>
        <div className="flex flex-col items-center mb-6">
          <img src={systemLogo} alt="SWU-IFSS logo" className="h-16 w-auto object-contain mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#1e3a5f' }}>
            Temporary Developer sign-up
          </p>
          <p className="text-[10px] text-gray-400 mt-1 text-center">
            Creates your @phinmaed.com account and Firestore profile automatically. Disable before production.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}
          <div className="space-y-3">
            <div>
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Institutional email</label>
              <input
                type="email"
                className="form-input"
                placeholder={`you@${INSTITUTIONAL_EMAIL_DOMAIN}`}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={(e) => set('department', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  className="form-input pr-10"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Confirm password</label>
              <input
                className="form-input"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-black text-sm text-white mt-6 disabled:opacity-60"
            style={{ background: '#1e3a5f' }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Developer account'}
          </button>
        </form>

        <p className="text-center text-xs mt-5">
          <Link to="/login" className="font-semibold" style={{ color: '#1e3a5f' }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
