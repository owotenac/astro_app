import { StyleSheet } from "react-native"

export const GlobalColors = {
    background: "#040a14",
    foreground: "#ffffff",
    nightMode: "#e00",
    border: "#555",

    // Couleurs refactorisées
    white: "#ffffff",
    cardBackground: "#132233",
    textSecondary: "#aaaaaa",
    placeholder: "#7b7b7c",
    accent: "#afa9ec",
    searchBorder: "#33334d",
    searchBackground: "#222232",
    mutedText: "#bbbbbb",
    textLight: "#e4e4f4",
    primary: "#534ab7",
    containerBackground: "#1e2040",
    separator: "#13152a",
    checkboxBorder: "#3a3c5e"
}

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        paddingTop: 14,
        //alignItems: "center",
        //justifyContent: "center",
        backgroundColor: GlobalColors.background,
    },
    font_title: {
        fontSize: 40,
        fontFamily: "astro_font_regular",
        color: GlobalColors.foreground,
        fontWeight: "bold",
    },
    font_subtitle: {
        fontSize: 24,
        fontFamily: "astro_font_regular",
        color: GlobalColors.foreground,
        opacity: 0.7
    },
    font_body: {
        fontSize: 16,
        fontFamily: "astro_font_regular",
        color: GlobalColors.foreground,
        //fontWeight: "normal",
    }
})