import React, { useState } from 'react';
import { X, Sparkles, User, ShieldCheck, Bike, CheckCircle2 } from 'lucide-react';
import { RavindraLogo } from './common/RavindraLogo';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, loginWithGoogle, loginDemo, updateProfileDetails, logout } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [hostelBlock, setHostelBlock] = useState(user?.hostelBlock || 'Block-B');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || 'Room 314');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    try {
      setIsSubmitting(true);
      setMessage(null);
      await loginWithGoogle();
      setMessage('Successfully logged in!');
      setTimeout(onClose, 800);
    } catch (err: any) {
      setMessage(err.message || 'Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    loginDemo(role);
    setMessage(`Switched to ${role.toUpperCase()} account successfully!`);
    setTimeout(onClose, 600);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfileDetails({
        displayName: name || 'Hostel Student',
        phone,
        hostelBlock,
        roomNumber,
      });
      setMessage('Profile updated successfully!');
      setTimeout(onClose, 700);
    } catch (err: any) {
      setMessage(err.message || 'Could not update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Brand */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-amber-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <RavindraLogo size="lg" textColor="text-white" />
          </div>
          <p className="mt-3 text-red-100 text-xs font-medium">
            Hostel Online Ordering & Doorstep Delivery System
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {message && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Quick 1-Click Role Login Selector (Required for testing all 3 roles seamlessly) */}
          <div className="mb-6 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Test Accounts (3 Roles)
              </span>
              <span className="text-[11px] text-stone-400">1-Click Login</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.role === 'customer'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                    : 'border-stone-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-900">Student</div>
                <div className="text-[10px] text-stone-500">Shop & Order</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.role === 'admin'
                    ? 'border-red-500 bg-red-50/70 shadow-xs ring-1 ring-red-500'
                    : 'border-stone-200 bg-white hover:border-red-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-900">Shop Owner</div>
                <div className="text-[10px] text-stone-500">Store Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('delivery')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  user?.role === 'delivery'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
                    : 'border-stone-200 bg-white hover:border-amber-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-1.5">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-900">Delivery Staff</div>
                <div className="text-[10px] text-stone-500">Deliveries</div>
              </button>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm shadow-xs transition-all active:scale-98 disabled:opacity-50"
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
              Sign In with Google Account
            </button>
            <div className="relative my-4 text-center">
              <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-stone-200" />
              <span className="relative bg-white px-3 text-xs text-stone-400 font-semibold uppercase tracking-wider">
                Or Edit Hostel Details
              </span>
            </div>
          </div>

          {/* User Details & Hostel Location Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Hostel Block / Wing
                </label>
                <select
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white"
                >
                  <option value="Block-A (Boys Hostel)">Block-A (Boys)</option>
                  <option value="Block-B (Boys Hostel)">Block-B (Boys)</option>
                  <option value="Block-C (Girls Hostel)">Block-C (Girls)</option>
                  <option value="Block-D (PG Wing)">Block-D (PG Wing)</option>
                  <option value="Fresher Hostel">Fresher Hostel</option>
                  <option value="Main Campus Staff Quarter">Staff Quarters</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Hostel Room Number
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 314"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Contact Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Delivery agents will call this number upon reaching your hostel block.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Sign Out
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
