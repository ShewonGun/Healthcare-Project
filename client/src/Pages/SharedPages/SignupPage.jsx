import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import { FiSun, FiMoon, FiChevronLeft } from 'react-icons/fi';
import { FaHeartbeat } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import {
  getPasswordValidation,
  getPasswordStrengthClasses,
  getPasswordFirstError,
} from '../../utils/passwordValidation';

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor',  label: 'Doctor' },
];

const DASHBOARD = {
  patient: '/patient/dashboard',
  doctor:  '/doctor/dashboard',
};

/* Fields shown per role */
const ROLE_FIELDS = {
  patient: ['firstName', 'lastName', 'email', 'password'],
  doctor:  ['firstName', 'lastName', 'email', 'password'],
};

const FIELD_META = {
  firstName: { label: 'First Name',       type: 'text',     placeholder: 'John' },
  lastName:  { label: 'Last Name',        type: 'text',     placeholder: 'Doe' },
  name:      { label: 'Full Name',        type: 'text',     placeholder: 'John Doe' },
  email:     { label: 'Email',            type: 'email',    placeholder: 'you@example.com' },
  password:  { label: 'Password',         type: 'password', placeholder: '••••••••' },
};

const ROLE_BADGES = {
  patient: 'Access appointments, medical records & payments.',
  doctor:  'Manage your schedule, patients & consultations.',
};

const SignupPage = () => {
  const { saveUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [role, setRole]     = useState('patient');
  const [form, setForm]     = useState({});
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setError('Google signup failed. Please try again.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await authAPI.googleAuth(role, idToken);
      const data = res.data.data;
      if (!data.role) data.role = role;
      data.authProvider = 'google';
      saveUser(data);
      navigate(DASHBOARD[role]);
    } catch (err) {
      setError(err.response?.data?.message || 'Google signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (r) => {
    setRole(r);
    setForm({});
    setError('');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password) {
      const validation = getPasswordValidation(form.password);
      if (!validation.isValid) {
        return setError(getPasswordFirstError(validation));
      }
    }

    setLoading(true);
    try {
      const res = await authAPI.register(role, form);
      const data = res.data.data;
      if (!data.role) data.role = role;
      data.authProvider = 'local';
      saveUser(data);
      navigate(DASHBOARD[role]);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = ROLE_FIELDS[role];
  const passwordValidation = getPasswordValidation(form.password || '');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-10">

      {/* Back to landing */}
      <Link
        to="/"
        className="fixed top-4 left-4 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Back to landing"
        aria-label="Back to landing"
      >
        <FiChevronLeft className="w-4 h-4" />
      </Link>

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm p-6 sm:p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-md mb-4">
            <FaHeartbeat className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create an account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Join MediConnect</p>
        </div>

        {/* Role Selector */}
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">I am a…</p>
        <div className="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden mb-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRoleChange(r.value)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                role === r.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Role description badge */}
        <p className="text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-md px-3 py-2 mb-6">
          {ROLE_BADGES[role]}
        </p>

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* firstName + lastName side by side */}
          {fields.includes('firstName') && fields.includes('lastName') ? (
            <div className="grid grid-cols-2 gap-3">
              {['firstName', 'lastName'].map((f) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {FIELD_META[f].label}
                  </label>
                  <input
                    name={f}
                    type={FIELD_META[f].type}
                    required
                    value={form[f] || ''}
                    onChange={handleChange}
                    placeholder={FIELD_META[f].placeholder}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          ) : null}

          {/* Remaining fields */}
          {fields
            .filter((f) => f !== 'firstName' && f !== 'lastName')
            .map((f) => (
              <div key={f}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {FIELD_META[f].label}
                </label>
                <input
                  name={f}
                  type={FIELD_META[f].type}
                  required
                  value={form[f] || ''}
                  onChange={handleChange}
                  placeholder={FIELD_META[f].placeholder}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            ))}

          {fields.includes('password') && (form.password || '').length > 0 && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Password Strength</p>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{passwordValidation.label}</span>
              </div>

              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all ${getPasswordStrengthClasses(passwordValidation.score)}`}
                  style={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs">
                <p className={passwordValidation.checks.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  At least 8 characters
                </p>
                <p className={passwordValidation.checks.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  1 uppercase letter
                </p>
                <p className={passwordValidation.checks.number ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  1 number
                </p>
                <p className={passwordValidation.checks.special ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  1 special character
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-md px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <div className="pt-2">
            <div className="relative my-2 text-center text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 bg-white dark:bg-gray-900 relative z-10">or continue with</span>
              <div className="absolute left-0 right-0 top-1/2 border-t border-gray-200 dark:border-gray-700 z-0" />
            </div>
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google signup failed. Please try again.')}
                useOneTap={false}
                width="300"
              />
            </div>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
