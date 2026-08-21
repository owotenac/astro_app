import { Platform } from 'react-native';
import SvgSphericalPlanetarium from './spherical-mode-svg';

let PlanetariumComponent: React.ComponentType;

if (Platform.OS === 'web') {
    PlanetariumComponent = SvgSphericalPlanetarium;
} else {
    PlanetariumComponent = require('./spherical-mode-skia').default;
}

export default PlanetariumComponent;
