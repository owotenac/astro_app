import { Body } from 'astronomy-engine';

export type Planet = {
    name: string;
    body: Body;
    radius: number;
    color: string;
    // Coordonnées calculées dynamiquement
    ra_deg: number;
    dec_deg: number;
    azimuth: number;
    altitude: number;
    distance_au: number;
    magnitude: number | null;
};

// Liste des planètes du système solaire
export const PLANET_BODIES: { name: string; body: Body; radius: number; color: string }[] = [
    { name: 'Mercure', body: Body.Mercury, radius: 5, color: '#B5B5B5' },
    { name: 'Vénus', body: Body.Venus, radius: 5, color: '#E6C229' },
    { name: 'Mars', body: Body.Mars, radius: 5, color: '#E05D44' },
    { name: 'Jupiter', body: Body.Jupiter, radius: 10, color: '#D4A574' },
    { name: 'Saturne', body: Body.Saturn, radius: 10, color: '#C9B896' },
    { name: 'Uranus', body: Body.Uranus, radius: 5, color: '#7DE3F4' },
    { name: 'Neptune', body: Body.Neptune, radius: 5, color: '#3E66F9' },
];

// Optionnel : Soleil et Lune
export const EXTRA_BODIES: { name: string; body: Body; radius: number; color: string }[] = [
    { name: 'Soleil', body: Body.Sun, radius: 20, color: '#FFD700' },
    { name: 'Lune', body: Body.Moon, radius: 10, color: '#F4F4F4' },
];
