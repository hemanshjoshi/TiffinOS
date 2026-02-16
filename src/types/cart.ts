export type CartItem = {
  id: string; // Unique Cart ID (e.g. itemID_variantID)
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  kitchenId: string;
  isVeg: boolean;
  selectedVariant?: { id: string; name: string; price: number };
  selectedAddons?: { id: string; name: string; price: number }[];
};

export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FLAT';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
};
