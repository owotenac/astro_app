import { create } from 'zustand';

type MountPosition = {
    az: number;
    alt: number;
} | null;

type MountStore = {
    mountPosition: MountPosition;
    setMountPosition: (position: MountPosition) => void;
    clearMountPosition: () => void;
}

export const useMountStore = create<MountStore>((set) => ({
    mountPosition: null,
    setMountPosition: (position: MountPosition) => set({ mountPosition: position }),
    clearMountPosition: () => set({ mountPosition: null }),
}));
