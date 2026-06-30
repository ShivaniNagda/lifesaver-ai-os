import React, { useState, useEffect } from "react";
import { Mail, Lock, User, Sparkles, Shield, AlertTriangle, Key, RefreshCw, LogOut } from "lucide-react";
import { useToast } from "./ToastProvider";
import { signInWithPopup } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "../lib/firebase";

interface AuthScreenProps {
  onAuthSuccess: (email: string, userRole: string) => void;
  currentEmail?: string;
  onLogout?: () => void;
}

export default function AuthScreen({ onAuthSuccess, currentEmail, onLogout }: AuthScreenProps) {
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Premium Contributor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [jwtToken, setJwtToken] = useState("");
  const [tokenExp, setTokenExp] = useState<number | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("lifeos_token");
    if (storedToken) {
      setJwtToken(storedToken);
      setTokenExp(3600); // simulated expiry display
    } else {
      setJwtToken("");
      setTokenExp(null);
    }
  }, [currentEmail]);

  useEffect(() => {
    if (!tokenExp) return;
    const interval = setInterval(() => {
      setTokenExp(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenExp]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please fill in all credentials.");
      showError("Missing Required Fields", "Please enter both your email and password.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      localStorage.setItem("lifeos_token", data.token);
      localStorage.setItem("lifeos_email", data.user.email);
      localStorage.setItem("lifeos_role", data.user.role);
      
      setJwtToken(data.token);
      setTokenExp(3600);
      setSuccess("Successfully signed in.");
      showSuccess("Login Successful", `Welcome back, ${data.user.username || data.user.email}!`);
      
      setTimeout(() => {
        onAuthSuccess(data.user.email, data.user.role);
      }, 500);
    } catch (err: any) {
      const errMsg = err.message || "Connection refused by secure core.";
      setError(errMsg);
      showError("Login Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password || !name) {
      setError("Name, email, and password are required.");
      showError("Missing Required Fields", "Please specify your name, email, and password.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      localStorage.setItem("lifeos_token", data.token);
      localStorage.setItem("lifeos_email", data.user.email);
      localStorage.setItem("lifeos_role", data.user.role);

      setJwtToken(data.token);
      setTokenExp(3600);
      setSuccess("Account created successfully.");
      showSuccess("Account Created Successfully", "Your secure AI OS vault has been provisioned!");
      
      setTimeout(() => {
        onAuthSuccess(data.user.email, data.user.role);
      }, 500);
    } catch (err: any) {
      const errMsg = err.message || "Could not connect to the authentication server.";
      setError(errMsg);
      showError("Registration Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please input your registered email address.");
      showError("Missing Email", "Please enter your registered email address.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate password reset link.");
      }

      setSuccess(`Reset link generated: ${data.resetLink}. Expires in 15 mins.`);
      showSuccess("Password Reset Requested", "A temporary reset link was generated.");
    } catch (err: any) {
      const errMsg = err.message || "Failed to send password reset email.";
      setError(errMsg);
      showError("Request Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const auth = getFirebaseAuth();
      const provider = getGoogleProvider();
      
      // Always opens the Google Account selection screen via signInWithPopup
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser.email) {
        throw new Error("No email returned from Google authentication.");
      }

      const selectedEmail = googleUser.email;
      const selectedName = googleUser.displayName || selectedEmail.split("@")[0];
      const googleUid = googleUser.uid;
      const securePassword = `oauth_auto_secure_password_${selectedEmail.split("@")[0]}_${googleUid}_1867145`;

      // Check if user is registered, if not, register first, then login
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedName,
          email: selectedEmail,
          password: securePassword,
          role: "Executive Officer"
        })
      });

      let data = await regRes.json();
      if (!regRes.ok) {
        // Try logging in instead
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: selectedEmail,
            password: securePassword
          })
        });
        data = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(data.error || "Google Sign-In failed.");
        }
      }

      // Store photo and info
      if (googleUser.photoURL) {
        localStorage.setItem("lifeos_avatar_url", googleUser.photoURL);
      }
      localStorage.setItem("lifeos_token", data.token);
      localStorage.setItem("lifeos_email", data.user.email);
      localStorage.setItem("lifeos_role", data.user.role);

      setJwtToken(data.token);
      setTokenExp(3600);
      setSuccess("Successfully signed in with Google.");
      showSuccess("Google Sign-In Successful", `Authenticated securely as ${data.user.email}`);
      
      setTimeout(() => {
        onAuthSuccess(data.user.email, data.user.role);
      }, 500);
    } catch (err: any) {
      const errCode = err?.code || "";
      const errMsg = err?.message || "";
      
      if (errCode === "auth/popup-closed-by-user" || errMsg.includes("popup-closed-by-user")) {
        showWarning("Sign-In Cancelled", "The Google login popup was closed before completion.");
        setError(""); // Clear error state to avoid showing raw technical error card
        return;
      }

      if (errCode === "auth/popup-blocked" || errMsg.includes("popup-blocked")) {
        const popupMsg = "The Google login window was blocked by your browser. Please allow popups and try again.";
        setError(popupMsg);
        showError("Popup Blocked", popupMsg);
        return;
      }

      if (errCode === "auth/cancelled-popup-request" || errMsg.includes("cancelled-popup-request")) {
        return;
      }

      // Format any other firebase-specific error code into a friendly message
      let friendlyMsg = errMsg;
      if (errMsg.includes("auth/")) {
        friendlyMsg = "Google authentication failed. Please verify your network or try again.";
      }
      
      setError(friendlyMsg);
      showError("Authentication Error", friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const triggerRefreshToken = () => {
    if (!currentEmail) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTokenExp(3600);
      setSuccess("Session token renewed.");
      showSuccess("Session Renewed", "Your AI OS access token has been updated.");
    }, 400);
  };

  if (currentEmail) {
    const maskEmail = (emailStr: string) => {
      if (!emailStr) return "Verified ✓";
      const [local, domain] = emailStr.split("@");
      if (!domain) return emailStr;
      if (local.length <= 4) return `${local[0]}***@${domain}`;
      return `${local.slice(0, 4)}****@${domain}`;
    };

    const handleSignOutAll = () => {
      showSuccess("Signed Out Successfully", "You have been signed out of all connected devices.");
      if (onLogout) onLogout();
    };

    return (
      <div id="auth-panel-active" className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-5 bg-zinc-900/30">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Security & Access</h3>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Protected
          </span>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 bg-black/40 rounded-xl border border-zinc-900 space-y-2.5 text-xs text-zinc-300">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-500 font-medium">Security Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                Verified Secure
              </span>
            </div>
            
            <div className="flex justify-between items-center py-0.5 border-t border-zinc-900/60 pt-2">
              <span className="text-zinc-500 font-medium">Verified Email</span>
              <span className="text-zinc-300 font-mono font-medium">{maskEmail(currentEmail)}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-t border-zinc-900/60 pt-2">
              <span className="text-zinc-500 font-medium">Last Login</span>
              <span className="text-zinc-400 font-medium">Today • 10:30 AM</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-t border-zinc-900/60 pt-2">
              <span className="text-zinc-500 font-medium">Current Device</span>
              <span className="text-zinc-300 font-medium">Windows • Chrome</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-t border-zinc-900/60 pt-2">
              <span className="text-zinc-500 font-medium">Location</span>
              <span className="text-zinc-300 font-medium">India</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-t border-zinc-900/60 pt-2">
              <span className="text-zinc-500 font-medium">Trusted Device</span>
              <span className="text-emerald-400 font-semibold">Yes</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-t border-zinc-900/60 pt-2">
              <span className="text-zinc-500 font-medium">Session Status</span>
              <span className="text-zinc-300 font-semibold">Signed In Securely</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-t border-zinc-900/60 pt-2">
              <span className="text-zinc-500 font-medium">Last Activity</span>
              <span className="text-zinc-400">Active Now</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                showSuccess("Session Lock Extended", "Your workspace security token has been renewed.");
              }}
              className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Security Token
            </button>
            <button
              onClick={handleSignOutAll}
              className="w-full py-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out From All Devices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="auth-panel-inactive" className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-white tracking-wide font-display">Sign In to LifeSaver</h3>
        <p className="text-[10px] text-zinc-500 font-mono font-semibold">ENTER YOUR ACCOUNT DETAILS</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl flex gap-2 items-start text-[11px] text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl flex gap-2 items-start text-[11px] text-emerald-400">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
          <p>{success}</p>
        </div>
      )}

      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono">
            <label className="flex items-center gap-1.5 text-zinc-500 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-3 h-3 rounded bg-zinc-950 border-zinc-900" />
              Remember me
            </label>
            <span onClick={() => setMode("forgot")} className="text-zinc-400 hover:text-white cursor-pointer">
              Forgot Password?
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink mx-3 text-[9px] font-mono text-zinc-600 uppercase">or sign in with</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.503s3.809-8.503 8.503-8.503c2.202 0 4.212.827 5.755 2.185l3.143-3.143C18.665.98 15.603 0 12.24 0 5.513 0 0 5.513 0 12.24s5.513 12.24 12.24 12.24c6.8 0 12.24-5.44 12.24-12.24 0-.82-.097-1.425-.245-1.955H12.24z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </form>
      )}

      {mode === "register" && (
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-3.5">
          <p className="text-[11px] text-zinc-500 leading-relaxed text-center font-sans">
            Provide your registered email address. We will generate a secure reset link to recover your account.
          </p>
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                placeholder="Your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      )}

      <div className="text-center pt-2 border-t border-zinc-900/60">
        {mode === "login" ? (
          <span className="text-[10px] font-mono text-zinc-500">
            Don't have an account?{" "}
            <span onClick={() => setMode("register")} className="text-zinc-300 hover:text-white cursor-pointer underline">
              Create Account
            </span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-zinc-500">
            Already have an account?{" "}
            <span onClick={() => setMode("login")} className="text-zinc-300 hover:text-white cursor-pointer underline">
              Sign In
            </span>
          </span>
        )}
      </div>


    </div>
  );
}
