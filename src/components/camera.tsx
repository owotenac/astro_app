import { GlobalColors, globalStyles, Spacing, textStyles } from '@/global/theme'
import { usePlateSolveStore } from '@/hooks/usePlateSolveStore'
import { useSettingsStore } from '@/hooks/useSettings'
import { ASCOM_Camera } from '@/utils/ascom_services'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

type ConnectionState = 'unknown' | 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

type Props = {
    onClose: () => void
}

const camera = new ASCOM_Camera()

const ICON_SIZE = 16

const Camera = ({ onClose }: Props) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('unknown')
    const [error, setError] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const [previewUri, setPreviewUri] = useState<string | null>(null)

    const cameraSettings = useSettingsStore(state => state.settings.camera)
    const updateCamera = useSettingsStore(state => state.updateCamera)

    const setCameraDimensions = usePlateSolveStore(state => state.setCameraDimensions)
    const cameraDimensions = usePlateSolveStore(state => state.cameraDimensions)

    const [gain, setGain] = useState<string>(cameraSettings.gain.toString())
    const [exposureTime, setExposureTime] = useState<string>(cameraSettings.exposureTime.toString())

    const isConnected = connectionState === 'connected'
    const isLoading = connectionState === 'connecting' || connectionState === 'disconnecting' || connectionState === 'unknown'

    useEffect(() => {
        setGain(cameraSettings.gain.toString())
        setExposureTime(cameraSettings.exposureTime.toString())
    }, [cameraSettings])

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const connected = await camera.isConnected()
                setConnectionState(connected.status as ConnectionState)
                if (connected.xsize && connected.ysize) {
                    setCameraDimensions({ xsize: connected.xsize, ysize: connected.ysize })
                }
            } catch {
                setConnectionState('disconnected')
            }
        }
        checkConnection()
    }, [])

    const handleConnect = async () => {
        setError(null)
        setConnectionState('connecting')
        try {
            const result = await camera.connect()
            setConnectionState('connected')
            if (result.xsize && result.ysize) {
                setCameraDimensions({ xsize: result.xsize, ysize: result.ysize })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de connexion')
            setConnectionState('disconnected')
        }
    }

    const handleDisconnect = async () => {
        setError(null)
        setConnectionState('disconnecting')
        try {
            await camera.disconnect()
            setConnectionState('disconnected')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de déconnexion')
            setConnectionState('connected')
        }
    }

    const handleStartCapture = async () => {
        setError(null)
        setIsCapturing(true)
        try {
            const gainValue = parseInt(gain, 10) || 100
            const exposureValue = parseFloat(exposureTime) || 5
            await updateCamera({ gain: gainValue, exposureTime: exposureValue })
            const imageUri = await camera.takeExposure(exposureValue, gainValue)
            setPreviewUri(imageUri)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de capture')
        } finally {
            setIsCapturing(false)
        }
    }

    const statusLabel = () => {
        switch (connectionState) {
            case 'unknown': return 'Vérification...'
            case 'disconnected': return 'Déconnecté'
            case 'connecting': return 'Connexion...'
            case 'connected': return 'Connecté'
            case 'disconnecting': return 'Déconnexion...'
        }
    }

    return (
        <View style={globalStyles.sidebarPanel}>
            <View style={globalStyles.panelHeader}>
                <TouchableOpacity style={globalStyles.panelBackButton} onPress={onClose}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={GlobalColors.textPrimary} />
                </TouchableOpacity>
                <Text style={textStyles.panelTitle}>Caméra</Text>
            </View>

            <ScrollView style={globalStyles.sidebarScroll} showsVerticalScrollIndicator={false}>
                <View style={globalStyles.statusPill}>
                    <View style={[globalStyles.statusIndicator, isConnected && globalStyles.statusIndicatorConnected]} />
                    <Text style={textStyles.status}>{statusLabel()}</Text>
                </View>

                {error && (
                    <View style={globalStyles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={14} color={GlobalColors.error} />
                        <Text style={globalStyles.errorMessage}>{error}</Text>
                    </View>
                )}

                <View style={globalStyles.connectionButtonRow}>
                    <TouchableOpacity
                        style={[globalStyles.buttonCompact, isConnected && globalStyles.buttonDisabled]}
                        onPress={handleConnect}
                        disabled={isConnected || isLoading}
                    >
                        {connectionState === 'connecting' ? (
                            <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="lan-connect" size={ICON_SIZE} color={GlobalColors.textPrimary} />
                                <Text style={textStyles.button}>Connecter</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            globalStyles.buttonCompactSecondary,
                            globalStyles.buttonCompactDanger,
                            !isConnected && globalStyles.buttonDisabled,
                        ]}
                        onPress={handleDisconnect}
                        disabled={!isConnected || isLoading}
                    >
                        {connectionState === 'disconnecting' ? (
                            <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="lan-disconnect" size={ICON_SIZE} color={GlobalColors.textSecondary} />
                                <Text style={[textStyles.button, styles.dangerButtonText]}>Déconnecter</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={globalStyles.sidebarSection}>
                    <Text style={globalStyles.sectionAccent}>Paramètres de capture</Text>

                    <View style={[globalStyles.row, styles.inputRow]}>
                        <View style={styles.inputGroup}>
                            <Text style={[textStyles.sectionLabel, styles.inputLabel]}>Gain</Text>
                            <TextInput
                                style={globalStyles.searchBar}
                                value={gain}
                                onChangeText={setGain}
                                keyboardType="numeric"
                                placeholder="100"
                                placeholderTextColor={GlobalColors.placeholder}
                                editable={isConnected && !isCapturing}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[textStyles.sectionLabel, styles.inputLabel]}>Exposition (s)</Text>
                            <TextInput
                                style={globalStyles.searchBar}
                                value={exposureTime}
                                onChangeText={setExposureTime}
                                keyboardType="numeric"
                                placeholder="5"
                                placeholderTextColor={GlobalColors.placeholder}
                                editable={isConnected && !isCapturing}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[globalStyles.buttonBlock, (!isConnected || isCapturing) && globalStyles.buttonDisabled]}
                        onPress={handleStartCapture}
                        disabled={!isConnected || isCapturing}
                    >
                        {isCapturing ? (
                            <>
                                <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                                <Text style={textStyles.button}>Capture en cours...</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="camera" size={ICON_SIZE} color={GlobalColors.textPrimary} />
                                <Text style={textStyles.button}>Démarrer la capture</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={globalStyles.sidebarSection}>
                    <Text style={globalStyles.sectionAccent}>Aperçu</Text>
                    <View style={[globalStyles.insetBox, styles.previewContainer]}>
                        {previewUri && cameraDimensions ? (
                            <Image
                                source={{ uri: previewUri }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.previewPlaceholder}>
                                <MaterialCommunityIcons name="image-off" size={32} color={GlobalColors.textMuted} />
                                <Text style={textStyles.hint}>Aucune capture</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

export default Camera

const styles = StyleSheet.create({
    dangerButtonText: {
        color: GlobalColors.textSecondary,
    },
    inputRow: {
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        marginBottom: Spacing.xs,
    },
    previewContainer: {
        minHeight: 200,
        padding: 0,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 200,
    },
    previewPlaceholder: {
        minHeight: 200,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
})
