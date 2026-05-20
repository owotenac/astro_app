import { create } from 'zustand'

type CurrentFilter = {
    magMin: number;
    magMax: number;
    types: string[];
}

type FilterStore = {
    currentFilter: CurrentFilter;
    setFilter: (filter: CurrentFilter) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
    currentFilter: {
        magMin: 0,
        magMax: 15,
        types: [],
    },
    setFilter: (filter: CurrentFilter) => set({ currentFilter: filter }),
}))