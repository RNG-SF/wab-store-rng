import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: number;
  packageId?: number;
  productTitle: string;
  packageName?: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  duration?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (productId: number, packageId?: number) => void;
  updateQuantity: (productId: number, packageId: number | undefined, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('rng_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('rng_cart', JSON.stringify(items));
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === newItem.productId && i.packageId === newItem.packageId
      );

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex].quantity += qty;
        return copy;
      }
      return [...prev, { ...newItem, quantity: qty }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId: number, packageId?: number) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.packageId === packageId)));
  };

  const updateQuantity = (productId: number, packageId: number | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, packageId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.packageId === packageId) {
          return { ...i, quantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
