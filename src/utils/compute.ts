import { CelestialObject } from "@/model/celestialobject";
import { Horizon } from 'astronomy-engine';
import { getObserver } from './observer';

export const formatToDMS = (decimalDegrees: number): string => {
    const absolute = Math.abs(decimalDegrees);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const sign = decimalDegrees < 0 ? "-" : "";
    const strMinutes = String(minutes).padStart(2, '0');
    const strSeconds = String(seconds).padStart(2, '0');

    return `${sign}${degrees}° ${strMinutes}' ${strSeconds}"`;
};

/**
 * Calcule l'azimut et l'altitude d'un objet céleste.
 *
 * @param item   L'objet céleste (contient ra_deg et dec_deg en J2000).
 * @param date   La date d'observation. Si non fournie, utilise l'heure courante.
 *               - Dans le catalogue : passer une Date créée une seule fois avant la boucle de filtre.
 *               - Dans le tick temps réel : passer new Date() à chaque intervalle.
 */
export function computeAzAlt(item: CelestialObject, date: Date = new Date()) {
    const raHours = item.ra_deg / 15;
    const decDegrees = item.dec_deg;

    return Horizon(date, getObserver(), raHours, decDegrees, 'normal');
}
