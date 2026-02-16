import { create } from 'zustand';
import { Address } from '@/types/address';

type AddressState = {
  selectedAddress: Address | null;
  currentLocation: { latitude: number; longitude: number } | null;
  isServiceable: boolean;
  setSelectedAddress: (address: Address | null) => void;
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void;
  setIsServiceable: (serviceable: boolean) => void;
};

export const useAddressStore = create<AddressState>((set) => ({
  selectedAddress: null,
  currentLocation: null,
  isServiceable: true,
  setSelectedAddress: (address) => set({ selectedAddress: address }),
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setIsServiceable: (serviceable) => set({ isServiceable: serviceable }),
}));
