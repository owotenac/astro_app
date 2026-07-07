import { Annotation, Calibration, CameraDimensions } from '@/model/platesolve_types';
import { create } from 'zustand';

type PlateSolveResult = {
    calibration: Calibration;
    annotations: Annotation[];
    imageUri: string;
};

type PlateSolveStore = {
    lastResult: PlateSolveResult | null;
    cameraDimensions: CameraDimensions | null;
    setLastResult: (result: PlateSolveResult) => void;
    setCameraDimensions: (dim: CameraDimensions) => void;
    clearPlateSolve: () => void;
};

export const usePlateSolveStore = create<PlateSolveStore>((set) => ({
    lastResult: null,
    cameraDimensions: null,
    setLastResult: (result: PlateSolveResult) => set({ lastResult: result }),
    setCameraDimensions: (dim: CameraDimensions) => set({ cameraDimensions: dim }),
    clearPlateSolve: () => set({ lastResult: null }),
}));
