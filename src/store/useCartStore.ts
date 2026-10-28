/**
 * Estado Global Persistente del Carrito de Compras (`src/store/useCartStore.ts`).
 * Replica en el Frontend la misma regla financiera de precios por volumen del Backend:
 * Si `quantity >= product.wholesale_min_qty` y existe `product.wholesale_price`,
 * activa automáticamente el precio de mayoreo en tiempo real.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

export const TAX_RATE = 0.16;
export const FREE_SHIPPING_THRESHOLD = 2000.0;
export const STANDARD_SHIPPING_COST = 180.0;

/**
 * Función pura que calcula qué precio unitario corresponde según la cantidad en el carrito.
 */
export function resolveEffectivePrice(
  product: Product,
  quantity: number
): { unitPrice: number; isWholesale: boolean } {
  if (
    product.wholesale_price != null &&
    product.wholesale_min_qty != null &&
    quantity >= product.wholesale_min_qty
  ) {
    return {
      unitPrice: product.wholesale_price,
      isWholesale: true,
    };
  }
  return {
    unitPrice: product.price,
    isWholesale: false,
  };
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getTotalUnits: () => number;
  getFinancialSummary: () => {
    subtotal: number;
    taxAmount: number;
    shippingCost: number;
    totalAmount: number;
    totalSavings: number;
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.product.id === product.id
        );

        if (existingIndex > -1) {
          const updated = [...currentItems];
          const nextQty = Math.min(
            updated[existingIndex].quantity + quantity,
            product.stock
          );
          updated[existingIndex] = {
            product,
            quantity: Math.max(1, nextQty),
          };
          set({ items: updated });
        } else {
          set({
            items: [
              ...currentItems,
              {
                product,
                quantity: Math.min(Math.max(1, quantity), product.stock || 1),
              },
            ],
          });
        }
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity: Math.min(quantity, item.product.stock),
                }
              : item
          ),
        });
      },

      removeItem: (productId: number) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalUnits: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),

      getFinancialSummary: () => {
        let subtotal = 0;
        let totalSavings = 0;

        for (const item of get().items) {
          const { unitPrice, isWholesale } = resolveEffectivePrice(
            item.product,
            item.quantity
          );
          subtotal += unitPrice * item.quantity;
          if (isWholesale) {
            totalSavings += (item.product.price - unitPrice) * item.quantity;
          }
        }

        subtotal = Number(subtotal.toFixed(2));
        totalSavings = Number(totalSavings.toFixed(2));
        const taxAmount = Number((subtotal * TAX_RATE).toFixed(2));
        const shippingCost =
          subtotal === 0
            ? 0
            : subtotal >= FREE_SHIPPING_THRESHOLD
            ? 0
            : STANDARD_SHIPPING_COST;
        const totalAmount = Number(
          (subtotal + taxAmount + shippingCost).toFixed(2)
        );

        return {
          subtotal,
          taxAmount,
          shippingCost,
          totalAmount,
          totalSavings,
        };
      },
    }),
    {
      name: "odontomarket-cart-storage",
    }
  )
);
