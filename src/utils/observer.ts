import { Observer } from 'astronomy-engine';

/**
 * Singleton Observer pour toute l'application.
 * Position par défaut : Montpellier
 */
let _observer = new Observer(43.607592, 3.490681, 30);

/**
 * Retourne l'observer courant.
 */
export const getObserver = (): Observer => _observer;

/**
 * Met à jour les coordonnées GPS de l'observateur.
 * À appeler quand la position GPS change.
 */
export const updateObserver = (latitude: number, longitude: number, height: number = 0) => {
    _observer = new Observer(latitude, longitude, height);
};
