import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  status?: 'normal' | 'in_production';
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0 && product.status !== 'in_production') {
      toast.error('Este producto está agotado por el momento');
      return;
    }

    setItems((currentLayout) => {
      const existing = currentLayout.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock && product.status !== 'in_production') {
           toast.error('No hay suficiente stock disponible');
           return currentLayout;
        }
        return currentLayout.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentLayout, { ...product, quantity: 1 }];
    });
    // Let's separate toast based on status
    if (product.status === 'in_production') {
      toast.success(`${product.name} (Lote en Producción) añadido`);
    } else {
      toast.success(`${product.name} añadido al carrito`);
    }
  };

  const removeFromCart = (productId: string) => {
    setItems((current) => current.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems((current) => current.map(item => {
      if (item.id === productId) {
        if (quantity > item.stock && item.status !== 'in_production') {
           toast.error('No hay suficiente stock disponible');
           return { ...item, quantity: item.stock };
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
