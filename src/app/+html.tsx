import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <meta name="description" content="Astro App - Application d'astrophotographie. Explorez les catalogues Messier, NGC, visualisez le ciel en temps réel et contrôlez votre télescope et votre camera avec ASCOM." />
        <meta name="keywords" content="astrophotographie, astronomie, télescope, messier, ngc, ciel nocturne, étoiles, planétarium, ASCOM, NGC, DSO" />
        <meta name="author" content="Astro App" />

        <meta property="og:title" content="Astro App - Explorez le ciel nocturne" />
        <meta property="og:description" content="Application d'astrophotographie avec catalogues Messier et NGC, vue du ciel temps réel et contrôle télescope ASCOM." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/icon.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Astro App - Explorez le ciel nocturne" />
        <meta name="twitter:description" content="Application d'astrophotographie avec catalogues Messier et NGC, vue du ciel temps réel et contrôle télescope ASCOM." />

        <meta name="theme-color" content="#040a14" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #040a14;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

@font-face {
  font-family: 'Blinker';
  font-weight: normal;
  font-style: normal;
}

* {
  font-family: 'Blinker', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0d1520;
}

::-webkit-scrollbar-thumb {
  background: #5b6eae;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #7b8ece;
}
`;
