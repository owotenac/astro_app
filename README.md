# Astro App 🌌

Astro App is a modern, cross-platform mobile and web application built with **React Native** and **Expo**. Designed for astronomy enthusiasts, it provides a comprehensive catalog of celestial objects, complete with detailed information and beautifully integrated features to enhance your stargazing experience.

## ✨ Features

- **Extensive Catalog**: Explore hundreds of celestial objects from the Messier and NGC catalogs.
- **Detailed Object Information**: View essential data such as:
  - Common names and designations
  - Magnitude (brightness)
  - Constellation mapping
  - Object type classifications (e.g., Galaxies, Nebulae, Star Clusters)
- **Advanced Search**: Quickly find objects by their name, common name, or Messier/NGC designation.
- **Upcoming Features**:
  - **AR Mode**: Augmented Reality feature to locate objects directly in the night sky.
  - **Planificateur (Observation Planner)**: Plan your future stargazing sessions.

## 🚀 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing) & React Navigation
- **Language**: TypeScript
- **Icons**: `@expo/vector-icons` (MaterialCommunityIcons)

## 📦 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/owotenac/astro_app.git
   ```

2. Navigate to the project directory:
   ```bash
   cd astro_app/client/astro_app
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the App

Astro App can be so far on WEB only but will run on multiple platforms thanks to Expo.

- **Start the development server:**
  ```bash
  npx expo start
  ```

- **Run on Web:**
  ```bash
  npm run web
  ```


## 📂 Project Structure

- `assets/data/`: JSON files containing the data for celestial objects (Messier, NGC), constellation mappings, and object types.
- `src/app/`: Expo Router screens representing the different pages of the application (e.g., Home, Catalog).
- `src/components/`: Reusable React components (like the `CelestialObjectComponent`).
- `src/global/`: Global styles and theme definitions.
- `src/model/`: TypeScript interfaces and types for the application data.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the [issues page](https://github.com/owotenac/astro_app/issues).
