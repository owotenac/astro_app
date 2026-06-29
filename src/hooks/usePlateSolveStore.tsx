import { create } from 'zustand';

export type Calibration = {
    ra: number;
    dec: number;
    orientation: number;
    pixscale: number;
    radius: number;
    parity: number;
};

export type CameraDimensions = {
    xsize: number;
    ysize: number;
};

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
