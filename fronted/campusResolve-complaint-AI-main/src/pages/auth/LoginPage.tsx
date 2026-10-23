import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatApiErrorMessage } from '../../services/apiClient';
import heroImage from '../../assets/images/campus_ops_hero_1791972571268.jpg';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Server,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If a valid session already exists, immediately redirect to correct role dashboard
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'staff') navigate('/staff', { replace: true });
      else if (role === 'student') navigate('/student', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both your university email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await login({ email: cleanEmail, password });
      success('Welcome back!', `Signed in as ${profile.full_name || profile.email}`);

      const userRole = (profile.role || '').toLowerCase();
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'staff') {
        navigate('/staff', { replace: true });
      } else if (userRole === 'student') {
        navigate('/student', { replace: true });
      } else {
        throw new Error(`Unrecognized user role received from database: ${profile.role}`);
      }
    } catch (err: any) {
      const msg = formatApiErrorMessage(err);
      setErrorMessage(msg);
      error('Sign in failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090e21] flex flex-col justify-center selection:bg-cyan-500/20 selection:text-cyan-300 relative overflow-hidden py-8">
      {/* Ambient Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden dash-card dash-card-glow shadow-2xl border border-white/10"
        >
          {/* Left Column: Form */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-[#0e162f]/80">
            <div>
              {/* Brand Header */}
              <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-md shadow-cyan-500/20">
                  <div className="w-full h-full bg-[#090e21] rounded-[10px] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                    CampusResolve <span className="text-cyan-400">AI</span>
                  </span>
                  <span className="text-[10px] text-[#617498] font-mono">University Operations</span>
                </div>
              </Link>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-xs sm:text-sm text-[#8c9fc2] mt-2 leading-relaxed">
                Enter your university credentials to access live complaint tracking, operations dispatch, and audit logs.
              </p>

              {errorMessage && (
                <div className="mt-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8c9fc2] mb-1.5" htmlFor="email">
                    University Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#617498] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full bg-[#090e21]/80 border border-white/10 rounded-xl px-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#617498] focus:outline-hidden focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#8c9fc2]" htmlFor="password">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#617498] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#090e21]/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#617498] focus:outline-hidden focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#617498] hover:text-white transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#090e21] font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-[#090e21] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-[#8c9fc2]">
                  New student?{' '}
                  <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2">
                    Create Student Account
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[11px] text-[#617498] text-center leading-relaxed font-mono">
                Centralized database role resolution · Zero mock credentials
              </p>
            </div>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="lg:col-span-6 relative hidden lg:flex flex-col justify-between p-12 bg-[#121c38] overflow-hidden border-l border-white/5">
            <img
              src={heroImage}
              alt="Campus Operations"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e162f] via-[#121c38]/80 to-transparent" />

            <div className="relative z-10 space-y-4">
              <span className="text-[11px] font-bold tracking-widest uppercase text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise Dashboard</span>
              </span>
              <h2 className="text-2xl font-bold text-white leading-snug">
                Verified Accountability & Real-Time Resolution
              </h2>
              <p className="text-xs text-[#8c9fc2] leading-relaxed max-w-sm">
                CampusResolve AI coordinates autonomous triage, department dispatch, technician resolution logs, and executive approvals on a unified system.
              </p>
            </div>

            <div className="relative z-10 p-5 rounded-2xl bg-[#090e21]/80 backdrop-blur-md border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8c9fc2] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Production Backend</span>
                </span>
                <span className="text-emerald-400 font-semibold font-mono">Live</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8c9fc2] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-violet-400" />
                  <span>Autonomous AI Triage</span>
                </span>
                <span className="text-cyan-400 font-semibold font-mono">Connected</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8c9fc2] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Human Verification</span>
                </span>
                <span className="text-amber-300 font-semibold font-mono">Enforced</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
