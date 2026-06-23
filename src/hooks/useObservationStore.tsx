import { create } from 'zustand';

type ObservationStore = {
    targetDate: Date;
    setTargetDate: (date: Date) => void;
}

export const useObservationStore = create<ObservationStore>((set) => ({
    targetDate: new Date(),
    setTargetDate: (date: Date) => set({ targetDate: date }),
}));
