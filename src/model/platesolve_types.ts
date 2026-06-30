
export type Calibration = {
    ra: number;
    dec: number;
    orientation: number;
    pixscale: number;
    radius: number;
    parity: number;
};

export type Annotation = {
    type: string;
    names: string[];
    pixelx: number;
    pixely: number;
    radius: number;
};

export type CameraDimensions = {
    xsize: number;
    ysize: number;
}