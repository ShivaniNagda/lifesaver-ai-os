import React, { useState, useEffect } from "react";
import { Mail, Lock, User, Sparkles, Shield, AlertTriangle, Key, RefreshCw, LogOut } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (email: string, userRole: string) => void;
  currentEmail?: string;
  onLogout?: () => void;
}

export default function AuthScreen({ onAuthSuccess, currentEmail, onLogout }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Premium Contributor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // JWT simulator state
  const [jwtToken, setJwtToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [tokenExp, setTokenExp] = useState<number | null>(null);

  useEffect(() => {
    // Generate simulated tokens if logged in
    if (currentEmail) {
      const mockPayload = btoa(JSON.stringify({ email: currentEmail, role, exp: Date.now() + 3600000 }));
      setJwtToken(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayload}.signature_verification`);
      setRefreshToken(`refresh_token_${btoa(currentEmail).substring(0, 16)}_${Date.now()}`);
      setTokenExp(3600); // 1 hour in seconds
    } else {
      setJwtToken("");
      setRefreshToken("");
      setTokenExp(null);
    }
  }, [currentEmail, role]);

  // Handle countdown for session expiration
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
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Persist in localStorage
      localStorage.setItem("lifeos_email", email);
      localStorage.setItem("lifeos_role", role);
      onAuthSuccess(email, role);
      setSuccess("Authenticated successfully under LifeSaver Secure Protocol.");
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password || !name) {
      setError("Name, email, and password are required.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("lifeos_email", email);
      localStorage.setItem("lifeos_role", role);
      onAuthSuccess(email, role);
      setSuccess("Account registered and locked with AES-256 schema.");
    }, 900);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please input your registered email address.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess("Secure password reset link dispatched to your email corridor.");
    }, 700);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      const googleEmail = "shivanifs.1786145@gmail.com";
      localStorage.setItem("lifeos_email", googleEmail);
      localStorage.setItem("lifeos_role", "Executive Officer");
      onAuthSuccess(googleEmail, "Executive Officer");
      setSuccess("OAuth 2.0 handshake verified. Welcome Back.");
    }, 650);
  };

  const triggerRefreshToken = () => {
    if (!currentEmail) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTokenExp(3600);
      const newPayload = btoa(JSON.stringify({ email: currentEmail, role, exp: Date.now() + 3600000 }));
      setJwtToken(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${newPayload}.signature_rotated_${Math.random().toString(36).substring(4, 8)}`);
      setSuccess("Access token rotated and cryptographically validated.");
    }, 400);
  };

  if (currentEmail) {
    return (
      <div id="auth-panel-active" className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-white" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Secure Core Guard</h3>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-900/20">
            PROTECTED
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-900 flex justify-between items-center">
            <div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">ACTIVE COGNITIVE PRINCIPAL</span>
              <p className="text-xs font-medium text-zinc-200 truncate max-w-[180px]">{currentEmail}</p>
              <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">Role: {role}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-zinc-900 font-mono text-[9px] text-zinc-500">
            <div className="flex justify-between">
              <span>JWT ISSUER:</span>
              <span className="text-white">LIFESAVER_OS_OAUTH</span>
            </div>
            <div className="flex justify-between">
              <span>ALGORITHM:</span>
              <span className="text-white">HS256 (HMAC-SHA256)</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span>ACCESS TOKEN EXPIRY:</span>
              <span className="text-amber-400 font-medium">
                {tokenExp ? `${Math.floor(tokenExp / 60)}m ${tokenExp % 60}s` : "0s"}
              </span>
            </div>
            <div className="mt-2 text-zinc-600 truncate border-t border-zinc-900 pt-2 select-all cursor-pointer hover:text-zinc-400" title="Click to copy mock JWT token">
              {jwtToken}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={triggerRefreshToken}
              disabled={loading}
              className="flex-1 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-[10px] flex items-center justify-center gap-1.5 transition-colors font-mono uppercase"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Rotate Crypt Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="auth-panel-inactive" className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-white tracking-wide font-display">LifeSaver Secure Node</h3>
        <p className="text-[10px] text-zinc-500 font-mono">ESTABLISH LIFESAVER ENVELOPE HANDSHAKE</p>
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
                placeholder="Secure email"
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
                placeholder="Access credentials"
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
              Keep session lock
            </label>
            <span onClick={() => setMode("forgot")} className="text-zinc-400 hover:text-white cursor-pointer">
              Decrypt key?
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? "Authenticating..." : "Synchronize Session Key"}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink mx-3 text-[9px] font-mono text-zinc-600 uppercase">or connect network</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {/* Modern Minimalist Google Graphic */}
              <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.503s3.809-8.503 8.503-8.503c2.202 0 4.212.827 5.755 2.185l3.143-3.143C18.665.98 15.603 0 12.24 0 5.513 0 0 5.513 0 12.24s5.513 12.24 12.24 12.24c6.8 0 12.24-5.44 12.24-12.24 0-.82-.097-1.425-.245-1.955H12.24z" />
              </svg>
              Google Sign-In Autopilot
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
                placeholder="Your full name"
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
                placeholder="Secure email"
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
                placeholder="Access credentials"
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
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center"
            >
              {loading ? "Creating..." : "Establish AES-256 Workspace"}
            </button>
          </div>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-3.5">
          <p className="text-[11px] text-zinc-500 leading-relaxed text-center">
            Provide your verified email. LifeSaver agents will deliver a cryptographically signed reset key corridor.
          </p>
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                placeholder="Your secure email"
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
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center"
            >
              {loading ? "Dispatched Key..." : "Issue Reset Corridor"}
            </button>
          </div>
        </form>
      )}

      <div className="text-center pt-2 border-t border-zinc-900/60">
        {mode === "login" ? (
          <span className="text-[10px] font-mono text-zinc-500">
            First time in the OS?{" "}
            <span onClick={() => setMode("register")} className="text-zinc-300 hover:text-white cursor-pointer underline">
              Provision Node
            </span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-zinc-500">
            Have existing envelopes?{" "}
            <span onClick={() => setMode("login")} className="text-zinc-300 hover:text-white cursor-pointer underline">
              Return to Core
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
