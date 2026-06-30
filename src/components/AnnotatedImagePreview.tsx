import { GlobalColors, Spacing, textStyles } from '@/global/theme';
import { Annotation } from '@/model/platesolve_types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Image,
    LayoutChangeEvent,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

type Props = {
    imageUri: string;
    annotations: Annotation[];
    imageDimensions: { width: number; height: number };
};

type ContainerSize = {
    width: number;
    height: number;
};

type ScalingInfo = {
    scale: number;
    offsetX: number;
    offsetY: number;
};

function computeScaling(
    containerSize: ContainerSize,
    imageDimensions: { width: number; height: number }
): ScalingInfo {
    const containerRatio = containerSize.width / containerSize.height;
    const imageRatio = imageDimensions.width / imageDimensions.height;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > containerRatio) {
        // Image plus large que le container → contrainte par la largeur
        scale = containerSize.width / imageDimensions.width;
        const scaledHeight = imageDimensions.height * scale;
        offsetY = (containerSize.height - scaledHeight) / 2;
    } else {
        // Image plus haute que le container → contrainte par la hauteur
        scale = containerSize.height / imageDimensions.height;
        const scaledWidth = imageDimensions.width * scale;
        offsetX = (containerSize.width - scaledWidth) / 2;
    }

    return { scale, offsetX, offsetY };
}

type AnnotationOverlayProps = {
    annotations: Annotation[];
    imageDimensions: { width: number; height: number };
    containerSize: ContainerSize;
};

function AnnotationOverlay({ annotations, imageDimensions, containerSize }: AnnotationOverlayProps) {
    const { scale, offsetX, offsetY } = useMemo(
        () => computeScaling(containerSize, imageDimensions),
        [containerSize, imageDimensions]
    );

    return (
        <>
            {annotations.map((annotation, index) => {
                const displayX = offsetX + annotation.pixelx * scale;
                const displayY = offsetY + annotation.pixely * scale;
                const name = annotation.names?.[0] ?? '';

                return (
                    <View
                        key={index}
                        style={[styles.annotationContainer, { left: displayX, top: displayY }]}
                    >
                        <View style={styles.annotationMarker} />
                        {name && <Text style={styles.annotationLabel}>{name}</Text>}
                    </View>
                );
            })}
        </>
    );
}

export default function AnnotatedImagePreview({ imageUri, annotations, imageDimensions }: Props) {
    const [containerSize, setContainerSize] = useState<ContainerSize | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerSize({ width, height });
    }, []);

    const fullscreenContainerSize = useMemo(
        () => ({ width: screenWidth, height: screenHeight }),
        [screenWidth, screenHeight]
    );

    return (
        <>
            <TouchableOpacity
                style={styles.container}
                onPress={() => setFullscreen(true)}
                activeOpacity={0.9}
            >
                <View style={styles.imageWrapper} onLayout={handleLayout}>
                    <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
                    {containerSize && annotations.length > 0 && (
                        <AnnotationOverlay
                            annotations={annotations}
                            imageDimensions={imageDimensions}
                            containerSize={containerSize}
                        />
                    )}
                </View>
            </TouchableOpacity>

            <Modal
                visible={fullscreen}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setFullscreen(false)}
            >
                <View style={styles.fullscreenContainer}>
                    <Image source={{ uri: imageUri }} style={styles.fullscreenImage} resizeMode="contain" />
                    {annotations.length > 0 && (
                        <AnnotationOverlay
                            annotations={annotations}
                            imageDimensions={imageDimensions}
                            containerSize={fullscreenContainerSize}
                        />
                    )}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setFullscreen(false)}
                    >
                        <MaterialCommunityIcons name="close" size={28} color={GlobalColors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageWrapper: {
        flex: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    annotationContainer: {
        position: 'absolute',
        alignItems: 'center',
        transform: [{ translateX: -1 }, { translateY: -1 }],
    },
    annotationMarker: {
        width: 10,
        height: 10,
        borderRadius: 6,
        //backgroundColor: GlobalColors.accent,
        borderWidth: 2,
        borderColor: GlobalColors.textPrimary,
    },
    annotationLabel: {
        ...textStyles.small,
        color: GlobalColors.textPrimary,
        backgroundColor: GlobalColors.overlayDark,
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
        overflow: 'hidden',
    },
    fullscreenContainer: {
        flex: 1,
        backgroundColor: GlobalColors.background,
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.xl,
        right: Spacing.lg,
        padding: Spacing.sm,
        backgroundColor: GlobalColors.overlayDark,
        borderRadius: 20,
    },
});
