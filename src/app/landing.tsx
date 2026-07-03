import FooterWeb from '@/components/footer';
import { GlobalColors, Radius, Spacing, textStyles } from '@/global/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FEATURES = [
  {
    icon: 'star-shooting' as const,
    title: 'Catalogues NGC IC et Messier',
    description: 'Des milliers d\'objets du ciel profond avec filtres par magnitude, altitude et type.',
  },
  {
    icon: 'weather-night' as const,
    title: 'Vue du ciel',
    description: 'Projection du ciel en temps réel avec étoiles, constellations et planètes.',
  },
  {
    icon: 'telescope' as const,
    title: 'Contrôle télescope',
    description: 'Pilotez votre monture et camera ASCOM: goto, suivi et plate-solving intégrés.',
  },
  {
    icon: 'calendar-clock' as const,
    title: 'Planification',
    description: 'Préparez vos sessions avec les heures de lever/coucher et conditions.',
  },
];

export default function Landing() {
  const router = useRouter();

  const handleLaunch = () => {
    router.push('/planetarium');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.starField}>
          {Array.from({ length: 150 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.3 + Math.random() * 0.7,
                  width: 1 + Math.random() * 2,
                  height: 1 + Math.random() * 2,
                },
              ]}
            />
          ))}
        </View>

        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Astro App</Text>
        <Text style={styles.tagline}>Explorez le ciel nocturne</Text>

        <TouchableOpacity style={styles.ctaButton} onPress={handleLaunch}>
          <Text style={styles.ctaText}>Lancer l'application</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={GlobalColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.sectionTitle}>Fonctionnalités</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={28}
                  color={GlobalColors.primary}
                />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>
      <FooterWeb />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalColors.background,
  },
  content: {
    minHeight: '100%',
  },

  // Hero
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 500,
  },
  starField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    ...textStyles.headingLarge,
    fontSize: 48,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...textStyles.body,
    fontSize: 20,
    color: GlobalColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: GlobalColors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.lg,
  },
  ctaText: {
    ...textStyles.button,
    fontSize: 16,
  },

  // Features
  features: {
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
    backgroundColor: GlobalColors.cardBackground,
  },
  sectionTitle: {
    ...textStyles.headingMedium,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  featureCard: {
    backgroundColor: GlobalColors.containerBackground,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    width: 220,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GlobalColors.borderFaint,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GlobalColors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureTitle: {
    ...textStyles.headingSmall,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  featureDescription: {
    ...textStyles.caption,
    textAlign: 'center',
    lineHeight: 18,
  },

});
