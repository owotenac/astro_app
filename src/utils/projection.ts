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

export interface ViewCenter {
    az: number;  // azimut du centre de vue (0-360)
    alt: number; // altitude du centre de vue (-90 à +90)
}

// Conversion degrés ↔ radians
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Projection stéréographique.
 * Projection conforme (conserve les angles locaux) centrée sur un point de vue.
 * Les objets proches du centre apparaissent à leur taille réelle,
 * ceux en périphérie sont légèrement agrandis.
 */
export function stereographicProject(
    az: number,
    alt: number,
    viewCenter: ViewCenter,
    radius: number
): ProjectedPoint {
    // Conversion en radians
    const azRad = az * DEG2RAD;
    const altRad = alt * DEG2RAD;
    const az0Rad = viewCenter.az * DEG2RAD;
    const alt0Rad = viewCenter.alt * DEG2RAD;

    // Différence d'azimut
    const dAz = azRad - az0Rad;

    // Coordonnées sur la sphère unitaire relatives au centre de vue
    const sinAlt = Math.sin(altRad);
    const cosAlt = Math.cos(altRad);
    const sinAlt0 = Math.sin(alt0Rad);
    const cosAlt0 = Math.cos(alt0Rad);
    const cosDaz = Math.cos(dAz);
    const sinDaz = Math.sin(dAz);

    // z = cos(distance angulaire au centre)
    const cosC = sinAlt0 * sinAlt + cosAlt0 * cosAlt * cosDaz;

    // Objet derrière l'observateur (plus de 90° du centre)
    if (cosC < -0.05) {
        return { x: 0, y: 0, visible: false, scale: 1 };
    }

    // Facteur d'échelle stéréographique
    // k = 2 / (1 + cosC) pour projection depuis le pôle opposé
    const k = 2 / (1 + cosC);

    // Coordonnées projetées (x vers l'Est, y vers le haut/zénith)
    const xSphere = cosAlt * sinDaz;
    const ySphere = cosAlt0 * sinAlt - sinAlt0 * cosAlt * cosDaz;

    const x = k * xSphere * radius;
    const y = -k * ySphere * radius; // négatif car y écran croît vers le bas

    return {
        x,
        y,
        visible: true,
        scale: Math.min(k, 2), // limiter l'agrandissement en périphérie
    };
}

/**
 * Projection orthographique.
 * Vue comme depuis l'infini — pas de déformation de taille,
 * mais les objets près du bord sont compressés.
 */
export function orthographicProject(
    az: number,
    alt: number,
    viewCenter: ViewCenter,
    radius: number
): ProjectedPoint {
    const azRad = az * DEG2RAD;
    const altRad = alt * DEG2RAD;
    const az0Rad = viewCenter.az * DEG2RAD;
    const alt0Rad = viewCenter.alt * DEG2RAD;

    const dAz = azRad - az0Rad;

    const sinAlt = Math.sin(altRad);
    const cosAlt = Math.cos(altRad);
    const sinAlt0 = Math.sin(alt0Rad);
    const cosAlt0 = Math.cos(alt0Rad);
    const cosDaz = Math.cos(dAz);
    const sinDaz = Math.sin(dAz);

    const cosC = sinAlt0 * sinAlt + cosAlt0 * cosAlt * cosDaz;

    if (cosC < 0) {
        return { x: 0, y: 0, visible: false, scale: 1 };
    }

    const xSphere = cosAlt * sinDaz;
    const ySphere = cosAlt0 * sinAlt - sinAlt0 * cosAlt * cosDaz;

    return {
        x: xSphere * radius,
        y: -ySphere * radius,
        visible: true,
        scale: 1,
    };
}

/**
 * Projection gnomonique.
 * Les grands cercles deviennent des lignes droites.
 * Forte déformation en périphérie, mais utile pour la navigation.
 */
export function gnomonicProject(
    az: number,
    alt: number,
    viewCenter: ViewCenter,
    radius: number,
    maxAngle: number = 60 // angle max depuis le centre en degrés
): ProjectedPoint {
    const azRad = az * DEG2RAD;
    const altRad = alt * DEG2RAD;
    const az0Rad = viewCenter.az * DEG2RAD;
    const alt0Rad = viewCenter.alt * DEG2RAD;

    const dAz = azRad - az0Rad;

    const sinAlt = Math.sin(altRad);
    const cosAlt = Math.cos(altRad);
    const sinAlt0 = Math.sin(alt0Rad);
    const cosAlt0 = Math.cos(alt0Rad);
    const cosDaz = Math.cos(dAz);
    const sinDaz = Math.sin(dAz);

    const cosC = sinAlt0 * sinAlt + cosAlt0 * cosAlt * cosDaz;

    // Distance angulaire au centre
    const angularDist = Math.acos(Math.max(-1, Math.min(1, cosC))) * RAD2DEG;

    if (cosC <= 0 || angularDist > maxAngle) {
        return { x: 0, y: 0, visible: false, scale: 1 };
    }

    // k = 1 / cosC pour projection gnomonique
    const k = 1 / cosC;

    const xSphere = cosAlt * sinDaz;
    const ySphere = cosAlt0 * sinAlt - sinAlt0 * cosAlt * cosDaz;

    // Normaliser pour que le bord corresponde au maxAngle
    const edgeK = 1 / Math.cos(maxAngle * DEG2RAD);
    const normFactor = radius / edgeK;

    return {
        x: k * xSphere * normFactor,
        y: -k * ySphere * normFactor,
        visible: true,
        scale: Math.min(k, 3),
    };
}

