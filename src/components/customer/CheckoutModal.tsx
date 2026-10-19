import React, { useState } from 'react';
import { X, CheckCircle2, MapPin, Phone, FileText, Banknote, Sparkles, AlertCircle, Share2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderItem } from '../../types';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../../firebase';
import { generateStudentOrderWhatsAppMessage, getWhatsAppUrl } from '../../utils/whatsapp';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  ownerWhatsApp?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  ownerWhatsApp = '+91 99887 76655',
}) => {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [hostelBlock, setHostelBlock] = useState(user?.hostelBlock || 'Block-B (Boys Hostel)');
  const [hostelRoom, setHostelRoom] = useState(user?.roomNumber || 'Room 314');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);

  if (!isOpen) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate orders when a student taps the order button multiple times
    if (isSubmitting) return;

    if (!hostelRoom.trim()) {
      setErrorMsg('Please specify your hostel room number.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const orderItems: OrderItem[] = items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        imageUrl: i.product.imageUrl || '',
      }));

      const newOrder: Order = {
        id: orderId,
        customerId: user?.id || 'guest-student',
        customerName: customerName || user?.displayName || 'Hostel Student',
        customerEmail: user?.email || 'student@hostel.edu',
        customerPhone: customerPhone || '+91 98765 43210',
        hostelBlock,
        hostelRoom,
        instructions: instructions.trim() || '',
        items: orderItems,
        subtotal,
        deliveryFee,
        total,
        status: 'pending',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Create order in Firestore (sanitized to remove any undefined values)
      try {
        await setDoc(doc(db, 'orders', orderId), sanitizeForFirestore(newOrder));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }

      // 2. Safely deduct inventory stock
      for (const item of items) {
        try {
          await updateDoc(doc(db, 'products', item.product.id), {
            stock: increment(-item.quantity),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Stock decrement note for product:', item.product.id, e);
        }
      }

      // Confetti celebratory feedback
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#eab308', '#ffffff'],
        });
      } catch {}

      clearCart();
      setPlacedOrder(newOrder);
      onOrderSuccess(newOrder);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchWhatsApp = () => {
    if (!placedOrder) return;
    const msg = generateStudentOrderWhatsAppMessage(placedOrder, 'Ravindra Pro Orders');
    const url = getWhatsAppUrl(ownerWhatsApp, msg);
    window.open(url, '_blank');
    setHasOpenedWhatsApp(true);
  };

  const handleCloseAndGoToOrders = () => {
    setPlacedOrder(null);
    setHasOpenedWhatsApp(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* If order has been placed, show WhatsApp Notification view */}
        {placedOrder ? (
          <div>
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Order Placed Successfully!</h2>
                  <p className="text-xs text-emerald-100 font-mono">
                    ID: #{placedOrder.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAndGoToOrders}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
              {/* WhatsApp Notification Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">
                      Send WhatsApp Order to Shop Owner
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      Tap below to open WhatsApp with your pre-filled order receipt for Shop Owner (<span className="font-bold">{ownerWhatsApp}</span>).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchWhatsApp}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Open & Send via WhatsApp</span>
                </button>

                <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200/60 text-[11px] text-emerald-900 leading-snug">
                  <span className="font-bold text-emerald-950">Important:</span> This opens WhatsApp with your full order details pre-filled. You must tap <span className="font-extrabold underline">Send</span> inside WhatsApp so the shop owner gets notified immediately.
                </div>

                {hasOpenedWhatsApp && (
                  <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>WhatsApp opened! Once you tap Send, the shop owner will begin preparing your items.</span>
                  </div>
                )}
              </div>

              {/* Order Details Receipt Breakdown */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="font-bold text-stone-600 uppercase text-[10px] tracking-wider">
                    Order Summary
                  </span>
                  <span className="font-mono text-stone-500">
                    {new Date(placedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1.5 text-stone-700">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Student Name:</span>
                    <span className="font-bold text-stone-900">{placedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Delivery Room:</span>
                    <span className="font-bold text-stone-900">{placedOrder.hostelBlock} • {placedOrder.hostelRoom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Contact Phone:</span>
                    <span className="font-mono font-bold text-stone-900">{placedOrder.customerPhone || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-200 pt-2 space-y-1">
                  <div className="font-bold text-stone-500 text-[10px] uppercase">Items:</div>
                  {placedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-mono font-semibold">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 pt-2 flex items-center justify-between text-stone-900 font-bold">
                  <span>Total Due (COD):</span>
                  <span className="text-sm font-black text-red-600">₹{placedOrder.total}</span>
                </div>
              </div>

              {/* Action Button: View My Orders */}
              <button
                type="button"
                onClick={handleCloseAndGoToOrders}
                className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>View Order Status in App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Standard Checkout Header */}
            <div className="bg-gradient-to-r from-red-600 to-amber-600 p-5 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight">Checkout & Delivery Details</h2>
                <p className="text-xs text-red-100">Hostel doorstep delivery by Ravindra Pro Express</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
        <form onSubmit={handlePlaceOrder} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Delivery Location Section */}
          <div className="space-y-3">
            <span className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-600" />
              Hostel Room & Contact
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Hostel Block / Wing *
                </label>
                <select
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-red-500"
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
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  value={hostelRoom}
                  onChange={(e) => setHostelRoom(e.target.value)}
                  placeholder="e.g. Room 314"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Receiver Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Please knock on door, or leave with roommate Vivek"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-normal focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" />
              Payment Method
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-stone-900">Cash on Delivery</span>
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      paymentMethod === 'cod' ? 'text-emerald-600' : 'text-stone-300'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-stone-500">Pay cash or UPI directly when package arrives</p>
              </div>

              <div
                onClick={() => alert('Online card/UPI gateway is queued for future release. Please choose Cash / UPI on Delivery for instant order fulfillment.')}
                className="p-3 rounded-2xl border border-stone-200 bg-stone-50 opacity-70 cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-600">Online Payment</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded">
                    Coming Soon
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">Card & NetBanking integration</p>
              </div>
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>Ordered Items ({items.reduce((a, b) => a + b.quantity, 0)})</span>
              <span className="text-stone-500">₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>Delivery Charge</span>
              <span>
                {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-black text-stone-900">
              <span>Total Payable on Delivery:</span>
              <span className="text-lg text-red-600">₹{total}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Confirming Order...'
            ) : (
              <>
                <span>Place Hostel Order • ₹{total} (COD)</span>
              </>
            )}
          </button>
        </form>
        </>
      )}
      </div>
    </div>
  );
};
