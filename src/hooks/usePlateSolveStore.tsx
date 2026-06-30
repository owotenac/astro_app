import { Calibration, CameraDimensions } from '@/model/platesolve_types';
import { create } from 'zustand';

type PlateSolveStore = {
    calibration: Calibration | null;
    cameraDimensions: CameraDimensions | null;
    setCalibration: (cal: Calibration) => void;
    setCameraDimensions: (dim: CameraDimensions) => void;
    clearPlateSolve: () => void;
};

export const usePlateSolveStore = create<PlateSolveStore>((set) => ({
    calibration: null,
    cameraDimensions: null,
    setCalibration: (cal: Calibration) => set({ calibration: cal }),
    setCameraDimensions: (dim: CameraDimensions) => set({ cameraDimensions: dim }),
    clearPlateSolve: () => set({ calibration: null }),
}));
