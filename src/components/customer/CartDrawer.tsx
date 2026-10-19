import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user } = useAuth();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900">Your Shopping Cart</h2>
                <p className="text-xs text-stone-500">{items.length} unique item(s)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="p-5 overflow-y-auto flex-1 space-y-3 divide-y divide-stone-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-red-50 text-red-400 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 stroke-1" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-800">Your cart is empty</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    Explore our hostel store and add your favorite midnight noodles, snacks, or drinks!
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-colors"
                >
                  Browse Store
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 bg-stone-50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-stone-500 font-semibold mt-0.5">
                      ₹{item.product.price} each
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-stone-200 text-stone-600 rounded-l-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-black text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1, item.product.stock)
                          }
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 hover:bg-stone-200 text-stone-600 rounded-r-lg disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-black text-stone-900">
                      ₹{item.product.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
              {/* Delivery Free Banner */}
              {subtotal < 200 ? (
                <div className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span>Add ₹{200 - subtotal} more for FREE room delivery!</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
              ) : (
                <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free Hostel Room Delivery Applied!</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-stone-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Hostel Delivery Fee</span>
                  <span className="font-bold text-stone-800">
                    {deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-stone-900 font-black text-base">
                  <span>Grand Total</span>
                  <span className="text-red-600">₹{total}</span>
                </div>
              </div>

              {/* Room target reminder */}
              <div className="text-[11px] text-stone-500 font-medium">
                Delivering to: <span className="font-bold text-stone-800">{user?.hostelBlock} {user?.roomNumber}</span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
