import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('rp_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('rp_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1): { success: boolean; message?: string } => {
    if (!product.isAvailable || product.stock <= 0) {
      return { success: false, message: 'Sorry, this product is currently out of stock.' };
    }

    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;

    if (requestedTotal > product.stock) {
      return {
        success: false,
        message: `Only ${product.stock} units available in stock. You already have ${currentQtyInCart} in your cart.`,
      };
    }

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity = requestedTotal;
      setItems(updated);
    } else {
      setItems([...items, { product, quantity }]);
    }

    return { success: true };
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    maxStock?: number
  ): { success: boolean; message?: string } => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const targetItem = items.find((i) => i.product.id === productId);
    const stockLimit = maxStock !== undefined ? maxStock : targetItem?.product.stock || 999;

    if (quantity > stockLimit) {
      return {
        success: false,
        message: `Cannot exceed available inventory limit of ${stockLimit} units.`,
      };
    }

    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Free delivery for orders above ₹199, else standard ₹15 delivery charge for hostel room service
  const deliveryFee = subtotal > 199 || subtotal === 0 ? 0 : 15;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        total,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
