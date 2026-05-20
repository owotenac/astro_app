import { StyleSheet } from "react-native"

export const GlobalColors = {
    background: "#040a14",
    foreground: "#ffffff",
    nightMode: "#e00",
    border: "#555"
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
        fontSize: 32,
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