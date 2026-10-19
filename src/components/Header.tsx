import React, { useState } from 'react';
import {
  ShoppingBag,
  User,
  ShieldCheck,
  Bike,
  Sparkles,
  ChevronDown,
  LogOut,
  Receipt,
  Store,
  Box,
  BarChart3,
  Users,
} from 'lucide-react';
import { RavindraLogo } from './common/RavindraLogo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UserRole } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { user, switchRole, logout, isOwnerAdmin, isDeliveryStaff, isCustomer } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleColors: Record<UserRole, { bg: string; label: string; icon: any }> = {
    customer: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Student / Customer',
      icon: User,
    },
    admin: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      label: 'Shop Owner / Admin',
      icon: ShieldCheck,
    },
    delivery: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'Delivery Agent',
      icon: Bike,
    },
  };

  const currentRoleInfo = user ? roleColors[user.role] : roleColors.customer;
  const RoleIcon = currentRoleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Brand & Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div
            onClick={() => {
              if (isOwnerAdmin) setCurrentTab('dashboard');
              else if (isDeliveryStaff) setCurrentTab('assigned');
              else setCurrentTab('shop');
            }}
            className="cursor-pointer transition-transform hover:scale-102"
          >
            <RavindraLogo size="md" />
          </div>

          {/* Center Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
            {isCustomer && (
              <>
                <button
                  onClick={() => setCurrentTab('shop')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    currentTab === 'shop'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Hostel Store
                </button>
                <button
                  onClick={() => setCurrentTab('orders')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'orders'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  My Orders
                </button>
              </>
            )}

            {isOwnerAdmin && (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'dashboard'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Orders
                </button>
                <button
                  onClick={() => setCurrentTab('inventory')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'inventory'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  Inventory
                </button>
                <button
                  onClick={() => setCurrentTab('staff')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'staff'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Delivery Staff
                </button>
                <button
                  onClick={() => setCurrentTab('reports')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'reports'
                      ? 'bg-white text-red-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Sales Reports
                </button>
              </>
            )}

            {isDeliveryStaff && (
              <>
                <button
                  onClick={() => setCurrentTab('assigned')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'assigned'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  Active Deliveries
                </button>
                <button
                  onClick={() => setCurrentTab('history')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'history'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Delivery History
                </button>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher Pill (Great for testing all 3 user roles instantly) */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${currentRoleInfo.bg} hover:shadow-xs`}
                title="Switch role for quick testing"
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentRoleInfo.label}</span>
                <span className="sm:hidden uppercase tracking-wider text-[11px]">{user?.role}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Switch Role (Testing)
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>

                  <button
                    onClick={() => {
                      switchRole('customer');
                      setCurrentTab('shop');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      user?.role === 'customer' ? 'text-red-600 font-bold bg-red-50/50' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">Student / Customer</div>
                        <div className="text-[10px] text-stone-500 font-normal">Order snacks, toiletries & stationery</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('admin');
                      setCurrentTab('dashboard');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      user?.role === 'admin' ? 'text-red-600 font-bold bg-red-50/50' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">Shop Owner / Admin</div>
                        <div className="text-[10px] text-stone-500 font-normal">Manage inventory, orders & staff</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('delivery');
                      setCurrentTab('assigned');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      user?.role === 'delivery' ? 'text-red-600 font-bold bg-red-50/50' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">Delivery Man</div>
                        <div className="text-[10px] text-stone-500 font-normal">Pick up and deliver to hostel rooms</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Shopping Cart Button (Customer role) */}
            {isCustomer && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full bg-stone-100 text-stone-700 hover:bg-red-50 hover:text-red-600 transition-all border border-stone-200"
                aria-label="View Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-600 to-amber-500 text-white font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Auth Button */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-stone-800 max-w-[100px] truncate">
                  {user?.displayName || 'Sign In'}
                </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-900 truncate">{user?.displayName}</p>
                    <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                    {user?.roomNumber && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        {user.hostelBlock} • {user.roomNumber}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuth();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    Account & Room Info
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-stone-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={() => logout()}
              className="p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden py-2 border-t border-stone-100 flex items-center justify-around gap-1">
          {isCustomer && (
            <>
              <button
                onClick={() => setCurrentTab('shop')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'shop' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Store
              </button>
              <button
                onClick={() => setCurrentTab('orders')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'orders' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                My Orders
              </button>
            </>
          )}

          {isOwnerAdmin && (
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'dashboard' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setCurrentTab('inventory')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'inventory' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Stock
              </button>
              <button
                onClick={() => setCurrentTab('staff')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'staff' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => setCurrentTab('reports')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'reports' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Sales
              </button>
            </>
          )}

          {isDeliveryStaff && (
            <>
              <button
                onClick={() => setCurrentTab('assigned')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'assigned' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                Assigned
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                  currentTab === 'history' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                History
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
