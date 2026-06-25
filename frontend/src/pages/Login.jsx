import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Bus, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080B14] px-4 text-white animate-fade-in relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B7CFF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A78BFA]/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md p-8 bg-[#121827]/70 border border-white/5 shadow-2xl backdrop-blur-md relative z-10">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-gradient-to-tr from-[#8B7CFF] to-[#A78BFA] text-white text-xl font-bold mb-4 shadow-lg shadow-[#8B7CFF]/20">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Admin & Staff Login</h1>
          <p className="mt-1.5 text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
            Transport Contract Management
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl animate-fade-in flex items-start gap-2">
            <span>!</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <Input
            id="email"
            name="transport-login-email"
            label="Email Address"
            type="email"
            autoComplete="off"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-[#8B7CFF] hover:text-[#A78BFA] transition-colors cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <Input
              id="password"
              name="transport-login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-4" disabled={submitting}>
            {submitting ? (
              'Signing in...'
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-center text-xs font-bold">
          <Link
            to="/viewer-login"
            className="rounded-2xl border border-white/10 bg-[#0D1220] px-4 py-3 text-[#A78BFA] hover:bg-white/5 transition-colors"
          >
            Viewer Google Login
          </Link>
          <Link
            to="/register"
            className="rounded-2xl border border-white/10 bg-[#0D1220] px-4 py-3 text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
          >
            Create Viewer Account
          </Link>
        </div>
      </Card>
    </div>
  );
}
