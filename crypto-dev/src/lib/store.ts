"use client";

import { create } from "zustand";

/* ─── Wallet Store ─── */

interface WalletState {
  address: string | null;
  ensName: string | null;
  chainId: number;
  connected: boolean;
  connect: (address?: string) => void;
  disconnect: () => void;
  setChain: (id: number) => void;
}

const DEMO_WALLETS = [
  "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
];

export const useWallet = create<WalletState>((set) => ({
  address: null,
  ensName: null,
  chainId: 1,
  connected: false,
  connect: (addr) =>
    set({
      address: addr ?? DEMO_WALLETS[Math.floor(Math.random() * DEMO_WALLETS.length)],
      ensName: "dev.eth",
      connected: true,
    }),
  disconnect: () =>
    set({ address: null, ensName: null, connected: false }),
  setChain: (id) => set({ chainId: id }),
}));

/* ─── UI Store ─── */

interface UIState {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  theme: "dark" | "light";
  toggleSidebar: () => void;
  toggleSearch: () => void;
  toggleTheme: () => void;
}

export const useUI = create<UIState>((set) => ({
  sidebarCollapsed: false,
  searchOpen: false,
  theme: "dark",
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
}));

/* ─── Mobile Sidebar Store ─── */

interface MobileSidebarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

export const useMobileSidebar = create<MobileSidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
}));

/* ─── Chains ─── */

export const CHAINS: Record<number, { name: string; symbol: string; color: string }> = {
  1: { name: "Ethereum", symbol: "ETH", color: "#627eea" },
  137: { name: "Polygon", symbol: "MATIC", color: "#8247e5" },
  42161: { name: "Arbitrum", symbol: "ETH", color: "#28a0f0" },
  10: { name: "Optimism", symbol: "ETH", color: "#ff0420" },
  8453: { name: "Base", symbol: "ETH", color: "#0052ff" },
  43114: { name: "Avalanche", symbol: "AVAX", color: "#e84142" },
  56: { name: "BSC", symbol: "BNB", color: "#f0b90b" },
};
