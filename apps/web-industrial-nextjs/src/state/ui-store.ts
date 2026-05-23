import { create } from "zustand";

interface IndustrialUiState {
  selectedPoleId: string | null;
  setPole: (id: string | null) => void;
}

export const useIndustrialUiStore = create<IndustrialUiState>((set) => ({
  selectedPoleId: null,
  setPole: (id) => set({ selectedPoleId: id }),
}));
