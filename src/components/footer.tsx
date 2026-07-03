import { GlobalColors, Spacing, textStyles } from '@/global/theme';
import React from "react";
import {
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";


interface FooterLinkProps {
    href: string;
    children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
    return (
        <TouchableOpacity onPress={() => Linking.openURL(href)} activeOpacity={0.7}>
            <Text style={styles.link}>{children}</Text>
        </TouchableOpacity>
    );
}

export default function FooterWeb() {
    if (Platform.OS !== "web") return null;

    const year = new Date().getFullYear();

    return (
        <View style={styles.footer}>
            <View style={styles.inner}>

                {/* Brand */}
                <TouchableOpacity
                    style={styles.brand}
                    onPress={() => Linking.openURL("/")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.brandName}>Astro App</Text>
                </TouchableOpacity>

                {/* Nav links */}
                <View style={styles.links}>
                    <FooterLink href="/legalpage#mentions">Mentions légales</FooterLink>
                    <Text style={styles.sep}>•</Text>
                    <FooterLink href="/legalpage#confidentialite">
                        Politique de confidentialité
                    </FooterLink>
                    <Text style={styles.sep}>•</Text>
                    <FooterLink href="/legalpage#cgu">CGU</FooterLink>
                    <Text style={styles.sep}>•</Text>
                    <FooterLink href="mailto:contact@e2digitalstudio.com">
                        Contact
                    </FooterLink>
                </View>

                {/* Copyright */}
                <Text style={styles.copy}>© {year} E2 Digital Studio</Text>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    inner: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 20,
        //flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 5,
    },

    // Brand
    brand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    brandName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#f0e6d3",
        letterSpacing: 0.75,
        textAlign: "center"
    },

    // Links
    links: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        rowGap: 6,
        columnGap: 18,
    },
    link: {
        color: "#bdbcbc",
        fontSize: 13,
    },
    sep: {
        color: "rgba(240, 230, 211, 0.2)",
        fontSize: 11,
    },

    // Copyright
    copy: {
        fontSize: 12,
        color: "rgba(240, 230, 211, 0.35)",
        fontWeight: "300",
    },


    // Footer
    footer: {
        paddingVertical: Spacing.xxl,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: GlobalColors.borderFaint,
    },
    footerText: {
        ...textStyles.caption,
        color: GlobalColors.textMuted,
    },
    footerHint: {
        ...textStyles.hint,
        marginTop: Spacing.xs,
    },
});