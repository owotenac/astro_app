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


export const computeAzAlt = (item: CelestialObject) => {
    // Latitude, Longitude, Altitude en mètres (0 par défaut)
    const observer = new Observer(43.607592, 3.490681, 30);

    // Prendre l'heure actuelle du téléphone
    const date = new Date();

    const raHours = item.ra_deg / 15; // Attention, astronomy-engine attend la RA en HEURES (0-24)
    const decDegrees = item.dec_deg;  // La déclinaison reste en degrés

    // Calcul de la position en temps réel
    const horizontalCoords = Horizon(date, observer, raHours, decDegrees, 'normal');
    return horizontalCoords;
}