import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Bike,
  Sparkles,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, OWNER_EMAIL } from '../../context/AuthContext';
import { RavindraLogo } from '../common/RavindraLogo';
import { UserRole } from '../../types';

interface AuthScreenProps {
  onLoginSuccess?: (role: UserRole) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerStudent,
    registerDeliveryStaff,
    loginDemo,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register_student' | 'register_delivery'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hostelBlock, setHostelBlock] = useState('Block-B (Boys Hostel)');
  const [roomNumber, setRoomNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const profile = await loginWithEmail(email, password);
      setSuccessMsg(`Welcome back, ${profile.displayName}! Loading your dashboard...`);
      onLoginSuccess?.(profile.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setErrorMsg('Please enter your hostel room number.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const profile = await registerStudent(
        email,
        password,
        name,
        phone,
        hostelBlock,
        roomNumber
      );
      setSuccessMsg(`Student account created! Welcome, ${profile.displayName}.`);
      onLoginSuccess?.(profile.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create student account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await registerDeliveryStaff(email, password, name, phone);
      setSuccessMsg(res.message);
      // Reset form & return to login tab
      setTimeout(() => {
        setMode('login');
        setSuccessMsg('Registration submitted. Once the Shop Owner approves, you can sign in here.');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register delivery staff.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const profile = await loginWithGoogle();
      setSuccessMsg(`Signed in with Google as ${profile.displayName}!`);
      onLoginSuccess?.(profile.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const profile = await loginDemo(role);
      setSuccessMsg(`Logged in as ${profile.role.toUpperCase()}: ${profile.displayName}!`);
      onLoginSuccess?.(profile.role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-red-950 to-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 text-stone-100">
      {/* Background glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="p-2 rounded-3xl bg-white shadow-2xl shadow-red-600/30 ring-4 ring-amber-400/50 mb-3">
            <RavindraLogo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            RAVINDRA <span className="text-red-500">PRO</span> ORDERS
          </h1>
          <p className="text-xs text-amber-300 font-semibold tracking-wide uppercase mt-1">
            Hostel Room Express Delivery Platform
          </p>
          <p className="text-xs text-stone-400 mt-2 max-w-xs">
            Please sign in to browse shop products, manage inventory, or deliver orders.
          </p>
        </div>

        {/* Quick Demo Switcher Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Quick Role Login (Testing)
            </span>
            <span className="text-[10px] text-stone-400 font-normal">1-Click Access</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoSignIn('customer')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-500/60 text-left transition-all active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-white">Student</div>
              <div className="text-[10px] text-stone-400">Order items</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('admin')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-red-600/30 border border-white/10 hover:border-red-500/60 text-left transition-all active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mb-1 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-white">Shop Owner</div>
              <div className="text-[10px] text-stone-400">Manage shop</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('delivery')}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-amber-600/30 border border-white/10 hover:border-amber-500/60 text-left transition-all active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Bike className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-white">Delivery</div>
              <div className="text-[10px] text-stone-400">Deliveries</div>
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white text-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-stone-100 p-1 border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register_student');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register_student'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Student Register
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register_delivery');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register_delivery'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Delivery Staff
            </button>
          </div>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@hostel.edu or owner email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Google Sign In Divider */}
              <div className="relative my-4 text-center">
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-stone-200" />
                <span className="relative bg-white px-3 text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                  Or
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs shadow-xs transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>
          )}

          {/* 2. STUDENT REGISTRATION FORM */}
          {mode === 'register_student' && (
            <form onSubmit={handleRegisterStudent} className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-xl font-medium">
                🎓 <strong>Hostel Student Account:</strong> Instantly order snacks, noodles, stationery and essentials delivered to your room.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@hostel.edu"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Hostel Block *</label>
                  <select
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="Block-A (Boys Hostel)">Block-A (Boys)</option>
                    <option value="Block-B (Boys Hostel)">Block-B (Boys)</option>
                    <option value="Block-C (Girls Hostel)">Block-C (Girls)</option>
                    <option value="Block-D (PG Wing)">Block-D (PG Wing)</option>
                    <option value="Fresher Hostel">Fresher Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 314"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* 3. DELIVERY STAFF REGISTRATION FORM */}
          {mode === 'register_delivery' && (
            <form onSubmit={handleRegisterDelivery} className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2.5 rounded-xl font-medium">
                🛵 <strong>Delivery Agent Registration:</strong> All delivery personnel accounts require verification and activation by the <strong>Shop Owner</strong> before login is permitted.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amit Kumar"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="delivery@ravindrapro.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 91234 56789"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit for Shop Owner Approval'}
              </button>
            </form>
          )}
        </div>

        {/* Security and policy notice */}
        <p className="text-[11px] text-center text-stone-400">
          Protected by Firebase Authentication & Firestore Security Rules • Role-based access control enforced
        </p>
      </div>
    </div>
  );
};
