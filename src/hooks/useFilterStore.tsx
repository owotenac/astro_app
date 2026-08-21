import { create } from 'zustand';

export type CurrentFilter = {
    magMin: number;
    magMax: number;
    altMin: number;
    altMax: number;
    types: string[];
}

type FilterStore = {
    currentFilter: CurrentFilter;
    setFilter: (filter: CurrentFilter) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
    currentFilter: {
        magMin: 0,
        magMax: 8,
        altMin: 10,
        altMax: 80,
        types: [],
    },
    setFilter: (filter: CurrentFilter) => set({ currentFilter: filter }),
}))


