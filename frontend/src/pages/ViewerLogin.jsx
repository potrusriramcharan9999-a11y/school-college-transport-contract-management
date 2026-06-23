import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus } from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { isGoogleAuthConfigured, renderGoogleButton } from '../lib/googleIdentity';

export default function ViewerLogin() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleGoogleCallback = useCallback(async (response) => {
    setError('');
    setSubmitting(true);

    try {
      if (!response.credential) {
        throw new Error('Google did not return a credential token.');
      }

      await googleLogin(response.credential);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Viewer Google Sign-In failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [googleLogin, navigate]);

  useEffect(() => {
    if (!isGoogleAuthConfigured) return;

    let isMounted = true;

    renderGoogleButton({
      element: googleButtonRef.current,
      callback: (response) => {
        if (isMounted) handleGoogleCallback(response);
      },
      text: 'signin_with',
    }).catch((err) => {
      if (isMounted) {
        console.error('Failed to initialize Google Sign-In:', err);
        setError('Google Sign-In could not be loaded. Please refresh and try again.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080B14] px-4 text-white animate-fade-in relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B7CFF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A78BFA]/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-sm p-8 bg-[#121827]/70 border border-white/5 shadow-2xl backdrop-blur-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-gradient-to-tr from-[#8B7CFF] to-[#A78BFA] text-white text-xl font-bold mb-4 shadow-lg shadow-[#8B7CFF]/20">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Viewer Login</h1>
          <p className="mt-1.5 text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
            Google Sign-In only
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl animate-fade-in flex items-start gap-2">
            <span>!</span>
            <span>{error}</span>
          </div>
        )}

        {isGoogleAuthConfigured ? (
          <div className="flex justify-center w-full opacity-100 data-[submitting=true]:opacity-60" data-submitting={submitting}>
            <div ref={googleButtonRef} id="google-viewer-signin-btn" className="w-full flex justify-center min-h-10" />
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 bg-[#121827] border border-white/10 text-[#94A3B8] text-xs font-bold rounded-2xl opacity-60 flex items-center justify-center gap-2"
          >
            Google Sign-In unavailable
          </button>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 text-center text-xs font-bold">
          <Link
            to="/register"
            className="rounded-2xl border border-white/10 bg-[#0D1220] px-4 py-3 text-[#A78BFA] hover:bg-white/5 transition-colors"
          >
            Create Viewer Account
          </Link>
          <Link
            to="/login"
            className="rounded-2xl border border-white/10 bg-[#0D1220] px-4 py-3 text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
          >
            Admin / Staff Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
