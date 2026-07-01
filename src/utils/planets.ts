import { Equator, Horizon, Illumination, Body } from 'astronomy-engine';
import { Planet, PLANET_BODIES, EXTRA_BODIES } from '@/model/planet';
import { getObserver } from './observer';

/**
 * Calcule la position d'une planète à une date donnée.
 */
function computePlanetPosition(
    bodyInfo: { name: string; body: Body; radius: number; color: string },
    date: Date
): Planet {
    const observer = getObserver();
    const equ = Equator(bodyInfo.body, date, observer, true, true);
    const hor = Horizon(date, observer, equ.ra, equ.dec, 'normal');

    let magnitude: number | null = null;
    try {
        const illum = Illumination(bodyInfo.body, date);
        magnitude = illum.mag;
    } catch {
        // Certains corps (Soleil) n'ont pas de magnitude via Illumination
    }

    return {
        name: bodyInfo.name,
        body: bodyInfo.body,
        radius: bodyInfo.radius,
        color: bodyInfo.color,
        ra_deg: equ.ra * 15,
        dec_deg: equ.dec,
        azimuth: hor.azimuth,
        altitude: hor.altitude,
        distance_au: equ.dist,
        magnitude,
    };
}

/**
 * Calcule les positions de toutes les planètes.
 *
 * @param date Date d'observation (défaut: maintenant)
 * @param includeExtras Inclure Soleil et Lune (défaut: false)
 */
export function computeAllPlanets(date: Date = new Date(), includeExtras: boolean = false): Planet[] {
    const bodies = includeExtras
        ? [...PLANET_BODIES, ...EXTRA_BODIES]
        : PLANET_BODIES;

    return bodies.map(body => computePlanetPosition(body, date));
}

/**
 * Calcule la position d'une planète spécifique par son nom.
 */
export function computePlanetByName(name: string, date: Date = new Date()): Planet | null {
    const allBodies = [...PLANET_BODIES, ...EXTRA_BODIES];
    const bodyInfo = allBodies.find(b => b.name.toLowerCase() === name.toLowerCase());

    if (!bodyInfo) return null;

    return computePlanetPosition(bodyInfo, date);
}

/**
 * Filtre les planètes visibles (altitude > 0).
 */
export function getVisiblePlanets(date: Date = new Date(), includeExtras: boolean = false): Planet[] {
    return computeAllPlanets(date, includeExtras).filter(p => p.altitude > 0);
}
