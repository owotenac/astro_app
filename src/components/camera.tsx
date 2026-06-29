import { GlobalColors, globalStyles } from '@/global/theme'
import { usePlateSolveStore } from '@/hooks/usePlateSolveStore'
import { useSettingsStore } from '@/hooks/useSettings'
import { ASCOM_Camera, ASCOM_plate_solver, PlateSolveResult } from '@/utils/ascom_services'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

type ConnectionState = 'unknown' | 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

type SolveState =
    | { status: 'idle' }
    | { status: 'capturing' }
    | { status: 'submitting' }
    | { status: 'polling'; submissionId: number; jobId?: number }
    | { status: 'solved'; result: PlateSolveResult }
    | { status: 'failed'; message: string }

type Props = {
    onClose: () => void
}

const camera = new ASCOM_Camera()
const plate_solver = new ASCOM_plate_solver()

const Camera = ({ onClose }: Props) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('unknown')
    const [error, setError] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const [previewUri, setPreviewUri] = useState<string | null>(null)
    const [solveState, setSolveState] = useState<SolveState>({ status: 'idle' })
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    const cameraSettings = useSettingsStore(state => state.settings.camera)
    const updateCamera = useSettingsStore(state => state.updateCamera)

    const setCalibration = usePlateSolveStore(state => state.setCalibration)
    const setCameraDimensions = usePlateSolveStore(state => state.setCameraDimensions)

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
                setConnectionState(connected as ConnectionState)
            } catch {
                setConnectionState('disconnected')
            }
        }
        checkConnection()
    }, [])

    useEffect(() => {
        if (solveState.status !== 'polling') {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
                pollingRef.current = null
            }
            return
        }

        const submissionId = solveState.submissionId

        const tick = async () => {
            try {
                const status = await plate_solver.plateStatus(submissionId)
                console.log('Plate solve status:', status)

                if (status.job_id && status.job_status === 'success') {
                    const result = await plate_solver.getPlateSolveResult(status.job_id)
                    if (result) {
                        setSolveState({ status: 'solved', result })
                        setCalibration(result.calibration)
                        console.log('Plate solved:', result)
                    } else {
                        setSolveState({ status: 'failed', message: 'Échec de récupération du résultat' })
                    }
                } else if (status.job_status === 'failure') {
                    setSolveState({ status: 'failed', message: 'La résolution a échoué' })
                }
            } catch (err) {
                console.error('Plate solve status error:', err)
                setSolveState({ status: 'failed', message: err instanceof Error ? err.message : 'Erreur de statut' })
            }
        }

        tick()
        pollingRef.current = setInterval(tick, 10000)

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
                pollingRef.current = null
            }
        }
    }, [solveState.status, solveState.status === 'polling' ? solveState.submissionId : null])

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
            if (imageUri) {
                setPreviewUri(imageUri)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de capture')
        } finally {
            setIsCapturing(false)
        }
    }

    const handlePlateSolving = async () => {
        setError(null)
        setSolveState({ status: 'capturing' })
        try {
            const gainValue = parseInt(gain, 10) || 100
            const exposureValue = parseFloat(exposureTime) || 5
            await updateCamera({ gain: gainValue, exposureTime: exposureValue })

            setSolveState({ status: 'submitting' })
            const result = await plate_solver.plateSolve(exposureValue, gainValue)

            if (result) {
                setSolveState({ status: 'polling', submissionId: result.submission_id })
                //get the image from result
                setPreviewUri(result.image)
            } else {
                setSolveState({ status: 'failed', message: 'Échec de soumission' })
            }
        } catch (err) {
            setSolveState({ status: 'failed', message: err instanceof Error ? err.message : 'Erreur de capture' })
        }
    }

    const isSolving = solveState.status !== 'idle' && solveState.status !== 'solved' && solveState.status !== 'failed'

    const getSolveStatusText = (): string => {
        switch (solveState.status) {
            case 'capturing': return 'Capture en cours...'
            case 'submitting': return 'Soumission...'
            case 'polling': return solveState.jobId ? 'Résolution en cours...' : 'En attente...'
            case 'solved': return 'Résolu !'
            case 'failed': return solveState.message
            default: return 'Résolution'
        }
    }

    return (
        <View style={globalStyles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.white} />
                </TouchableOpacity>
                <Text style={globalStyles.font_subtitle}>Caméra</Text>
            </View>

            {/* Connection Status */}
            <View style={styles.statusContainer}>
                <View style={styles.statusRow}>
                    <View style={[styles.statusIndicator, isConnected && styles.statusIndicatorConnected]} />
                    <Text style={styles.statusText}>
                        {connectionState === 'unknown' && 'Vérification...'}
                        {connectionState === 'disconnected' && 'Déconnecté'}
                        {connectionState === 'connecting' && 'Connexion...'}
                        {connectionState === 'connected' && 'Connecté'}
                        {connectionState === 'disconnecting' && 'Déconnexion...'}
                    </Text>
                </View>
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color={GlobalColors.nightMode} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Connection Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, isConnected && styles.buttonDisabled]}
                    onPress={handleConnect}
                    disabled={isConnected || isLoading}
                >
                    {connectionState === 'connecting' ? (
                        <ActivityIndicator color={GlobalColors.white} size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="lan-connect" size={20} color={GlobalColors.white} />
                            <Text style={styles.buttonText}>Connecter</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.buttonDanger, !isConnected && styles.buttonDisabled]}
                    onPress={handleDisconnect}
                    disabled={!isConnected || isLoading}
                >
                    {connectionState === 'disconnecting' ? (
                        <ActivityIndicator color={GlobalColors.white} size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="lan-disconnect" size={20} color={GlobalColors.white} />
                            <Text style={styles.buttonText}>Déconnecter</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}>

                {/* Capture Settings */}
                <View style={styles.captureSection}>
                    <Text style={styles.sectionTitle}>Paramètres de capture</Text>

                    <View style={styles.inputRow}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Gain</Text>
                            <TextInput
                                style={styles.input}
                                value={gain}
                                onChangeText={setGain}
                                keyboardType="numeric"
                                placeholder="100"
                                placeholderTextColor={GlobalColors.placeholder}
                                editable={isConnected && !isCapturing}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Exposition (s)</Text>
                            <TextInput
                                style={styles.input}
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
                        style={[styles.button, styles.captureButton, (!isConnected || isCapturing) && styles.buttonDisabled]}
                        onPress={handleStartCapture}
                        disabled={!isConnected || isCapturing}
                    >
                        {isCapturing ? (
                            <>
                                <ActivityIndicator color={GlobalColors.white} size="small" />
                                <Text style={styles.buttonText}>Capture en cours...</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="camera" size={20} color={GlobalColors.white} />
                                <Text style={styles.buttonText}>Démarrer la capture</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Preview */}
                <View style={styles.previewSection}>
                    <Text style={styles.sectionTitle}>Aperçu</Text>
                    <View style={styles.previewContainer}>
                        {previewUri ? (
                            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
                        ) : (
                            <View style={styles.previewPlaceholder}>
                                <MaterialCommunityIcons name="image-off" size={48} color={GlobalColors.textSecondary} />
                                <Text style={styles.previewPlaceholderText}>Aucune capture</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.button, styles.captureButton, (!isConnected || isCapturing || isSolving) && styles.buttonDisabled]}
                        onPress={handlePlateSolving}
                        disabled={!isConnected || isCapturing || isSolving}
                    >
                        {isSolving ? (
                            <>
                                <ActivityIndicator color={GlobalColors.white} size="small" />
                                <Text style={styles.buttonText}>{getSolveStatusText()}</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={GlobalColors.white} />
                                <Text style={styles.buttonText}>Plate Solving</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {solveState.status === 'solved' && (
                        <View style={styles.resultContainer}>
                            <Text style={styles.resultTitle}>Résultat</Text>
                            <Text style={styles.resultText}>
                                RA: {solveState.result.calibration.ra.toFixed(4)}°
                            </Text>
                            <Text style={styles.resultText}>
                                Dec: {solveState.result.calibration.dec.toFixed(4)}°
                            </Text>
                            <Text style={styles.resultText}>
                                Orientation: {solveState.result.calibration.orientation.toFixed(1)}°
                            </Text>
                            <Text style={styles.resultText}>
                                Échelle: {solveState.result.calibration.pixscale.toFixed(2)} "/px
                            </Text>
                            {solveState.result.annotations.length > 0 && (
                                <Text style={styles.resultText}>
                                    Objets: {solveState.result.annotations
                                        .filter(a => a.names)
                                        .map(a => a.names?.[0])
                                        .slice(0, 5)
                                        .join(', ')}
                                </Text>
                            )}
                        </View>
                    )}

                    {solveState.status === 'failed' && (
                        <View style={styles.errorContainer}>
                            <MaterialCommunityIcons name="alert-circle" size={16} color={GlobalColors.nightMode} />
                            <Text style={styles.errorText}>{solveState.message}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    )
}

export default Camera

const styles = StyleSheet.create({
    header: {
        padding: 5,
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: GlobalColors.textSecondary,
    },
    statusIndicatorConnected: {
        backgroundColor: '#4ade80',
    },
    statusText: {
        color: GlobalColors.white,
        fontSize: 16,
    },
    errorContainer: {
        marginTop: 10,
        padding: 12,
        backgroundColor: 'rgba(224, 0, 0, 0.15)',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    errorText: {
        color: GlobalColors.nightMode,
        fontSize: 14,
        flex: 1,
    },
    buttonContainer: {
        marginTop: 20,
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: GlobalColors.primary,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    buttonDanger: {
        backgroundColor: '#991b1b',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: GlobalColors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    captureSection: {
        marginTop: 20,
        padding: 15,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: 10,
    },
    sectionTitle: {
        color: GlobalColors.accent,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 15,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        color: GlobalColors.textSecondary,
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: GlobalColors.searchBackground,
        borderWidth: 1,
        borderColor: GlobalColors.searchBorder,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        color: GlobalColors.white,
        fontSize: 16,
    },
    captureButton: {
        flex: 0,
        backgroundColor: GlobalColors.accent,
    },
    previewSection: {
        marginTop: 20,
        padding: 15,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: 10,
        flex: 1,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: GlobalColors.background,
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 250,
        marginBottom: 15,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    previewPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    previewPlaceholderText: {
        color: GlobalColors.textSecondary,
        fontSize: 14,
    },
    resultContainer: {
        marginTop: 15,
        padding: 12,
        backgroundColor: GlobalColors.background,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4ade80',
    },
    resultTitle: {
        color: '#4ade80',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    resultText: {
        color: GlobalColors.white,
        fontSize: 13,
        marginBottom: 4,
    },
})