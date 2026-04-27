import { create } from 'zustand';
import { CartItem, Coupon } from '@/types/cart';

type CartState = {
  items: CartItem[];
  coupon: Coupon | null;
  addItem: (item: any, variant?: any, addons?: any[]) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  getDiscountAmount: () => number;
  getFinalPrice: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  coupon: null,
  addItem: (item, variant = null, addons = []) => {
    set((state) => {
      // Calculate final price per unit
      let finalPrice = variant ? variant.price : item.price;
      if (addons && addons.length > 0) {
        finalPrice += addons.reduce((sum: number, addon: any) => sum + addon.price, 0);
      }

      // Generate unique ID based on customization
      const variantId = variant ? variant.id : 'default';
      const addonIds = addons ? addons.map((a: any) => a.id).sort().join('_') : '';
      const cartId = `${item.id}_${variantId}_${addonIds}`;

      const existingItem = state.items.find((i) => i.id === cartId);

      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === cartId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }

      const itemKitchenId = item.kitchenId || item.kitchen_id;

      const newItem: CartItem = {
        id: cartId,
        menuItemId: item.id,
        name: item.name,
        price: finalPrice,
        quantity: 1,
        kitchenId: itemKitchenId,
        isVeg: item.isVeg,
        selectedVariant: variant,
        selectedAddons: addons,
      };

      return { items: [...state.items, newItem] };
    });
  },
  removeItem: (cartId) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === cartId);
      if (existingItem && existingItem.quantity > 1) {
        return {
          items: state.items.map((i) =>
            i.id === cartId ? { ...i, quantity: i.quantity - 1 } : i
          ),
        };
      }
      return { items: state.items.filter((i) => i.id !== cartId) };
    });
  },
  clearCart: () => set({ items: [] }),
  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  applyCoupon: (coupon) => set({ coupon }),
  removeCoupon: () => set({ coupon: null }),
  getDiscountAmount: () => {
    const { coupon, getTotalPrice } = get();
    const total = getTotalPrice();
    
    if (!coupon) return 0;
    if (total < coupon.min_order_value) return 0;

    let discount = 0;
    if (coupon.discount_type === 'FLAT') {
      discount = coupon.discount_value;
    } else {
      discount = (total * coupon.discount_value) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    }
    return Math.floor(discount);
  },
  getFinalPrice: () => {
    const total = get().getTotalPrice();
    const discount = get().getDiscountAmount();
    return Math.max(0, total - discount);
  },
}));
