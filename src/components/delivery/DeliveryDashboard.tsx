import React, { useState } from 'react';
import {
  Bike,
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  ChevronRight,
  Receipt,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';

interface DeliveryDashboardProps {
  orders: Order[];
  initialTab?: string;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ orders, initialTab = 'assigned' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assigned' | 'history'>(initialTab as any || 'assigned');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter orders assigned strictly to this delivery agent
  const myAssignedOrders = orders.filter((o) => {
    // In production: matching user.id
    // For testing/demo flexibility: also match assigned agent name or id
    return (
      (o.assignedDeliveryManId === user?.id ||
       o.assignedDeliveryManName === user?.displayName ||
       (!o.assignedDeliveryManId && o.status === 'assigned'))
    );
  });

  const activeDeliveries = myAssignedOrders.filter((o) =>
    ['assigned', 'preparing', 'picked_up', 'out_for_delivery'].includes(o.status)
  );

  const completedDeliveries = myAssignedOrders.filter((o) => o.status === 'delivered');

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const updatePayload: any = {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };

      if (nextStatus === 'delivered') {
        updatePayload.deliveredAt = new Date().toISOString();
        updatePayload.paymentStatus = 'completed';
      }

      await updateDoc(doc(db, 'orders', orderId), updatePayload);

      setFeedback(`Order #${orderId.slice(-6)} updated to "${nextStatus.replace(/_/g, ' ').toUpperCase()}"`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-red-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/20">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                Delivery Agent Dispatch
              </div>
              <h1 className="text-2xl font-black">{user?.displayName || 'Delivery Staff'}</h1>
              <p className="text-xs text-amber-100 mt-0.5">
                Hostel Doorstep Delivery Terminal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-2xl border border-white/10 text-xs">
            <div className="text-center px-3 border-r border-white/10">
              <span className="text-amber-200 font-bold block text-[10px] uppercase">Active</span>
              <span className="text-lg font-black">{activeDeliveries.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-amber-200 font-bold block text-[10px] uppercase">Delivered</span>
              <span className="text-lg font-black">{completedDeliveries.length}</span>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'assigned'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <Bike className="w-4 h-4" />
          Assigned Tasks ({activeDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Completed Deliveries ({completedDeliveries.length})
        </button>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* 1. ACTIVE ASSIGNED DELIVERIES */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {activeDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-500 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">No active delivery assignments</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                When the shop owner assigns hostel orders to you, they will immediately appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((order) => {
                const isAssigned = order.status === 'assigned';
                const isPickedUp = order.status === 'picked_up';
                const isOutForDelivery = order.status === 'out_for_delivery';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden transition-all hover:border-amber-400"
                  >
                    {/* Top bar */}
                    <div className="p-5 bg-amber-50/50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-stone-900">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-xs text-amber-900 font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/70">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 font-bold mt-1 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span className="text-stone-900 font-extrabold">{order.hostelBlock} • {order.hostelRoom}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Collect from Student</span>
                        <span className="text-lg font-black text-red-600">₹{order.total} (COD)</span>
                      </div>
                    </div>

                    {/* Customer & Items Details */}
                    <div className="p-5 space-y-4">
                      {/* Customer contact pill */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-xs">
                        <div>
                          <div className="font-extrabold text-stone-900">{order.customerName}</div>
                          <div className="text-stone-500">{order.customerPhone || 'Phone on file'}</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {order.customerPhone && (
                            <>
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call
                              </a>
                              <a
                                href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Hello ${order.customerName}, this is ${user?.displayName || 'your delivery agent'} from Ravindra Pro. I am assigned to deliver your order #${order.id.slice(-8).toUpperCase()} to ${order.hostelBlock} ${order.hostelRoom}.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                              >
                                <span>WhatsApp</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {order.instructions && (
                        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
                          <strong>Hostel Note:</strong> {order.instructions}
                        </div>
                      )}

                      {/* Items to collect */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                          Package Contents:
                        </span>
                        <div className="space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-stone-700">
                              <span>
                                {it.quantity}x <strong className="text-stone-900">{it.name}</strong>
                              </span>
                              <span className="font-mono text-stone-500">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Workflow Action Buttons */}
                      <div className="pt-2 border-t border-stone-100">
                        {order.status === 'assigned' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            disabled={updatingOrderId === order.id}
                            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                          >
                            <Package className="w-4 h-4" />
                            <span>1. Accept Task & Mark "Preparing Order"</span>
                          </button>
                        )}

                        {(order.status === 'preparing' || order.status === 'picked_up') && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                            disabled={updatingOrderId === order.id}
                            className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                          >
                            <Bike className="w-4 h-4" />
                            <span>2. Collected Package • Mark "Out for Delivery"</span>
                          </button>
                        )}

                        {order.status === 'out_for_delivery' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            disabled={updatingOrderId === order.id}
                            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>3. Handed to Student • Confirm Delivered & Collected ₹{order.total}</span>
                          </button>
                        )}
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
      {/* 2. COMPLETED DELIVERIES HISTORY */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {completedDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-500 shadow-xs">
              No completed deliveries yet.
            </div>
          ) : (
            <div className="space-y-3">
              {completedDeliveries.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">
                        {order.customerName} • {order.hostelRoom} ({order.hostelBlock})
                      </div>
                      <div className="text-stone-400 text-[11px]">
                        Order #{order.id.slice(-6).toUpperCase()} • Delivered at{' '}
                        {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-stone-900 text-sm">₹{order.total}</span>
                    <span className="block text-[10px] text-emerald-700 font-bold uppercase">Cash Received</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
