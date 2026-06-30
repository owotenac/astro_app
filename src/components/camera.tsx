import { GlobalColors, globalStyles, Spacing, textStyles } from '@/global/theme'
import { usePlateSolveStore } from '@/hooks/usePlateSolveStore'
import { useSettingsStore } from '@/hooks/useSettings'
import { Annotation } from '@/model/platesolve_types'
import { ASCOM_Camera, ASCOM_plate_solver, PlateSolveResult } from '@/utils/ascom_services'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import AnnotatedImagePreview from './AnnotatedImagePreview'

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

const ICON_SIZE = 16

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
    const cameraDimensions = usePlateSolveStore(state => state.cameraDimensions)

    const [annotations, setAnnotations] = useState<Annotation[]>([]);

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
                        setAnnotations(result.annotations)
                        console.log('Plate solved:', result.annotations)
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
                            <AnnotatedImagePreview
                                imageUri={previewUri}
                                annotations={annotations}
                                imageDimensions={{ width: cameraDimensions.xsize, height: cameraDimensions.ysize }}
                            />
                        ) : (
                            <View style={styles.previewPlaceholder}>
                                <MaterialCommunityIcons name="image-off" size={32} color={GlobalColors.textMuted} />
                                <Text style={textStyles.hint}>Aucune capture</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[globalStyles.buttonCompact, (!isConnected || isCapturing || isSolving) && globalStyles.buttonDisabled]}
                        onPress={handlePlateSolving}
                        disabled={!isConnected || isCapturing || isSolving}
                    >
                        {isSolving ? (
                            <>
                                <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                                <Text style={textStyles.button}>{getSolveStatusText()}</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="crosshairs-gps" size={ICON_SIZE} color={GlobalColors.textPrimary} />
                                <Text style={textStyles.button}>Plate Solving</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {solveState.status === 'solved' && (
                        <View style={globalStyles.resultBox}>
                            <Text style={[textStyles.success, styles.resultTitle]}>Résultat</Text>
                            <View style={globalStyles.kvRow}>
                                <Text style={textStyles.rowLabel}>RA</Text>
                                <Text style={textStyles.rowValue}>{solveState.result.calibration.ra.toFixed(4)}°</Text>
                            </View>
                            <View style={globalStyles.kvRow}>
                                <Text style={textStyles.rowLabel}>Dec</Text>
                                <Text style={textStyles.rowValue}>{solveState.result.calibration.dec.toFixed(4)}°</Text>
                            </View>
                            <View style={globalStyles.kvRow}>
                                <Text style={textStyles.rowLabel}>Orientation</Text>
                                <Text style={textStyles.rowValue}>{solveState.result.calibration.orientation.toFixed(1)}°</Text>
                            </View>
                            <View style={[globalStyles.kvRow, styles.kvRowLast]}>
                                <Text style={textStyles.rowLabel}>Échelle</Text>
                                <Text style={textStyles.rowValue}>{solveState.result.calibration.pixscale.toFixed(2)} "/px</Text>
                            </View>
                        </View>
                    )}

                    {solveState.status === 'failed' && (
                        <View style={globalStyles.errorContainer}>
                            <MaterialCommunityIcons name="alert-circle" size={14} color={GlobalColors.error} />
                            <Text style={globalStyles.errorMessage}>{solveState.message}</Text>
                        </View>
                    )}
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
        marginBottom: Spacing.sm,
        padding: 0,
        overflow: 'hidden',
    },
    previewPlaceholder: {
        minHeight: 200,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    resultTitle: {
        marginBottom: Spacing.sm,
    },
    kvRowLast: {
        borderBottomWidth: 0,
    },
})
