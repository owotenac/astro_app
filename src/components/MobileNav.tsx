import { GlobalColors, Radius, Spacing } from '@/global/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type Panel = 'catalog' | 'filter' | 'mount' | 'camera' | 'plate-solving' | 'details' | 'weather';

interface MobileNavProps {
    activePanel: Panel;
    onPanelPress: (panel: Panel) => void;
    serverAvailable: boolean;
}

const NAV_ICON_SIZE = 22;

const navItems: { panel: Panel; icon: keyof typeof MaterialCommunityIcons.glyphMap; requiresServer?: boolean }[] = [
    { panel: 'catalog', icon: 'format-list-bulleted' },
    { panel: 'filter', icon: 'tune-variant' },
    { panel: 'weather', icon: 'weather-cloudy' },
];

export default function MobileNav({ activePanel, onPanelPress, serverAvailable }: MobileNavProps) {
    return (
        <View style={styles.container}>
            <View style={styles.nav}>
                {navItems.map(({ panel, icon, requiresServer }) => {
                    const isDisabled = requiresServer && !serverAvailable;
                    const isActive = activePanel === panel;

                    return (
                        <TouchableOpacity
                            key={panel}
                            style={[styles.navButton, isActive && styles.navButtonActive]}
                            onPress={() => onPanelPress(panel)}
                            disabled={isDisabled}
                        >
                            <MaterialCommunityIcons
                                name={icon}
                                size={NAV_ICON_SIZE}
                                color={isDisabled
                                    ? GlobalColors.textDisabled
                                    : isActive
                                        ? GlobalColors.textPrimary
                                        : GlobalColors.textMuted
                                }
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: Spacing.lg,
        right: Spacing.lg,
    },
    nav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: GlobalColors.overlayDark,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        borderColor: GlobalColors.separator,
    },
    navButton: {
        padding: Spacing.sm,
        borderRadius: Radius.md,
    },
    navButtonActive: {
        backgroundColor: GlobalColors.surfaceRaised,
    },
});
