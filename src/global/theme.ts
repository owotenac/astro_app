import { StyleSheet, TextStyle } from "react-native"

// ─── Couleurs (point central d'édition) ───────────────────────────────────────

export const GlobalColors = {
    // Surfaces
    background: "#040a14",
    backgroundDeep: "#020205",
    skyDome: "#080812",
    cardBackground: "#132233",
    containerBackground: "#1e2040",
    searchBackground: "#222232",
    overlayDark: "rgba(11, 12, 16, 0.95)",
    surfaceInset: "rgba(255, 255, 255, 0.02)",
    surfaceRaised: "rgba(255, 255, 255, 0.03)",

    // Texte
    textPrimary: "#ffffff",
    textSecondary: "#aaaaaa",
    textMuted: "#bbbbbb",
    textLight: "#e4e4f4",
    placeholder: "#7b7b7c",

    // Marque & interactif
    primary: "#534ab7",
    accent: "#afa9ec",
    accentMuted: "rgba(175, 169, 236, 0.1)",

    // Bordures
    border: "#555",
    borderSubtle: "rgba(255, 255, 255, 0.08)",
    borderFaint: "rgba(255, 255, 255, 0.05)",
    separator: "#13152a",
    searchBorder: "#33334d",
    checkboxBorder: "#3a3c5e",
    sliderTrack: "#1f2833",

    // États
    success: "#4ade80",
    danger: "#991b1b",
    error: "#ee0000",
    errorBackground: "rgba(224, 0, 0, 0.15)",

    // Planétarium
    unknownType: "#9E9E9E",
    iconInactive: "#494949",
    gridStroke: "rgba(100, 120, 140, 0.25)",
    gridStrokeStrong: "rgba(100, 120, 140, 0.5)",
    gridLabel: "rgba(150, 160, 170, 0.6)",
    cardinalPrimary: "rgba(255, 200, 100, 0.9)",
    cardinalSecondary: "rgba(200, 180, 140, 0.6)",
    zenithDot: "rgba(255, 255, 255, 0.5)",
    zenithLabel: "rgba(255, 255, 255, 0.5)",
    starName: "rgba(255, 255, 255, 0.9)",
    constellationStroke: "rgba(100, 149, 237, 0.4)",
    objectLabelBg: "rgba(0, 0, 0, 0.4)",
    fovFill: "rgba(196, 119, 19, 0.1)",
    fovStroke: "#00ffc8",
    mountMarker: "#ff6b6b",

    // Photométrie
    bandB: "#3b82f6",
    bandV: "#10b981",
    bandJ: "#f97316",
    bandH: "#ef4444",
    bandK: "#ec4899",
} as const

export const PhotometryBands = [
    { label: "B", name: "Bleu (B)", field: "B_Mag" as const, color: GlobalColors.bandB },
    { label: "V", name: "Visible (V)", field: "V_Mag" as const, color: GlobalColors.bandV },
    { label: "J", name: "Infra J (1.25µm)", field: "J_Mag" as const, color: GlobalColors.bandJ },
    { label: "H", name: "Infra H (1.65µm)", field: "H_Mag" as const, color: GlobalColors.bandH },
    { label: "K", name: "Infra K (2.2µm)", field: "K_Mag" as const, color: GlobalColors.bandK },
] as const

export function starFillOpacity(opacity: number): string {
    return `rgba(255, 255, 255, ${opacity})`
}

// ─── Typographie ──────────────────────────────────────────────────────────────

export const Font = {
    family: { regular: "astro_font_regular" },
    size: {
        micro: 8,
        xs: 10,
        sm: 11,
        caption: 12,
        body: 13,
        label: 14,
        button: 15,
        value: 16,
        headingSm: 18,
        headingMd: 20,
        headingLg: 22,
        panel: 24,
        title: 40,
    },
    weight: {
        medium: "500" as const,
        semibold: "600" as const,
        bold: "bold" as const,
    },
} as const

export const SvgTypography = {
    gridLabel: { fontSize: Font.size.xs },
    zenithLabel: { fontSize: Font.size.xs },
    starName: { fontSize: Font.size.xs, fontWeight: Font.weight.bold, fontFamily: Font.family.regular },
    objectName: { fontSize: Font.size.xs, fontWeight: Font.weight.semibold, fontFamily: Font.family.regular },
    cardinalMajor: { fontSize: Font.size.value, fontWeight: Font.weight.bold, fontFamily: Font.family.regular },
    cardinalMinor: { fontSize: Font.size.caption, fontWeight: Font.weight.bold, fontFamily: Font.family.regular },
} as const

function t(style: TextStyle): TextStyle {
    return style
}

