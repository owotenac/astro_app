import { CelestialObject } from '@/model/celestialobject';
import { create } from 'zustand';

type MountPosition = {
    az: number;
    alt: number;
} | null;

type TargetPosition = {
    az: number;
    alt: number;
    name: string;
} | null;

type MountStore = {
    mountPosition: MountPosition;
    setMountPosition: (position: MountPosition) => void;
    clearMountPosition: () => void;
    slewMode: boolean;
    setSlewMode: (active: boolean) => void;
    targetPosition: TargetPosition;
    setTargetPosition: (position: TargetPosition) => void;
    clearTargetPosition: () => void;
    selectedObject: CelestialObject | null;
    setSelectedObject: (object: CelestialObject | null) => void;
}

export const useMountStore = create<MountStore>((set) => ({
    mountPosition: null,
    setMountPosition: (position: MountPosition) => set({ mountPosition: position }),
    clearMountPosition: () => set({ mountPosition: null }),
    slewMode: false,
    setSlewMode: (active: boolean) => set({ slewMode: active }),
    targetPosition: null,
    setTargetPosition: (position: TargetPosition) => set({ targetPosition: position, slewMode: false }),
    clearTargetPosition: () => set({ targetPosition: null }),
    selectedObject: null,
    setSelectedObject: (object: CelestialObject | null) => set({ selectedObject: object }),
}));
