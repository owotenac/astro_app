import { Calibration, CameraDimensions } from '@/hooks/usePlateSolveStore';

const DEG2RAD = Math.PI / 180;

export type EquatorialPoint = {
    ra: number;
    dec: number;
};

/**
 * Calcule les 4 coins du champ de vision de la caméra en coordonnées équatoriales.
 *
 * @param calibration Résultat du plate solving (centre, orientation, échelle)
 * @param cameraDimensions Dimensions du capteur en pixels
 * @returns Les 4 coins dans l'ordre: NW, NE, SE, SW
 */
export function computeFovCorners(
    calibration: Calibration,
    cameraDimensions: CameraDimensions
): EquatorialPoint[] {
    const { ra, dec, orientation, pixscale, parity } = calibration;
    const { xsize, ysize } = cameraDimensions;

    // Champ de vision en degrés
    const fovX = (xsize * pixscale) / 3600;
    const fovY = (ysize * pixscale) / 3600;

    // Demi-dimensions
    const halfX = fovX / 2;
    const halfY = fovY / 2;

    // 4 coins en offset (avant rotation), dans le repère capteur
    // X positif = vers l'Est, Y positif = vers le Nord
    const corners = [
        { dx: -halfX, dy: +halfY }, // NW
        { dx: +halfX, dy: +halfY }, // NE
        { dx: +halfX, dy: -halfY }, // SE
        { dx: -halfX, dy: -halfY }, // SW
    ];

    // Appliquer le parity (flip horizontal si -1)
    const parityFactor = parity === -1 ? -1 : 1;

    // Rotation de l'orientation (en radians)
    const theta = orientation * DEG2RAD;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    // Correction pour la convergence des méridiens
    const cosDec = Math.cos(dec * DEG2RAD);

    return corners.map(({ dx, dy }) => {
        // Appliquer parity sur l'axe X
        const dxParity = dx * parityFactor;

        // Appliquer la rotation
        const dxRot = dxParity * cosTheta - dy * sinTheta;
        const dyRot = dxParity * sinTheta + dy * cosTheta;

        // Convertir en RA/Dec absolues
        // Division par cos(dec) pour compenser la convergence des méridiens
        const cornerRa = ra + dxRot / cosDec;
        const cornerDec = dec + dyRot;

        return {
            ra: cornerRa,
            dec: cornerDec,
        };
    });
}
