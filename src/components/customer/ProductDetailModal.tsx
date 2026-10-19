import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const currentInCart = items.find((i) => i.product.id === product.id)?.quantity || 0;
  const isOutOfStock = !product.isAvailable || product.stock <= 0;
  const maxAddable = Math.max(0, product.stock - currentInCart);

  const handleIncrement = () => {
    if (quantity < maxAddable) {
      setQuantity((q) => q + 1);
      setErrorMsg(null);
    } else {
      setErrorMsg(`Cannot add more than ${product.stock} units (already ${currentInCart} in cart).`);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
      setErrorMsg(null);
    }
  };

  const handleAdd = () => {
    const res = addToCart(product, quantity);
    if (!res.success) {
      setErrorMsg(res.message || 'Cannot add to cart');
    } else {
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Product Image */}
        <div className="relative aspect-video sm:aspect-4/3 w-full bg-stone-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-semibold backdrop-blur-md">
              {product.category}
            </span>
            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                Out of Stock
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
                In Stock ({product.stock})
              </span>
            )}
          </div>
        </div>

        {/* Info & Purchase */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
              {product.name}
            </h2>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-red-600">
                ₹{product.price}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                inclusive of all taxes
              </span>
            </div>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            {product.description}
          </p>

          {currentInCart > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              <span>You currently have {currentInCart} unit(s) of this item in your cart.</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quantity Controls & Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center justify-center gap-3 bg-stone-100 p-2 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold text-stone-500 uppercase px-2">Qty</span>
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-stone-700 font-bold hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-black text-base text-stone-900">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= maxAddable || isOutOfStock}
                className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-stone-700 font-bold hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock || maxAddable <= 0}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                addedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : isOutOfStock || maxAddable <= 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white shadow-red-600/30'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-5 h-5" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Add for ₹{product.price * quantity}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
