import { TextStyle, ViewStyle, StyleSheet } from "react-native"

export const GlobalColors = {
    background: "#080127ff",
    foreground: "#ffffff",
    nightMode: "#e00",
    border: "#555"
}

export const Theme = {
    fonts: {
        title: {
            fontSize: 32,
            color: GlobalColors.foreground,
            fontWeight: "bold",
        } as TextStyle,
        subtitle: {
            fontSize: 24,
            color: GlobalColors.foreground,
        },
        body: {
            fontSize: 16,
            color: GlobalColors.foreground,
            //fontWeight: "normal",
        },
    }
    
}

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 5,
        paddingTop: 14,
        //alignItems: "center",
        //justifyContent: "center",
        backgroundColor: GlobalColors.background,
    },
})