/**
 * Projection azimutale équidistante centrée sur le zénith (vue "all-sky" Stellarium).
 * - Le zénith (alt=90°) est au centre
 * - L'horizon (alt=0°) est sur le bord
 * - Le Nord (az=0°) est en haut
 * - L'Est (az=90°) est à droite
 *
 * Distance radiale proportionnelle à la distance zénithale (90° - altitude).
 */
export function azimuthalEquidistantProject(
    az: number,
    alt: number,
    radius: number,
    minAlt: number = -10
): ProjectedPoint {
    if (alt < minAlt) {
        return { x: 0, y: 0, visible: false, scale: 1 };
    }

    // Distance zénithale en degrés (0 au zénith, 90 à l'horizon)
    const zenithDist = 90 - alt;

    // Distance radiale sur l'écran (linéaire avec la distance zénithale)
    // À l'horizon (zenithDist=90), r = radius
    const r = (zenithDist / 90) * radius;

    // Angle depuis le Nord (en haut), sens horaire
    // az=0 (Nord) → angle=0 (vers le haut, -Y)
    // az=90 (Est) → angle=90° (vers la droite, +X)
    const angleRad = az * DEG2RAD;

    const x = r * Math.sin(angleRad);
    const y = -r * Math.cos(angleRad); // négatif car Y écran croît vers le bas

    return {
        x,
        y,
        visible: true,
        scale: 1,
    };
}

/**
 * Projection stéréographique centrée sur le zénith (vue "all-sky").
 * Similaire à l'équidistante mais avec une légère expansion vers l'horizon.
 * Conserve les angles (conforme).
 */
export function azimuthalStereographicProject(
    az: number,
    alt: number,
    radius: number,
    minAlt: number = -10
): ProjectedPoint {
    if (alt < minAlt) {
        return { x: 0, y: 0, visible: false, scale: 1 };
    }

    // Distance zénithale
    const zenithDistRad = (90 - alt) * DEG2RAD;

    // Projection stéréographique depuis le nadir (pôle opposé au zénith)
    // r = 2 * tan(zenithDist / 2)
    // Normalisé pour que l'horizon (90°) corresponde à radius
    const rNorm = 2 * Math.tan(zenithDistRad / 2);
    const horizonNorm = 2 * Math.tan(Math.PI / 4); // = 2 * tan(45°) = 2
    const r = (rNorm / horizonNorm) * radius;

    const angleRad = az * DEG2RAD;

    const x = r * Math.sin(angleRad);
    const y = -r * Math.cos(angleRad);

    // Facteur d'échelle (objets légèrement plus grands vers l'horizon)
    const scale = 1 + 0.3 * (rNorm / horizonNorm);

    return {
        x,
        y,
        visible: true,
        scale: Math.min(scale, 1.5),
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

/**
 * Calcule la distance angulaire entre deux points du ciel (en degrés).
 */
export function angularDistance(
    az1: number, alt1: number,
    az2: number, alt2: number
): number {
    const az1Rad = az1 * DEG2RAD;
    const alt1Rad = alt1 * DEG2RAD;
    const az2Rad = az2 * DEG2RAD;
    const alt2Rad = alt2 * DEG2RAD;

    const cosC = Math.sin(alt1Rad) * Math.sin(alt2Rad) +
        Math.cos(alt1Rad) * Math.cos(alt2Rad) * Math.cos(az2Rad - az1Rad);

    return Math.acos(Math.max(-1, Math.min(1, cosC))) * RAD2DEG;
}

/**
 * Calcule le champ de vision (FOV) en fonction du zoom.
 * zoom = 1 → 90° de FOV (hémisphère complet visible)
 * zoom = 2 → 45° de FOV
 * zoom = 4 → 22.5° de FOV
 */
export function fovFromZoom(zoom: number): number {
    return 90 / zoom;
}

/**
 * Calcule le rayon de projection pour un FOV donné et une taille d'écran.
 */
export function radiusForFov(fov: number, screenSize: number): number {
    // Le bord de l'écran correspond à fov/2 degrés depuis le centre
    // En projection stéréographique : r = 2 * tan(angle/2) * radius
    // On veut que pour angle = fov/2, r = screenSize/2
    const halfFovRad = (fov / 2) * DEG2RAD;
    return (screenSize / 2) / (2 * Math.tan(halfFovRad / 2));
}