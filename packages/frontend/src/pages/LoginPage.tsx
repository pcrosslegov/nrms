import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/auth';

export default function LoginPage() {
  const { login, loginWithAzure, authConfig } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLocalLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleAzureLogin() {
    setError('');
    setLoading(true);
    try {
      await loginWithAzure();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Microsoft login failed');
    } finally {
      setLoading(false);
    }
  }

  const azureEnabled = authConfig?.azureAd.enabled ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#003366]">NRMS</h1>
            <p className="text-sm text-gray-500 mt-1">
              News Release Management System
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-200 mb-4">
              {error}
            </div>
          )}

          {/* Microsoft sign-in */}
          {azureEnabled && (
            <>
              <button
                onClick={handleAzureLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Sign in with Microsoft
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400 uppercase">or</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
            </>
          )}

          {/* Local account sign-in */}
          <form onSubmit={handleLocalLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#003366] text-white text-sm font-medium rounded-md hover:bg-[#002244] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in with local account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
