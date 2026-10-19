import React, { useState } from 'react';
import {
  CheckCircle2,
  Share2,
  ExternalLink,
  MapPin,
  Clock,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
} from 'lucide-react';
import { Order } from '../../types';
import { generateStudentOrderWhatsAppMessage, getWhatsAppUrl } from '../../utils/whatsapp';

interface OrderConfirmationModalProps {
  order: Order | null;
  ownerWhatsApp: string;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  ownerWhatsApp,
  onClose,
  onTrackOrder,
}) => {
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const whatsappMessage = generateStudentOrderWhatsAppMessage(order, 'Ravindra Pro Ordering App');
  const whatsappUrl = getWhatsAppUrl(ownerWhatsApp || '+91 99887 76655', whatsappMessage);

  const handleOpenWhatsApp = () => {
    setHasOpenedWhatsApp(true);
    window.open(whatsappUrl, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-amber-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-white/30">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Order Placed Successfully!</h2>
          <p className="text-emerald-100 text-xs mt-1">
            Order <span className="font-mono font-bold text-white">#{order.id.slice(-8).toUpperCase()}</span> has been recorded
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* WhatsApp Notification Action Card (Mandatory Requirement) */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-emerald-950 text-sm">
                  Send Order to Shop Owner via WhatsApp
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Tap the button below to open WhatsApp with your pre-filled order receipt and tap <strong>Send</strong> to notify the Shop Owner instantly.
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Open in WhatsApp & Send</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="py-3 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs hover:bg-emerald-100/60 transition-colors flex items-center justify-center gap-1.5"
                title="Copy message text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {hasOpenedWhatsApp ? (
              <p className="text-[11px] text-emerald-700 font-semibold bg-white/80 p-2 rounded-lg border border-emerald-200 text-center">
                ✓ WhatsApp link opened. Please ensure you clicked <strong>Send</strong> in WhatsApp.
              </p>
            ) : (
              <p className="text-[11px] text-stone-500 italic text-center">
                Note: The Shop Owner will only receive the message after you tap Send in WhatsApp.
              </p>
            )}
          </div>

          {/* Delivery Room & Details */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-stone-500 font-bold uppercase tracking-wider text-[10px]">
              <span>Delivery Destination</span>
              <span>Payment on Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>{order.hostelBlock} • {order.hostelRoom}</span>
            </div>
            <div className="text-stone-600 text-xs">
              Recipient: <strong className="text-stone-900">{order.customerName}</strong> ({order.customerPhone})
            </div>
            {order.instructions && (
              <div className="text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 text-[11px]">
                Note: {order.instructions}
              </div>
            )}
          </div>

          {/* Items Summary */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Items Ordered ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
            </span>
            <div className="divide-y divide-stone-100 border border-stone-100 rounded-2xl p-3 bg-stone-50/50">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <span className="text-stone-800">
                    {item.quantity}x <strong className="font-semibold">{item.name}</strong>
                  </span>
                  <span className="font-mono text-stone-900 font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-stone-200 flex items-center justify-between text-xs font-black text-stone-900">
                <span>Total Amount Due (COD):</span>
                <span className="text-red-600 text-sm">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onTrackOrder(order.id);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <span>Track Live Order Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-4 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-bold hover:bg-stone-100 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
