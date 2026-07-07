/**
 * Interface commune pour tous les objets pointables dans le planétarium.
 * Permet de cibler les objets célestes, planètes et étoiles avec le slewMode.
 */
export interface PointableObject {
    x: number;
    y: number;
    az: number;
    alt: number;
    name: string;
    type: 'object' | 'planet' | 'star';
}
