import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShortlistedFund = {
  schemeCode: number;
  name: string;
};

interface ShortlistState {
  shortlist: ShortlistedFund[];
  addFund: (fund: ShortlistedFund) => void;
  removeFund: (schemeCode: number) => void;
  isShortlisted: (schemeCode: number) => boolean;
  clearShortlist: () => void;
}

export const useShortlistStore = create<ShortlistState>()(
  persist(
    (set, get) => ({
      shortlist: [],
      addFund: (fund) => {
        const current = get().shortlist;
        if (!current.some((f) => f.schemeCode === fund.schemeCode)) {
          set({ shortlist: [...current, fund] });
        }
      },
      removeFund: (schemeCode) => {
        set({
          shortlist: get().shortlist.filter((f) => f.schemeCode !== schemeCode),
        });
      },
      isShortlisted: (schemeCode) => {
        return get().shortlist.some((f) => f.schemeCode === schemeCode);
      },
      clearShortlist: () => {
        set({ shortlist: [] });
      },
    }),
    {
      name: 'fincurate-shortlist-storage',
    }
  )
);
