import React, { useState } from 'react';
import {
  Store,
  Box,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Bike,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Search,
  DollarSign,
  TrendingUp,
  Package,
  AlertCircle,
  Clock,
  Check,
  Share2,
  Phone,
  Settings,
} from 'lucide-react';
import { Order, Product, UserProfile, OrderStatus } from '../../types';
import { doc, updateDoc, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { INITIAL_PRODUCTS } from '../../data/initialProducts';
import { generateDeliveryStaffWhatsAppMessage, getWhatsAppUrl } from '../../utils/whatsapp';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  users: UserProfile[];
  initialTab?: string;
  ownerWhatsApp?: string;
  onUpdateOwnerWhatsApp?: (num: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  users,
  initialTab = 'orders',
  ownerWhatsApp = '+91 99887 76655',
  onUpdateOwnerWhatsApp,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'staff' | 'reports'>(
    initialTab as any || 'orders'
  );

  // Filter state for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  
  // WhatsApp config modal
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState(false);
  const [currentWhatsAppNumber, setCurrentWhatsAppNumber] = useState(ownerWhatsApp);

  // Assign modal state
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodStock, setProdStock] = useState(10);
  const [prodCategory, setProdCategory] = useState('Instant Meals & Noodles');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);

  // Add delivery staff modal state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');

  const [message, setMessage] = useState<string | null>(null);

  // Delivery staff list (role === 'delivery')
  const deliveryStaff = users.filter((u) => u.role === 'delivery');

  // Accept Order
  const handleAcceptOrder = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });
      setMessage(`Order #${order.id.slice(-6)} accepted! You can now assign a delivery partner.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  // Change Order Status (Owner override)
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const updateData: any = {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      if (nextStatus === 'delivered') {
        updateData.deliveredAt = new Date().toISOString();
        updateData.paymentStatus = 'completed';
      }
      await updateDoc(doc(db, 'orders', orderId), updateData);
      setMessage(`Order #${orderId.slice(-6)} status updated to ${nextStatus.toUpperCase()}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Notify delivery staff via WhatsApp
  const handleNotifyStaffWhatsApp = (order: Order, staffPhone?: string, staffName?: string) => {
    const phone = staffPhone || '+91 91234 56789';
    const name = staffName || order.assignedDeliveryManName || 'Delivery Staff';
    const msg = generateDeliveryStaffWhatsAppMessage(order, name);
    const url = getWhatsAppUrl(phone, msg);
    window.open(url, '_blank');
  };

  // Save WhatsApp settings
  const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(
        doc(db, 'settings', 'shopConfig'),
        {
          ownerWhatsApp: currentWhatsAppNumber,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      onUpdateOwnerWhatsApp?.(currentWhatsAppNumber);
      setIsWhatsAppConfigOpen(false);
      setMessage(`Shop Owner WhatsApp updated to ${currentWhatsAppNumber}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/shopConfig');
    }
  };

  // Reject Order (Restores Stock)
  const handleRejectOrder = async (order: Order) => {
    const reason = prompt('Please enter rejection reason (e.g. Shop closed, item damaged):', 'Out of stock at counter');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'rejected',
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
      });

      // Restore inventory
      for (const item of order.items) {
        try {
          await updateDoc(doc(db, 'products', item.productId), {
            stock: increment(item.quantity),
            updatedAt: new Date().toISOString(),
          });
        } catch {}
      }

      setMessage(`Order #${order.id.slice(-6)} rejected and stock returned.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  // Assign Delivery Staff
  const handleConfirmAssignment = async () => {
    if (!assigningOrder || !selectedStaffId) return;

    const staff = deliveryStaff.find((s) => s.id === selectedStaffId);
    if (!staff) return;

    try {
      const assignmentId = `assign-${Date.now()}`;
      
      // 1. Update order
      await updateDoc(doc(db, 'orders', assigningOrder.id), {
        status: 'assigned',
        assignedDeliveryManId: staff.id,
        assignedDeliveryManName: staff.displayName,
        updatedAt: new Date().toISOString(),
      });

      // 2. Create DeliveryAssignment record
      await setDoc(doc(db, 'deliveryAssignments', assignmentId), {
        id: assignmentId,
        orderId: assigningOrder.id,
        deliveryManId: staff.id,
        deliveryManName: staff.displayName,
        customerName: assigningOrder.customerName,
        hostelRoom: assigningOrder.hostelRoom,
        hostelBlock: assigningOrder.hostelBlock,
        status: 'assigned',
        assignedAt: new Date().toISOString(),
      });

      setMessage(`Order assigned to ${staff.displayName}!`);
      setTimeout(() => setMessage(null), 3000);

      // Offer immediate WhatsApp notify
      if (staff.phone) {
        handleNotifyStaffWhatsApp(assigningOrder, staff.phone, staff.displayName);
      }

      setAssigningOrder(null);
      setSelectedStaffId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${assigningOrder.id}`);
    }
  };

  // Seed Initial Products
  const handleSeedProducts = async () => {
    if (!confirm('Populate hostel store with 12 sample high-demand items (Maggi, Red Bull, Chips, Notebooks, etc.)?')) return;
    try {
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), {
          ...p,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setMessage('Products catalog seeded successfully!');
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  // Open Product Modal
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdPrice(50);
    setProdStock(25);
    setProdCategory('Instant Meals & Noodles');
    setProdDesc('');
    setProdImage('https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80');
    setProdAvailable(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdPrice(product.price);
    setProdStock(product.stock);
    setProdCategory(product.category);
    setProdDesc(product.description);
    setProdImage(product.imageUrl);
    setProdAvailable(product.isAvailable);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prodId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
      const payload: Product = {
        id: prodId,
        name: prodName,
        price: Number(prodPrice),
        stock: Number(prodStock),
        category: prodCategory,
        description: prodDesc,
        imageUrl: prodImage || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
        isAvailable: prodAvailable,
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'products', prodId), payload);
      setIsProductModalOpen(false);
      setMessage(`Product "${prodName}" saved successfully!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from store inventory?`)) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setMessage(`Product "${name}" deleted.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  // Approve Delivery Staff
  const handleApproveStaff = async (staffId: string, isApproved: boolean) => {
    try {
      await updateDoc(doc(db, 'users', staffId), {
        isApproved,
        updatedAt: new Date().toISOString(),
      });
      setMessage(`Staff account ${isApproved ? 'approved' : 'suspended'}.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${staffId}`);
    }
  };

  // Create Delivery Staff Manually
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const staffId = `delivery-${Date.now()}`;
      const newStaff: UserProfile = {
        id: staffId,
        displayName: staffName,
        email: staffEmail,
        phone: staffPhone,
        role: 'delivery',
        isApproved: true,
        hostelBlock: 'Ground Floor Dispatch',
        roomNumber: 'Station 1',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', staffId), newStaff);
      setIsStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setMessage(`Delivery staff "${staffName}" created & approved!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    }
  };

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeDeliveries = orders.filter((o) => ['assigned', 'picked_up', 'out_for_delivery'].includes(o.status));
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'pending') return o.status === 'pending';
    if (orderStatusFilter === 'active') return ['accepted', 'assigned', 'picked_up', 'out_for_delivery'].includes(o.status);
    if (orderStatusFilter === 'delivered') return o.status === 'delivered';
    if (orderStatusFilter === 'rejected') return ['rejected', 'cancelled'].includes(o.status);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Top Dashboard Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-red-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5" />
              Shop Owner Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ravindra Pro Shop Management
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1">
              Live inventory control, order fulfillment & delivery dispatcher for hostel campus
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCurrentWhatsAppNumber(ownerWhatsApp);
                setIsWhatsAppConfigOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-white/20 shadow-sm"
              title="Configure WhatsApp order notification number"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: <strong className="text-emerald-300 font-mono">{ownerWhatsApp}</strong></span>
            </button>
            <button
              onClick={handleSeedProducts}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Seed Hostel Products
            </button>
            <button
              onClick={openNewProductModal}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* 4 Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-stone-300 text-xs">
              <span>Delivered Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">₹{totalRevenue}</div>
            <span className="text-[10px] text-emerald-300 font-semibold">{deliveredCount} completed orders</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-stone-300 text-xs">
              <span>Pending Orders</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{pendingOrders.length}</div>
            <span className="text-[10px] text-stone-300">Needs shop action</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-stone-300 text-xs">
              <span>Active In Delivery</span>
              <Bike className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{activeDeliveries.length}</div>
            <span className="text-[10px] text-stone-300">En route to rooms</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-stone-300 text-xs">
              <span>Total Inventory</span>
              <Box className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{products.length}</div>
            <span className="text-[10px] text-stone-300">Active products listed</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Admin Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Orders Management ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          Inventory Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Delivery Personnel ({deliveryStaff.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Sales & Daily Reports
        </button>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 1. ORDERS MANAGEMENT TAB */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order status filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'pending', label: 'Pending Review', count: pendingOrders.length },
              { id: 'active', label: 'In Delivery', count: activeDeliveries.length },
              { id: 'delivered', label: 'Completed', count: deliveredCount },
              { id: 'rejected', label: 'Cancelled / Rejected', count: orders.filter(o => ['rejected', 'cancelled'].includes(o.status)).length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderStatusFilter(f.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  orderStatusFilter === f.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-800">
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-500 text-sm">
              No orders found for the selected filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'pending';
                const isAccepted = order.status === 'accepted';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden transition-all hover:border-red-300"
                  >
                    <div className="p-5 bg-stone-50/80 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-stone-900">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-xs text-stone-500">
                            by <strong className="text-stone-800">{order.customerName}</strong>
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 font-semibold mt-0.5">
                          Room: <span className="text-red-700 font-bold">{order.hostelBlock} • {order.hostelRoom}</span>
                          {order.customerPhone && (
                            <span className="ml-2 text-stone-500 font-mono">({order.customerPhone})</span>
                          )}
                        </div>
                      </div>

                      {/* Status Badges & Quick Action */}
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-200 text-stone-800">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Order Details & Items */}
                    <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                          Ordered Items:
                        </div>
                        <div className="space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-stone-800">
                              <span>
                                {it.quantity}x <strong className="font-semibold">{it.name}</strong>
                              </span>
                              <span className="font-mono">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {order.instructions && (
                          <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                            <strong>Delivery Note:</strong> {order.instructions}
                          </div>
                        )}
                      </div>

                      {/* Summary & Owner Action Buttons */}
                      <div className="md:w-72 md:border-l md:border-stone-100 md:pl-5 flex flex-col justify-between gap-3">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-stone-500">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-stone-800">₹{order.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-stone-500">
                            <span>Delivery Fee:</span>
                            <span className="font-semibold text-stone-800">₹{order.deliveryFee}</span>
                          </div>
                          <div className="flex justify-between font-black text-stone-900 text-sm pt-1 border-t border-stone-100">
                            <span>Total Due (COD):</span>
                            <span className="text-red-600">₹{order.total}</span>
                          </div>
                        </div>

                        {/* Assigned delivery info */}
                        {order.assignedDeliveryManName && (
                          <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-200 flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-amber-600" />
                            <span>Assigned: <strong>{order.assignedDeliveryManName}</strong></span>
                          </div>
                        )}

                        {/* Order Management Actions */}
                        <div className="flex flex-col gap-2 pt-1">
                          {isPending && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptOrder(order)}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accept Order
                              </button>
                              <button
                                onClick={() => handleRejectOrder(order)}
                                className="py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          )}

                          {isAccepted && (
                            <button
                              onClick={() => {
                                setAssigningOrder(order);
                                setSelectedStaffId(deliveryStaff[0]?.id || '');
                              }}
                              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <Bike className="w-4 h-4" /> Assign Delivery Staff
                            </button>
                          )}

                          {['assigned', 'preparing', 'picked_up', 'out_for_delivery'].includes(order.status) && (
                            <div className="space-y-1.5 pt-1">
                              {/* WhatsApp Dispatch Button */}
                              <button
                                onClick={() => handleNotifyStaffWhatsApp(order)}
                                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                                title="Send WhatsApp notification with delivery room and items"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WhatsApp Delivery Partner</span>
                              </button>

                              {/* Status Advancers */}
                              <div className="grid grid-cols-2 gap-1.5">
                                {order.status === 'assigned' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                    className="col-span-2 py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200"
                                  >
                                    Mark Preparing
                                  </button>
                                )}
                                {(order.status === 'preparing' || order.status === 'picked_up') && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                                    className="col-span-2 py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200"
                                  >
                                    Mark Out for Delivery
                                  </button>
                                )}
                                {order.status === 'out_for_delivery' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                    className="col-span-2 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                                  >
                                    Confirm Delivered
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 2. INVENTORY CATALOG TAB */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900">Hostel Store Inventory</h2>
              <p className="text-xs text-stone-500">Edit prices, real-time stock quantities & product status</p>
            </div>
            <button
              onClick={openNewProductModal}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add New Item
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock Qty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                          />
                          <div>
                            <div className="font-bold text-stone-900">{p.name}</div>
                            <div className="text-[11px] text-stone-400 line-clamp-1 max-w-xs">
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-medium">{p.category}</td>
                      <td className="py-3 px-4 font-black text-stone-900">₹{p.price}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-black px-2 py-0.5 rounded-md ${
                            p.stock <= 0
                              ? 'bg-red-100 text-red-700'
                              : p.stock <= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={async () => {
                            await updateDoc(doc(db, 'products', p.id), {
                              isAvailable: !p.isAvailable,
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            p.isAvailable && p.stock > 0
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          {p.isAvailable && p.stock > 0 ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 3. DELIVERY PERSONNEL TAB */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900">Hostel Delivery Personnel</h2>
              <p className="text-xs text-stone-500">Approve accounts and register new delivery boys</p>
            </div>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Register Delivery Boy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveryStaff.map((staff) => {
              const activeCount = orders.filter(
                (o) => o.assignedDeliveryManId === staff.id && ['assigned', 'picked_up', 'out_for_delivery'].includes(o.status)
              ).length;
              const deliveredCount = orders.filter(
                (o) => o.assignedDeliveryManId === staff.id && o.status === 'delivered'
              ).length;

              return (
                <div
                  key={staff.id}
                  className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{staff.displayName}</h4>
                        <p className="text-xs text-stone-500">{staff.phone || staff.email}</p>
                        <span className="text-[10px] text-stone-400 font-mono">ID: {staff.id.slice(-6)}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        staff.isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {staff.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2.5 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold">Active Orders</span>
                      <div className="font-black text-amber-600 text-base">{activeCount}</div>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold">Total Delivered</span>
                      <div className="font-black text-emerald-600 text-base">{deliveredCount}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => handleApproveStaff(staff.id, !staff.isApproved)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                        staff.isApproved
                          ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {staff.isApproved ? 'Suspend / Revoke' : 'Approve Delivery Staff'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* 4. SALES REPORTS TAB */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Daily Sales Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500 font-semibold">Total Revenue Collected</span>
                <div className="text-2xl font-black text-red-600 mt-1">₹{totalRevenue}</div>
                <span className="text-[11px] text-stone-400">Cash / UPI on Delivery</span>
              </div>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500 font-semibold">Average Order Size</span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  ₹{deliveredCount > 0 ? Math.round(totalRevenue / deliveredCount) : 0}
                </div>
                <span className="text-[11px] text-stone-400">Per delivered hostel room</span>
              </div>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <span className="text-xs text-stone-500 font-semibold">Delivery Fulfillment Rate</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {orders.length > 0 ? `${Math.round((deliveredCount / orders.length) * 100)}%` : '100%'}
                </div>
                <span className="text-[11px] text-stone-400">{deliveredCount} of {orders.length} orders</span>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-stone-900">
              Hostel Best-Sellers (Ordered Items Breakdown)
            </h3>
            <div className="space-y-3">
              {products.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-stone-900">{p.name}</div>
                      <div className="text-[11px] text-stone-500">{p.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs text-stone-900">₹{p.price}</div>
                    <div className="text-[10px] text-stone-400">{p.stock} left in stock</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: Assign Delivery Staff */}
      {/* -------------------------------------------------------------------------------- */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Bike className="w-5 h-5 text-amber-600" /> Assign Delivery Agent
              </h3>
              <button onClick={() => setAssigningOrder(null)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <div className="text-xs bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1">
              <div>Order: <strong className="font-mono">#{assigningOrder.id.slice(-8).toUpperCase()}</strong></div>
              <div>Customer: <strong>{assigningOrder.customerName}</strong></div>
              <div>Destination: <strong className="text-red-700">{assigningOrder.hostelBlock} • {assigningOrder.hostelRoom}</strong></div>
              <div>Total: <strong className="text-emerald-700">₹{assigningOrder.total} (COD)</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Select Approved Delivery Partner
              </label>
              {deliveryStaff.length === 0 ? (
                <div className="text-xs text-red-600 p-3 bg-red-50 rounded-xl">
                  No delivery staff registered yet! Please add a delivery staff account from the Delivery Personnel tab.
                </div>
              ) : (
                <div className="space-y-2">
                  {deliveryStaff.map((staff) => (
                    <label
                      key={staff.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedStaffId === staff.id
                          ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="selectedStaff"
                          value={staff.id}
                          checked={selectedStaffId === staff.id}
                          onChange={(e) => setSelectedStaffId(e.target.value)}
                          className="accent-red-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-stone-900">{staff.displayName}</div>
                          <div className="text-[10px] text-stone-500">{staff.phone}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Available
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={!selectedStaffId}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: Add / Edit Product */}
      {/* -------------------------------------------------------------------------------- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-base text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Hostel Store Item'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Maggi Noodles (Pack of 4)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    min="1"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    min="0"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Category *</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium bg-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="Instant Meals & Noodles">Instant Meals & Noodles</option>
                  <option value="Snacks & Munchies">Snacks & Munchies</option>
                  <option value="Beverages & Drinks">Beverages & Drinks</option>
                  <option value="Study & Stationery">Study & Stationery</option>
                  <option value="Toiletries & Hygiene">Toiletries & Hygiene</option>
                  <option value="Hostel Essentials">Hostel Essentials</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Description</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  placeholder="Short description of item, portion, or use..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Image URL</label>
                <input
                  type="url"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodAvailable"
                  checked={prodAvailable}
                  onChange={(e) => setProdAvailable(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="prodAvailable" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Item is Available for Student Ordering
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: Register Delivery Staff */}
      {/* -------------------------------------------------------------------------------- */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" /> Add New Delivery Boy
              </h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Suresh Verma"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+91 91234 56789"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Email / Username *</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="suresh@ravindrapro.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 text-white font-black text-xs shadow-md"
                >
                  Create & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: Configure Shop Owner WhatsApp */}
      {/* -------------------------------------------------------------------------------- */}
      {isWhatsAppConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                Configure Shop WhatsApp Number
              </h3>
              <button onClick={() => setIsWhatsAppConfigOpen(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWhatsAppConfig} className="space-y-3">
              <p className="text-xs text-stone-600 leading-relaxed">
                When students place hostel orders, their pre-filled order receipt will open in WhatsApp directed to this phone number.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  WhatsApp Contact Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={currentWhatsAppNumber}
                    onChange={(e) => setCurrentWhatsAppNumber(e.target.value)}
                    placeholder="+91 99887 76655"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Include country code (e.g. +91 for India).
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppConfigOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md"
                >
                  Save WhatsApp Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
