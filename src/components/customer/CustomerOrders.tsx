import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Package,
  Bike,
  XCircle,
  AlertTriangle,
  ChevronRight,
  PhoneCall,
  MapPin,
  Calendar,
  Receipt,
  Share2,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { generateStudentOrderWhatsAppMessage, getWhatsAppUrl } from '../../utils/whatsapp';

interface CustomerOrdersProps {
  orders: Order[];
  ownerWhatsApp?: string;
  onBrowseStore: () => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ orders, ownerWhatsApp = '+91 99887 76655', onBrowseStore }) => {
  const { user } = useAuth();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter orders for the current user
  const myOrders = orders.filter((o) => o.customerId === user?.id || !user);

  const handleCancelOrder = async (order: Order) => {
    if (order.status !== 'pending') {
      alert('Orders can only be cancelled while in Pending status before the shop owner accepts it.');
      return;
    }

    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancellingOrderId(order.id);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        cancellationReason: 'Cancelled by customer',
        updatedAt: new Date().toISOString(),
      });

      for (const item of order.items) {
        try {
          await updateDoc(doc(db, 'products', item.productId), {
            stock: increment(item.quantity),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Stock restore note for item:', item.productId, e);
        }
      }

      setFeedback(`Order #${order.id.slice(-6)} has been cancelled and stock returned.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleSendWhatsApp = (order: Order) => {
    const text = generateStudentOrderWhatsAppMessage(order, 'Ravindra Pro Ordering App');
    const url = getWhatsAppUrl(ownerWhatsApp, text);
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Order Placed (Waiting for Shop)
          </span>
        );
      case 'accepted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Accepted by Shop
          </span>
        );
      case 'assigned':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5" /> Delivery Agent Assigned
          </span>
        );
      case 'preparing':
      case 'picked_up':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Preparing / Packaged at Shop
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white flex items-center gap-1.5 shadow-xs animate-bounce">
            <Bike className="w-3.5 h-3.5" /> Out For Delivery to Your Room!
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> {status === 'cancelled' ? 'Cancelled' : 'Rejected by Shop'}
          </span>
        );
      default:
        return null;
    }
  };

  const getStepNumber = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'accepted':
        return 2;
      case 'assigned':
        return 3;
      case 'preparing':
      case 'picked_up':
        return 4;
      case 'out_for_delivery':
        return 5;
      case 'delivered':
        return 6;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            My Hostel Orders & Tracking
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time status updates from Ravindra Pro Shop to your door
          </p>
        </div>
        <button
          onClick={onBrowseStore}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors"
        >
          Store Catalog
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Orders List */}
      {myOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">No orders placed yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Craving midnight noodles, cold energy drinks, or need an exam notebook? Place your first order now!
            </p>
          </div>
          <button
            onClick={onBrowseStore}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold text-xs shadow-md shadow-red-600/20 hover:from-red-700 hover:to-amber-700 transition-all"
          >
            Start Shopping Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => {
            const step = getStepNumber(order.status);
            const isFinished = order.status === 'delivered' || order.status === 'cancelled' || order.status === 'rejected';
            const canCancel = order.status === 'pending';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden transition-all hover:shadow-md"
              >
                {/* Order Card Top Bar */}
                <div className="p-5 bg-stone-50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-black text-xs">
                      RP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-stone-900">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 font-semibold flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{order.hostelBlock} • {order.hostelRoom}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Live Real-Time Stepper (If Active) */}
                {!isFinished && (
                  <div className="px-5 py-4 bg-gradient-to-r from-red-50/40 via-amber-50/30 to-white border-b border-stone-100">
                    <div className="flex items-center justify-between relative">
                      {/* Connection Line */}
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-stone-200 -translate-y-1/2 z-0" />
                      <div
                        className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-red-600 to-amber-500 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, ((step - 1) / 4) * 100))}%` }}
                      />

                      {/* Steps */}
                      {[
                        { label: 'Placed', num: 1 },
                        { label: 'Accepted', num: 2 },
                        { label: 'Assigned', num: 3 },
                        { label: 'Preparing', num: 4 },
                        { label: 'On Way', num: 5 },
                      ].map((s) => {
                        const active = step >= s.num;
                        const current = step === s.num;

                        return (
                          <div key={s.num} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                current
                                  ? 'bg-red-600 text-white ring-4 ring-red-200 shadow-md scale-110'
                                  : active
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-white border-2 border-stone-300 text-stone-400'
                              }`}
                            >
                              {active ? '✓' : s.num}
                            </div>
                            <span
                              className={`text-[10px] mt-1 font-bold ${
                                current ? 'text-red-700' : active ? 'text-stone-700' : 'text-stone-400'
                              }`}
                            >
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {order.assignedDeliveryManName && (
                      <div className="mt-3 bg-white p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4 text-amber-600" />
                          <span className="text-stone-600">
                            Delivery Partner: <strong className="text-stone-900">{order.assignedDeliveryManName}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          Approaching Hostel
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Items Breakdown */}
                <div className="p-5 space-y-3">
                  <div className="divide-y divide-stone-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                            />
                          )}
                          <div>
                            <span className="font-bold text-stone-900">{item.name}</span>
                            <div className="text-stone-500">
                              ₹{item.price} × {item.quantity}
                            </div>
                          </div>
                        </div>
                        <span className="font-extrabold text-stone-900">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Price */}
                  <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-stone-500">
                        Subtotal: <strong className="text-stone-700">₹{order.subtotal}</strong> | Delivery: <strong className="text-stone-700">{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</strong>
                      </div>
                      <div className="text-stone-900 font-black text-sm">
                        Total: <span className="text-red-600">₹{order.total}</span> ({order.paymentMethod.toUpperCase()} - {order.paymentStatus === 'completed' ? 'Paid' : 'Pay on Delivery'})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendWhatsApp(order)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                        title="Send order receipt to Shop Owner via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp Owner</span>
                      </button>

                      {/* Actions: Cancel if pending */}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingOrderId === order.id}
                          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}

                      {order.status === 'delivered' && order.deliveredAt && (
                        <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          Delivered on {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  );
};