const BaseText = {
    appTitle: t({
        fontSize: Font.size.title,
        fontFamily: Font.family.regular,
        fontWeight: Font.weight.bold,
        color: GlobalColors.textPrimary,
    }),
    panelTitle: t({
        fontSize: Font.size.panel,
        fontFamily: Font.family.regular,
        color: GlobalColors.textPrimary,
        opacity: 0.7,
    }),
    body: t({
        fontSize: Font.size.value,
        fontFamily: Font.family.regular,
        color: GlobalColors.textPrimary,
    }),
    label: t({ fontSize: Font.size.label, color: GlobalColors.textSecondary }),
    value: t({ fontSize: Font.size.value, fontWeight: Font.weight.medium, color: GlobalColors.textPrimary }),
    valueEmphasis: t({ fontSize: Font.size.value, fontWeight: Font.weight.medium, color: GlobalColors.textLight }),
    small: t({ fontSize: Font.size.body, color: GlobalColors.textPrimary }),
    smallBold: t({ fontSize: Font.size.body, fontWeight: Font.weight.bold, color: GlobalColors.textPrimary }),
    caption: t({ fontSize: Font.size.caption, color: GlobalColors.textSecondary }),
    hint: t({ fontSize: Font.size.xs, color: GlobalColors.textMuted }),
    accent: t({ fontSize: Font.size.label, color: GlobalColors.accent }),
    accentSmall: t({ fontSize: Font.size.caption, fontWeight: Font.weight.semibold, color: GlobalColors.accent }),
    accentBold: t({ fontSize: Font.size.label, fontWeight: Font.weight.bold, color: GlobalColors.accent }),
    accentHighlight: t({ fontSize: Font.size.body, fontWeight: Font.weight.bold, color: GlobalColors.accent }),
    inverse: t({ fontSize: Font.size.label, fontWeight: Font.weight.semibold, color: GlobalColors.background }),
    headingSmall: t({ fontSize: Font.size.headingSm, fontWeight: Font.weight.semibold, color: GlobalColors.textPrimary }),
    headingMedium: t({
        fontSize: Font.size.headingMd,
        fontFamily: Font.family.regular,
        fontWeight: Font.weight.bold,
        color: GlobalColors.textPrimary,
    }),
    headingLarge: t({
        fontSize: Font.size.headingLg,
        fontFamily: Font.family.regular,
        fontWeight: Font.weight.medium,
        color: GlobalColors.textPrimary,
    }),
    viewTitle: t({ fontSize: Font.size.headingSm, fontWeight: Font.weight.bold, color: GlobalColors.textPrimary }),
    subtitle: t({ fontSize: Font.size.body, color: GlobalColors.textPrimary, opacity: 0.8 }),
    objectTitle: t({
        fontSize: Font.size.headingSm,
        fontFamily: Font.family.regular,
        fontWeight: Font.weight.medium,
        color: GlobalColors.textPrimary,
    }),
    objectSubtitle: t({ fontSize: Font.size.caption, color: GlobalColors.textPrimary, opacity: 0.8 }),
    badge: t({ fontSize: Font.size.sm, fontWeight: Font.weight.medium, color: GlobalColors.textPrimary }),
    badgeSmall: t({ fontSize: Font.size.xs, fontWeight: Font.weight.medium, color: GlobalColors.textPrimary }),
    chip: t({ fontSize: Font.size.xs, fontWeight: Font.weight.medium, color: GlobalColors.textLight }),
    micro: t({ fontSize: Font.size.micro, color: GlobalColors.textSecondary, textAlign: "center" }),
    meta: t({ fontSize: Font.size.caption, color: GlobalColors.textSecondary }),
    success: t({ fontSize: Font.size.label, fontWeight: Font.weight.semibold, color: GlobalColors.success }),
    error: t({ fontSize: Font.size.label, color: GlobalColors.error }),
    button: t({ fontSize: Font.size.button, fontWeight: Font.weight.semibold, color: GlobalColors.textPrimary }),
    status: t({ fontSize: Font.size.value, fontWeight: Font.weight.medium, color: GlobalColors.textPrimary }),
    listLabel: t({ fontSize: Font.size.body, color: GlobalColors.textLight }),
    rowLabel: t({ fontSize: Font.size.caption, color: GlobalColors.textSecondary, flex: 1 }),
    rowValue: t({
        fontSize: Font.size.caption,
        color: GlobalColors.textPrimary,
        fontWeight: Font.weight.medium,
        textAlign: "right",
    }),
    sectionAccent: t({
        fontSize: Font.size.label,
        fontWeight: Font.weight.semibold,
        color: GlobalColors.accent,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    }),
    sectionCount: t({ fontSize: Font.size.sm, color: GlobalColors.accent }),
    sectionLabel: t({
        fontSize: Font.size.sm,
        color: GlobalColors.textMuted,
        letterSpacing: 0.08,
        textTransform: "uppercase",
    }),
    sectionTitle: t({
        fontSize: Font.size.value,
        fontFamily: Font.family.regular,
        fontWeight: Font.weight.semibold,
        color: GlobalColors.textPrimary,
    }),
} as const

