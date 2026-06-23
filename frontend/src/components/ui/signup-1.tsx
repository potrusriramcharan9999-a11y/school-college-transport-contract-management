import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Bus } from "lucide-react";
import { isGoogleAuthConfigured, renderGoogleButton } from "@/lib/googleIdentity";

interface Signup1Props {
  heading?: string;
  signupText?: string;
  loginText?: string;
  loginUrl?: string;
}

const Signup1 = ({
  heading = "Create Viewer Account",
  loginText = "Already have viewer access?",
  loginUrl = "/viewer-login",
}: Signup1Props) => {
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { googleRegister, logout } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const canUseGoogleSignup = Boolean(fullName.trim());

  const handleGoogleCallback = useCallback(async (response: { credential?: string }) => {
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      if (!response.credential) {
        throw new Error("Google did not return a credential token.");
      }

      if (!fullName.trim()) {
        throw new Error("Enter your full name before continuing with Google.");
      }

      await googleRegister(response.credential, {
        full_name: fullName.trim(),
      });
      logout();
      setSuccessMsg("Viewer account created successfully. Redirecting to viewer login...");
      setTimeout(() => {
        navigate("/viewer-login");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Google Sign-Up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [fullName, googleRegister, logout, navigate]);

  useEffect(() => {
    if (!isGoogleAuthConfigured || !canUseGoogleSignup) return;

    let isMounted = true;

    renderGoogleButton({
      element: googleButtonRef.current,
      callback: (response: { credential?: string }) => {
        if (isMounted) handleGoogleCallback(response);
      },
      text: "signup_with",
    }).catch((err: Error) => {
      if (isMounted) {
        console.error("Failed to initialize Google Sign-In:", err);
        setError("Google Sign-In could not be loaded. Please refresh and try again.");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [canUseGoogleSignup, handleGoogleCallback]);

  return (
    <section className="bg-[#080B14] h-screen text-white relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B7CFF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A78BFA]/5 rounded-full blur-3xl" />

      <div className="flex h-full items-center justify-center px-4 relative z-10 w-full max-w-sm">
        <div className="border-white/5 bg-[#121827]/70 flex w-full flex-col items-center gap-y-8 rounded-3xl border px-6 py-10 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center gap-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-3xl bg-gradient-to-tr from-[#8B7CFF] to-[#A78BFA] text-white text-xl font-bold mb-1 shadow-lg shadow-[#8B7CFF]/20">
              <Bus className="w-5 h-5 text-white" />
            </div>
            {heading && <h1 className="text-xl font-black text-white tracking-tight">{heading}</h1>}
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
              Viewer role only
            </p>
          </div>

          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-955/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl animate-fade-in">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-green-955/20 border border-green-500/20 text-green-400 text-xs font-bold rounded-2xl animate-fade-in">
                  {successMsg}
                </div>
              )}

              <input
                name="transport-viewer-register-full-name"
                type="text"
                placeholder="Full Name"
                autoComplete="off"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-[#0D1220] text-white border border-white/10 rounded-2xl text-xs focus:ring-4 focus:ring-[#8B7CFF]/10 focus:border-[#8B7CFF]/60 outline-none transition-all placeholder-[#94A3B8]/30"
              />

              <div className="rounded-2xl border border-white/10 bg-[#0D1220] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Role</p>
                <p className="mt-1 text-sm font-black text-white">Viewer</p>
              </div>

              {isGoogleAuthConfigured && canUseGoogleSignup ? (
                <div className="flex justify-center w-full opacity-100 data-[submitting=true]:opacity-60" data-submitting={submitting}>
                  <div ref={googleButtonRef} id="google-viewer-signup-btn" className="w-full flex justify-center min-h-10" />
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 bg-[#121827] border border-white/10 text-[#94A3B8] text-xs font-bold rounded-2xl opacity-60 flex items-center justify-center gap-2"
                >
                  {isGoogleAuthConfigured ? "Enter full name first" : "Google Sign-In unavailable"}
                </button>
              )}
            </div>
          </div>

          <div className="text-[#94A3B8] flex justify-center gap-1.5 text-xs">
            <p>{loginText}</p>
            <Link
              to={loginUrl}
              className="text-[#8B7CFF] hover:text-[#A78BFA] transition-colors font-bold hover:underline"
            >
              Viewer Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Signup1 };
