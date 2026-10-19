import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Order, Product, UserProfile } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { Header } from './components/Header';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { AuthModal } from './components/AuthModal';
import { CustomerHome } from './components/customer/CustomerHome';
import { ProductDetailModal } from './components/customer/ProductDetailModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { CustomerOrders } from './components/customer/CustomerOrders';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DeliveryDashboard } from './components/delivery/DeliveryDashboard';
import { Sparkles, User, ShieldCheck, Bike } from 'lucide-react';

function MainAppContent() {
  const { user, isOwnerAdmin, isDeliveryStaff, isCustomer, logout } = useAuth();

  const [showSplash, setShowSplash] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('shop');

  // Real-time Firestore state
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS as Product[]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [ownerWhatsApp, setOwnerWhatsApp] = useState('+91 99887 76655');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Subscribe to Shop Settings (Owner WhatsApp, etc.)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'settings', 'shopConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.ownerWhatsApp) {
          setOwnerWhatsApp(data.ownerWhatsApp);
        }
      }
    });
    return () => unsub();
  }, [user]);

  // Synchronize Tab with User Role
  useEffect(() => {
    if (!user) return;

    if (isOwnerAdmin) {
      if (['shop', 'orders', 'assigned', 'history'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    } else if (isDeliveryStaff) {
      if (['shop', 'orders', 'dashboard', 'inventory', 'staff', 'reports'].includes(currentTab)) {
        setCurrentTab('assigned');
      }
    } else {
      if (['dashboard', 'inventory', 'staff', 'reports', 'assigned', 'history'].includes(currentTab)) {
        setCurrentTab('shop');
      }
    }
  }, [user, user?.role, isOwnerAdmin, isDeliveryStaff]);

  // 1. Subscribe to Products (Only when logged in)
  useEffect(() => {
    if (!user) return;

    const productsPath = 'products';
    const unsub = onSnapshot(
      collection(db, productsPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => {
            list.push({ ...(d.data() as Product), id: d.id });
          });
          setProducts(list);
        } else {
          setProducts(INITIAL_PRODUCTS as Product[]);
          INITIAL_PRODUCTS.slice(0, 6).forEach(async (p) => {
            try {
              await setDoc(doc(db, 'products', p.id), {
                ...p,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            } catch {}
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, productsPath);
      }
    );

    return () => unsub();
  }, [user]);

  // 2. Subscribe to Orders (Only when logged in)
  useEffect(() => {
    if (!user) return;

    const ordersPath = 'orders';
    const q = query(collection(db, ordersPath), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as Order), id: d.id });
        });
        setOrders(list);
      },
      (error) => {
        console.warn('Orders listener note:', error);
      }
    );

    return () => unsub();
  }, [user]);

  // 3. Subscribe to Users (Only when logged in as admin)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const usersPath = 'users';
    const unsub = onSnapshot(
      collection(db, usersPath),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as UserProfile), id: d.id });
        });
        setUsersList(list);
      },
      (error) => {
        console.warn('Users listener note:', error);
      }
    );

    return () => unsub();
  }, [user]);

  const handleOrderSuccess = (order: Order) => {
    setCurrentTab('orders');
  };

  // MANDATORY REQUIREMENT: If user is not logged in, show login / registration screen first
  if (!user) {
    return (
      <>
        {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}
        <AuthScreen
          onLoginSuccess={(role) => {
            if (role === 'admin') setCurrentTab('dashboard');
            else if (role === 'delivery') setCurrentTab('assigned');
            else setCurrentTab('shop');
          }}
        />
      </>
    );
  }

  // User is successfully authenticated
  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans">
      {/* Header with User Info and Direct Logout Button */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Role Indicator Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs py-2 px-4 shadow-inner border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              Authenticated Session:
            </span>
            <span className="text-white font-black bg-stone-800 px-2.5 py-0.5 rounded-full border border-stone-700">
              {user.displayName} (
              {user.role === 'customer'
                ? 'Student'
                : user.role === 'admin'
                ? 'Shop Owner'
                : 'Delivery Agent'}
              )
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'customer' && user.roomNumber && (
              <span className="text-[11px] text-amber-300 font-semibold hidden sm:inline">
                Hostel: {user.hostelBlock} • {user.roomNumber}
              </span>
            )}
            <button
              onClick={() => logout()}
              className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Protected Content Area */}
      <main className="flex-1 pb-16">
        {/* A. Customer Dashboard */}
        {isCustomer && (
          <>
            {currentTab === 'shop' && (
              <CustomerHome
                products={products}
                onSelectProduct={(p) => setSelectedProduct(p)}
              />
            )}
            {currentTab === 'orders' && (
              <CustomerOrders
                orders={orders}
                ownerWhatsApp={ownerWhatsApp}
                onBrowseStore={() => setCurrentTab('shop')}
              />
            )}
          </>
        )}

        {/* B. Shop Owner Dashboard */}
        {isOwnerAdmin && (
          <AdminDashboard
            orders={orders}
            products={products}
            users={usersList}
            ownerWhatsApp={ownerWhatsApp}
            onUpdateOwnerWhatsApp={(num) => setOwnerWhatsApp(num)}
            initialTab={
              ['inventory', 'staff', 'reports'].includes(currentTab) ? currentTab : 'orders'
            }
          />
        )}

        {/* C. Delivery Staff Dashboard */}
        {isDeliveryStaff && (
          <DeliveryDashboard
            orders={orders}
            initialTab={currentTab === 'history' ? 'history' : 'assigned'}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-stone-800">
            Ravindra Pro Orders • Hostel Fast Food & Essentials Online Ordering
          </p>
          <p className="text-[11px] text-stone-400">
            Logged in as {user.email} • Authenticated with Firebase
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        ownerWhatsApp={ownerWhatsApp}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainAppContent />
      </CartProvider>
    </AuthProvider>
  );
}
