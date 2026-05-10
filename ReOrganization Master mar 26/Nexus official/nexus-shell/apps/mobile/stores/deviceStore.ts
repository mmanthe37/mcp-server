import { create } from 'zustand';
import type { DeviceRecord, MachineRecord, PairingRecord } from '@nexus-shell/shared-types';

export interface DeviceState {
  devices: DeviceRecord[];
  machines: MachineRecord[];
  pairings: PairingRecord[];
  currentDeviceId: string | null;
  isLoading: boolean;
  error: string | null;

  setCurrentDeviceId: (id: string) => void;
  setDevices: (devices: DeviceRecord[]) => void;
  addDevice: (device: DeviceRecord) => void;
  removeDevice: (id: string) => void;
  setMachines: (machines: MachineRecord[]) => void;
  updateMachine: (id: string, patch: Partial<MachineRecord>) => void;
  setPairings: (pairings: PairingRecord[]) => void;
  addPairing: (pairing: PairingRecord) => void;
  revokePairing: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDeviceStore = create<DeviceState>()((set) => ({
  devices: [],
  machines: [],
  pairings: [],
  currentDeviceId: null,
  isLoading: false,
  error: null,

  setCurrentDeviceId: (id) => set({ currentDeviceId: id }),
  setDevices: (devices) => set({ devices, error: null }),
  addDevice: (device) =>
    set((state) => ({ devices: [...state.devices, device] })),
  removeDevice: (id) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
    })),

  setMachines: (machines) => set({ machines }),
  updateMachine: (id, patch) =>
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    })),

  setPairings: (pairings) => set({ pairings }),
  addPairing: (pairing) =>
    set((state) => ({ pairings: [...state.pairings, pairing] })),
  revokePairing: (id) =>
    set((state) => ({
      pairings: state.pairings.map((p) =>
        p.id === id ? { ...p, revokedAt: new Date().toISOString() } : p,
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
