import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  material_id: number;
  title: string;
  price: number;
  sale_price: number | null;
  unit: string;
  image_url: string | null;
  shop_id: number;
  shop_name: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  shopId: number | null;
  shopName: string | null;
  addItem:    (item: Omit<CartItem, 'quantity'> & { shop_id: number; shop_name: string }) => string | null;
  removeItem: (material_id: number) => void;
  updateQty:  (material_id: number, qty: number) => void;
  clear:      () => void;
  restore:    () => Promise<void>;
  total:      () => number;
  count:      () => number;
}

const STORAGE_KEY = 'shop_cart_v1';

export const useCartStore = create<CartState>((set, get) => ({
  items:    [],
  shopId:   null,
  shopName: null,

  addItem: (item) => {
    const { items, shopId } = get();
    // Корзина только из одного магазина
    if (shopId && shopId !== item.shop_id) {
      return `В корзине уже есть товары из магазина «${get().shopName}». Очистите корзину.`;
    }
    const existing = items.find((i) => i.material_id === item.material_id);
    const newItems = existing
      ? items.map((i) => i.material_id === item.material_id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...items, { ...item, quantity: 1 }];
    set({ items: newItems, shopId: item.shop_id, shopName: item.shop_name });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items: newItems, shopId: item.shop_id, shopName: item.shop_name }));
    return null;
  },

  removeItem: (material_id) => {
    const newItems = get().items.filter((i) => i.material_id !== material_id);
    const shopId   = newItems.length ? get().shopId : null;
    const shopName = newItems.length ? get().shopName : null;
    set({ items: newItems, shopId, shopName });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items: newItems, shopId, shopName }));
  },

  updateQty: (material_id, qty) => {
    if (qty <= 0) { get().removeItem(material_id); return; }
    const newItems = get().items.map((i) => i.material_id === material_id ? { ...i, quantity: qty } : i);
    set({ items: newItems });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ items: newItems, shopId: get().shopId, shopName: get().shopName }));
  },

  clear: () => {
    set({ items: [], shopId: null, shopName: null });
    AsyncStorage.removeItem(STORAGE_KEY);
  },

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({ items: saved.items ?? [], shopId: saved.shopId ?? null, shopName: saved.shopName ?? null });
      }
    } catch {}
  },

  total: () => get().items.reduce((sum, i) => sum + (i.sale_price ?? i.price) * i.quantity, 0),
  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
