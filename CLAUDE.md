# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
The goal of the application is develop an astrophotography application. So far 2 featues: 1 Messier Catague with filters and sky view wih celestial objects on a flat representation

@AGENTS.md

## Commands

```bash
npm start          # Start Expo dev server (or: npx expo start)
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run ESLint via expo lint
```

For device builds, use EAS: `eas build --platform android|ios`

## Standalone Deployment

The web client can be bundled with the ASCOM server for standalone deployment on a Windows mini-PC:

```bash
# From C:/Git/astro_app root directory
build_standalone.bat
```

This creates `server_ascom/dist/astro_app.exe` which serves the web UI at `http://localhost:5001`.

## Architecture

React Native + Expo SDK 57 astronomy app with file-based routing (expo-router).

### Data Flow

- **Catalog data**: Static JSON files in `assets/data/` (ngc.json, messier.json, celestialtype.json, const_mapping.json)
- **State**: Zustand stores in `src/hooks/` — `useFilterStore` for filter state, `useSettings` for persistence via AsyncStorage
- **Astronomy calculations**: `src/utils/compute.ts` uses `astronomy-engine` to compute real-time azimuth/altitude from RA/Dec coordinates

### Key Patterns

- Path aliases: `@/*` → `./src/*`, `@/assets/*` → `./assets/*`
- Colors/styles centralized in `src/global/theme.ts` (GlobalColors, globalStyles)
- CelestialObject type includes both catalog fields (RA, Dec, M, NGC) and computed fields (ra_deg, dec_deg, magnitude)
- Filter logic in `src/utils/filter.ts` applies magnitude, altitude, type, and text filters against the catalog

### Screens (src/app/)

- `index.tsx` — Home with navigation to Catalog, Screen Mode, Planificateur
- `catalog.tsx` — Searchable/filterable list of celestial objects
- `filter.tsx` — Filter configuration (magnitude, altitude, object types)
- `object-details.tsx` — Object detail view with computed Az/Alt
- `screen-mode.tsx` — Panorama planetarium with cylindrical projection
- `ar-mode.tsx` — AR view (in development)

### Device Permissions

Camera, location, and motion sensors are configured in app.json for AR features.