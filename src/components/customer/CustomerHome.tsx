import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';
import { Product, ProductCategory } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/images/ravindra_pro_logo_1792394034899.jpg';

interface CustomerHomeProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

const CATEGORIES: ProductCategory[] = [
  'All',
  'Instant Meals & Noodles',
  'Snacks & Munchies',
  'Beverages & Drinks',
  'Study & Stationery',
  'Toiletries & Hygiene',
  'Hostel Essentials',
];

export const CustomerHome: React.FC<CustomerHomeProps> = ({ products, onSelectProduct }) => {
  const { user } = useAuth();
  const { addToCart, items, setIsCartOpen } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; text: string } | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const res = addToCart(product, 1);
    if (!res.success) {
      setFeedbackMessage({ id: product.id, text: res.message || 'Cannot add item' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      setFeedbackMessage({ id: product.id, text: 'Added to cart!' });
      setTimeout(() => setFeedbackMessage(null), 1800);
    }
  };

  const getItemCountInCart = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Announcement Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 text-white shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none flex items-center justify-end pr-8">
          <img
            src={logoImage}
            alt=""
            className="w-80 h-80 object-contain rounded-full"
          />
        </div>
        <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-stone-900 text-xs font-black tracking-wider uppercase shadow-xs mb-3">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Hostel Room Express Delivery
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Order Midnight Snacks, Stationery & Daily Essentials
          </h1>
          <p className="mt-2 text-red-100 text-sm sm:text-base leading-relaxed">
            Delivering right to <span className="font-bold underline text-amber-200">{user?.hostelBlock || 'Hostel'} {user?.roomNumber || ''}</span>. Pay cash on delivery!
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('Instant Meals & Noodles')}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white transition-all flex items-center gap-1.5"
            >
              🍜 Maggi & Noodles
            </button>
            <button
              onClick={() => setSelectedCategory('Beverages & Drinks')}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white transition-all flex items-center gap-1.5"
            >
              ⚡ Energy Drinks & Coffee
            </button>
            <button
              onClick={() => setSelectedCategory('Study & Stationery')}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white transition-all flex items-center gap-1.5"
            >
              📓 Pens & Notebooks
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search noodles, chips, pens, coffee, toiletries..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm shadow-xs placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 p-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Cart Trigger on Mobile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="sm:hidden flex-1 py-3 px-4 rounded-2xl bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              View Cart
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count =
              cat === 'All'
                ? products.length
                : products.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 ring-2 ring-red-600'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-red-300 hover:bg-stone-50'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/30 text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-800">No products found</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category from above.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map((product) => {
            const inCart = getItemCountInCart(product.id);
            const isOutOfStock = !product.isAvailable || product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 5;
            const hasFeedback = feedbackMessage?.id === product.id;

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group bg-white rounded-2xl border border-stone-200 hover:border-red-400/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* Product Image & Badges */}
                <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Stock Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded-md bg-stone-900/85 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        Only {product.stock} left
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        In Stock ({product.stock})
                      </span>
                    )}
                  </div>

                  {inCart > 0 && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {inCart} in cart
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-stone-500 text-xs line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Feedback Tooltip if click triggered warning */}
                  {hasFeedback && (
                    <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      {feedbackMessage.text}
                    </div>
                  )}

                  {/* Price & Add to Cart button */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                        Price
                      </span>
                      <span className="text-base sm:text-lg font-black text-stone-900">
                        ₹{product.price}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={isOutOfStock}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                        isOutOfStock
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add to Cart</span>
                      <span className="sm:hidden">Add</span>
                    </button>
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
