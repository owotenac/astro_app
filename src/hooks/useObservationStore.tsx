import { create } from 'zustand';

type ObservationStore = {
    targetDate: Date | null;
    setTargetDate: (date: Date) => void;
    initTargetDate: () => void;
}

export const useObservationStore = create<ObservationStore>((set, get) => ({
    targetDate: null,
    setTargetDate: (date: Date) => set({ targetDate: date }),
    initTargetDate: () => {
        if (get().targetDate === null) {
            set({ targetDate: new Date() });
        }
    },
}));