/** Styles texte — nomenclature unique */
export const textStyles = StyleSheet.create({ ...BaseText })

// ─── Espacement & rayons ──────────────────────────────────────────────────────

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
} as const

export const Radius = {
    sm: 8,
    md: 10,
    lg: 12,
    pill: 16,
} as const

// ─── Layout ───────────────────────────────────────────────────────────────────

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
        paddingTop: Spacing.lg,
        backgroundColor: GlobalColors.background,
    },
    row: { flexDirection: "row", alignItems: "center" },
    rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    rowStart: { flexDirection: "row", alignItems: "flex-start" },

    panelHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.sm,
        gap: Spacing.md,
    },

    card: {
        padding: Spacing.lg,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: Radius.md,
    },
    cardCompact: {
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: Radius.md,
    },
    cardSection: {
        marginTop: Spacing.xl,
        padding: Spacing.lg,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: Radius.md,
    },
    panel: {
        backgroundColor: GlobalColors.containerBackground,
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    insetBox: {
        backgroundColor: GlobalColors.background,
        borderRadius: Radius.sm,
        padding: Spacing.md,
    },
    calloutBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.md,
        backgroundColor: GlobalColors.accentMuted,
        borderRadius: Radius.sm,
        marginBottom: Spacing.md,
    },
    resultBox: {
        marginTop: Spacing.lg,
        padding: Spacing.md,
        backgroundColor: GlobalColors.background,
        borderRadius: Radius.sm,
        borderLeftWidth: 3,
        borderLeftColor: GlobalColors.success,
    },
    chip: {
        borderWidth: 1,
        borderColor: GlobalColors.borderSubtle,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        backgroundColor: GlobalColors.surfaceInset,
    },
    photometryItem: {
        backgroundColor: GlobalColors.surfaceRaised,
        borderWidth: 1,
        borderColor: GlobalColors.borderFaint,
        borderRadius: Radius.sm,
        padding: Spacing.sm,
        alignItems: "center",
        gap: Spacing.xs,
    },

    listItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: Radius.md,
        margin: 1,
    },
    listRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.md,
    },
    searchRow: {
        padding: Spacing.xs,
        height: 60,
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        gap: Spacing.lg,
        marginBottom: Spacing.md,
    },
    kvRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: Spacing.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: GlobalColors.borderFaint,
        gap: Spacing.sm,
    },

    statusContainer: {
        marginTop: Spacing.xl,
        padding: Spacing.lg,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: Radius.md,
    },
    statusRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    statusIndicator: {
        width: Spacing.md,
        height: Spacing.md,
        borderRadius: Radius.sm,
        backgroundColor: GlobalColors.textSecondary,
    },
    statusIndicatorConnected: { backgroundColor: GlobalColors.success },

    errorContainer: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: GlobalColors.errorBackground,
        borderRadius: Radius.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    errorMessage: { ...BaseText.error, flex: 1 },

    buttonRow: { marginTop: Spacing.xl, flexDirection: "row", gap: Spacing.md },
    buttonPrimary: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        backgroundColor: GlobalColors.primary,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radius.md,
    },
    buttonDanger: { backgroundColor: GlobalColors.danger },
    buttonDisabled: { opacity: 0.4 },
    pillToggle: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: GlobalColors.accent,
    },
    pillToggleActive: { backgroundColor: GlobalColors.accent },

    sectionAccent: { ...BaseText.sectionAccent, marginBottom: Spacing.lg },
    sectionCount: { ...BaseText.sectionCount, marginBottom: Spacing.md },
    sectionLabelMargin: { marginBottom: Spacing.md, marginTop: Spacing.xs },
    sectionHeader: {
        ...BaseText.sectionTitle,
        borderBottomWidth: 1,
        borderBottomColor: GlobalColors.borderSubtle,
        paddingBottom: Spacing.xs,
        marginBottom: Spacing.xs,
    },

    badgeWrapper: {
        alignSelf: "flex-start",
        borderRadius: Radius.sm,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        overflow: "hidden",
    },
    typeIcon: {
        width: 34,
        height: 34,
        borderRadius: Radius.sm,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    inlineRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },

    searchBar: {
        color: GlobalColors.textPrimary,
        borderWidth: 1,
        borderRadius: Radius.md,
        borderColor: GlobalColors.searchBorder,
        backgroundColor: GlobalColors.searchBackground,
        padding: Spacing.lg,
        flex: 1,
    },
    inputLabelMargin: { marginBottom: Spacing.sm },

    skyViewport: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: GlobalColors.backgroundDeep,
    },
})
