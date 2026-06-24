import { CelestialObject } from "@/model/celestialobject";
import { Horizon, Observer } from 'astronomy-engine';

export const formatToDMS = (decimalDegrees: number): string => {
    // On travaille sur la valeur absolue pour gérer les altitudes négatives
    const absolute = Math.abs(decimalDegrees);

    const degrees = Math.floor(absolute);

    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);

    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    // On remet le signe moins si la valeur d'origine était négative (Utile pour l'Altitude)
    const sign = decimalDegrees < 0 ? "-" : "";

    // Retourne le format propre : ex 254° 07' 30"
    // On utilise padStart pour caler des zéros initiaux sur les minutes/secondes (ex: 07' au lieu de 7')
    const strMinutes = String(minutes).padStart(2, '0');
    const strSeconds = String(seconds).padStart(2, '0');

    return `${sign}${degrees}° ${strMinutes}' ${strSeconds}"`;
};

/**
 * Singleton Observer : instancié une seule fois au chargement du module.
 * N'est recréé que si les coordonnées GPS changent via updateObserver().
 */
let _observer = new Observer(43.607592, 3.490681, 30);

/**
 * Met à jour les coordonnées GPS de l'observateur.
 * À appeler uniquement quand la position GPS change.
 */
export const updateObserver = (latitude: number, longitude: number, height: number = 0) => {
    _observer = new Observer(latitude, longitude, height);
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
    const raHours = item.ra_deg / 15; // astronomy-engine attend la RA en HEURES (0-24)
    const decDegrees = item.dec_deg;  // La déclinaison reste en degrés

    return Horizon(date, _observer, raHours, decDegrees, 'normal');
}
