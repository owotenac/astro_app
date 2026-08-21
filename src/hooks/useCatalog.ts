import { CelestialObject } from '@/model/celestialobject';
import { useEffect, useState } from 'react';

interface CatalogState {
    catalog: CelestialObject[];
    loading: boolean;
}

let cachedCatalog: CelestialObject[] | null = null;
let loadingPromise: Promise<CelestialObject[]> | null = null;

async function loadCatalog(): Promise<CelestialObject[]> {
    if (cachedCatalog) return cachedCatalog;

    if (!loadingPromise) {
        loadingPromise = import('../../assets/data/ngc.json').then(module => {
            cachedCatalog = module.default as CelestialObject[];
            return cachedCatalog;
        });
    }

    return loadingPromise;
}

export function useCatalog(): CatalogState {
    const [state, setState] = useState<CatalogState>({
        catalog: cachedCatalog ?? [],
        loading: !cachedCatalog,
    });

    useEffect(() => {
        if (cachedCatalog) return;

        loadCatalog().then(catalog => {
            setState({ catalog, loading: false });
        });
    }, []);

    return state;
}

export { loadCatalog };
