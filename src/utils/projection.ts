/**
 * Moteurs de projection pour la vue du ciel.
 *
 * Coordonnées d'entrée : azimut (0-360°, 0=Nord) et altitude (-90 à +90°)
 * Coordonnées de sortie : x, y en pixels depuis le centre de la vue
 */

export interface ProjectedPoint {
    x: number;
    y: number;
    visible: boolean;
    scale: number; // facteur d'échelle pour la taille des marqueurs
}

// Conversion degrés ↔ radians
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;


/**
 * Projection azimutale équidistante centrée sur le zénith (vue "all-sky").
 * - Le zénith (alt=90°) est au centre
 * - L'horizon (alt=0°) est sur le bord
 * - Le Nord (az=0°) est en haut
 * - mirror=true : Est à gauche (vue "yeux au ciel")
 * - mirror=false : Est à droite (vue "carte géographique")
 *
 * Distance radiale proportionnelle à la distance zénithale (90° - altitude).
 */
export function azimuthalEquidistantProject(
    az: number,
    alt: number,
    radius: number,
    minAlt: number = -10,
    mirror: boolean = true
): ProjectedPoint {
    if (alt < minAlt) {
        return { x: 0, y: 0, visible: false, scale: 1 };
    }

    // Distance zénithale en degrés (0 au zénith, 90 à l'horizon)
    const zenithDist = 90 - alt;

    // Distance radiale sur l'écran (linéaire avec la distance zénithale)
    // À l'horizon (zenithDist=90), r = radius
    const r = (zenithDist / 90) * radius;

    // Angle depuis le Nord (en haut)
    // mirror=true : sens anti-horaire (Est à gauche)
    // mirror=false : sens horaire (Est à droite)
    const angleRad = az * DEG2RAD;

    const x = (mirror ? -1 : 1) * r * Math.sin(angleRad);
    const y = -r * Math.cos(angleRad); // négatif car Y écran croît vers le bas

    return {
        x,
        y,
        visible: true,
        scale: 1,
    };
}

/**
 * Projection équatoriale centrée sur le pôle céleste nord (vue "polaire").
 * - Le pôle nord céleste (Dec=+90°) est au centre
 * - L'équateur céleste (Dec=0°) est sur le bord
 * - RA=0h en haut, RA augmente dans le sens anti-horaire (convention astronomique)
 *
 * @param ra  Ascension droite en degrés (0-360)
 * @param dec Déclinaison en degrés (-90 à +90)
 * @param radius Rayon du cercle de projection en pixels
 * @param minDec Déclinaison minimale à afficher (défaut: -10°)
 * @param lst Temps sidéral local en degrés (pour orienter RA=0h vers le méridien)
 */
export function equatorialPolarProject(
    ra: number,
    dec: number,
    radius: number,
    minDec: number = -10,
    lst: number = 0
): ProjectedPoint {
    if (dec < minDec) {
        return { x: 0, y: 0, visible: false, scale: 1 };
    }

    // Distance polaire (0 au pôle nord, 90 à l'équateur)
    const polarDist = 90 - dec;

    // Distance radiale sur l'écran
    const r = (polarDist / 90) * radius;

    // Angle horaire : RA par rapport au temps sidéral local
    // On veut que le méridien local (RA = LST) soit en haut
    // RA augmente vers l'Est (sens anti-horaire vu du pôle nord)
    const hourAngle = ra - lst;
    const angleRad = -hourAngle * DEG2RAD; // négatif pour sens anti-horaire

    const x = r * Math.sin(angleRad);
    const y = -r * Math.cos(angleRad);

    return {
        x,
        y,
        visible: true,
        scale: 1,
    };
}

/**
 * Calcule le temps sidéral local (LST) en degrés.
 * Approximation simplifiée pour l'affichage.
 *
 * @param date Date d'observation
 * @param longitude Longitude de l'observateur en degrés (Est positif)
 */
export function computeLST(date: Date, longitude: number): number {
    // Jour julien depuis J2000.0
    const jd = date.getTime() / 86400000 + 2440587.5;
    const d = jd - 2451545.0;

    // GMST en degrés (formule simplifiée)
    let gmst = 280.46061837 + 360.98564736629 * d;
    gmst = ((gmst % 360) + 360) % 360;

    // LST = GMST + longitude
    let lst = gmst + longitude;
    lst = ((lst % 360) + 360) % 360;

    return lst;
}
