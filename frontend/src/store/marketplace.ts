"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DemoListing,
  DemoOrder,
  DemoNotification,
  DemoTransaction,
  demoListings,
  demoOrders,
  demoNotifications,
  demoTransactions,
  generateOrderId,
} from "@/lib/demoData";

export interface CartItem {
  listing_id: string;
  quantity_kg: number;
}

interface MarketplaceState {
  listings: DemoListing[];
  orders: DemoOrder[];
  notifications: DemoNotification[];
  transactions: DemoTransaction[];
  cart: CartItem[];
  favorites: string[];

  // Listings
  addListing: (listing: Omit<DemoListing, "id" | "created_at" | "is_active" | "seller_name" | "seller_id"> & { seller_id: string; seller_name: string }) => void;
  updateListing: (id: string, updates: Partial<DemoListing>) => void;
  deleteListing: (id: string) => void;
  toggleListingActive: (id: string) => void;

  // Orders
  placeOrder: (buyer: { id: string; name: string; phone: string }, deliveryAddress: string) => DemoOrder | null;
  updateOrderStatus: (orderId: string, status: string) => void;

  // Cart
  addToCart: (listingId: string, quantity: number) => void;
  updateCartQuantity: (listingId: string, quantity: number) => void;
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;

  // Favorites
  toggleFavorite: (listingId: string) => void;

  // Notifications
  addNotification: (userId: string, message: string, type: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      listings: demoListings,
      orders: demoOrders,
      notifications: demoNotifications,
      transactions: demoTransactions,
      cart: [],
      favorites: ["listing-9", "listing-1"],

      addListing: (listing) => {
        const newListing: DemoListing = {
          ...listing,
          id: `listing-${Date.now()}`,
          created_at: new Date().toISOString(),
          is_active: true,
        };
        set((state) => ({ listings: [newListing, ...state.listings] }));
        // Notify the farmer that their listing was published
        get().addNotification(
          listing.seller_id,
          `Your product listing '${listing.crop_name}' was published`,
          "listing"
        );
      },

      updateListing: (id, updates) => {
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));
      },

      deleteListing: (id) => {
        set((state) => ({
          listings: state.listings.filter((l) => l.id !== id),
        }));
      },

      toggleListingActive: (id) => {
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === id ? { ...l, is_active: !l.is_active } : l
          ),
        }));
      },

      placeOrder: (buyer, deliveryAddress) => {
        const { cart, listings } = get();
        if (cart.length === 0) return null;

        const items = cart
          .map((ci) => {
            const listing = listings.find((l) => l.id === ci.listing_id);
            if (!listing) return null;
            return {
              listing_id: listing.id,
              crop_name: listing.crop_name,
              seller_id: listing.seller_id,
              seller_name: listing.seller_name,
              quantity_kg: ci.quantity_kg,
              price_per_kg: listing.price_per_kg,
              image: listing.images[0],
            };
          })
          .filter(Boolean) as DemoOrder["items"];

        if (items.length === 0) return null;

        const total = items.reduce(
          (sum, it) => sum + it.quantity_kg * it.price_per_kg,
          0
        );

        const order: DemoOrder = {
          id: generateOrderId(),
          buyer_id: buyer.id,
          buyer_name: buyer.name,
          buyer_phone: buyer.phone,
          items,
          total_amount: total,
          delivery_address: deliveryAddress,
          status: "pending",
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          orders: [order, ...state.orders],
          cart: [],
        }));

        // Notify the farmer(s) about the new order
        const sellerIds = new Set(items.map((it) => it.seller_id));
        sellerIds.forEach((sid) => {
          get().addNotification(
            sid,
            `New order #${order.id} has been placed by ${buyer.name}`,
            "order"
          );
        });

        // Add a pending transaction for the farmer
        const farmerId = items[0].seller_id;
        set((state) => ({
          transactions: [
            {
              id: `txn-${Date.now()}`,
              farmer_id: farmerId,
              order_id: order.id,
              amount: total,
              status: "pending",
              created_at: new Date().toISOString(),
              description: `Payment pending for Order ${order.id}`,
            },
            ...state.transactions,
          ],
        }));

        return order;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }));

        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;

        // Notify the buyer when status changes
        const statusMessages: Record<string, string> = {
          confirmed: `Your order #${orderId} has been confirmed`,
          processing: `Your order #${orderId} is being processed`,
          shipped: `Your order #${orderId} has been shipped`,
          delivered: `Your order #${orderId} has been delivered`,
        };
        if (statusMessages[status]) {
          get().addNotification(
            order.buyer_id,
            statusMessages[status],
            "order"
          );
        }

        // Update transaction status when delivered
        if (status === "delivered") {
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.order_id === orderId ? { ...t, status: "completed" } : t
            ),
          }));
        }
      },

      addToCart: (listingId, quantity) => {
        set((state) => {
          const existing = state.cart.find((c) => c.listing_id === listingId);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.listing_id === listingId
                  ? { ...c, quantity_kg: c.quantity_kg + quantity }
                  : c
              ),
            };
          }
          return { cart: [...state.cart, { listing_id: listingId, quantity_kg: quantity }] };
        });
      },

      updateCartQuantity: (listingId, quantity) => {
        set((state) => ({
          cart: state.cart.map((c) =>
            c.listing_id === listingId ? { ...c, quantity_kg: quantity } : c
          ),
        }));
      },

      removeFromCart: (listingId) => {
        set((state) => ({
          cart: state.cart.filter((c) => c.listing_id !== listingId),
        }));
      },

      clearCart: () => set({ cart: [] }),

      toggleFavorite: (listingId) => {
        set((state) => ({
          favorites: state.favorites.includes(listingId)
            ? state.favorites.filter((f) => f !== listingId)
            : [...state.favorites, listingId],
        }));
      },

      addNotification: (userId, message, type) => {
        set((state) => ({
          notifications: [
            {
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              user_id: userId,
              message,
              type,
              read: false,
              created_at: new Date().toISOString(),
            },
            ...state.notifications,
          ],
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsRead: (userId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.user_id === userId ? { ...n, read: true } : n
          ),
        }));
      },
    }),
    {
      name: "bf-marketplace",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
