import { GlobalColors, globalStyles, Spacing, textStyles } from '@/global/theme'
import { usePlateSolveStore } from '@/hooks/usePlateSolveStore'
import { useSettingsStore } from '@/hooks/useSettings'
import { ASCOM_plate_solver, ASCOM_Telescope } from '@/utils/ascom_services'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import AnnotatedImagePreview from './AnnotatedImagePreview'

type SolveStatus = 'idle' | 'capturing' | 'submitting' | 'polling' | 'solved' | 'failed'

type Props = {
    onClose: () => void
}

const plate_solver = new ASCOM_plate_solver()
const telescope = new ASCOM_Telescope()

const ICON_SIZE = 16

const PlateSolving = ({ onClose }: Props) => {
    const [error, setError] = useState<string | null>(null)
    const [solveStatus, setSolveStatus] = useState<SolveStatus>('idle')
    const [submissionId, setSubmissionId] = useState<number | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    const cameraSettings = useSettingsStore(state => state.settings.camera)
    const updateCamera = useSettingsStore(state => state.updateCamera)

    const lastResult = usePlateSolveStore(state => state.lastResult)
    const setLastResult = usePlateSolveStore(state => state.setLastResult)
    const cameraDimensions = usePlateSolveStore(state => state.cameraDimensions)

    const [gain, setGain] = useState<string>(cameraSettings.gain.toString())
    const [exposureTime, setExposureTime] = useState<string>(cameraSettings.exposureTime.toString())

    useEffect(() => {
        setGain(cameraSettings.gain.toString())
        setExposureTime(cameraSettings.exposureTime.toString())
    }, [cameraSettings])

    useEffect(() => {
        if (solveStatus !== 'polling' || !submissionId) {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
                pollingRef.current = null
            }
            return
        }

        const tick = async () => {
            try {
                const status = await plate_solver.plateStatus(submissionId)

                if (status.job_id && status.job_status === 'success') {
                    const result = await plate_solver.getPlateSolveResult(status.job_id)
                    setLastResult({
                        calibration: result.calibration,
                        annotations: result.annotations,
                        imageUri: lastResult?.imageUri || '',
                    })
                    setSolveStatus('solved')
                } else if (status.job_status === 'failure') {
                    setError('La résolution a échoué')
                    setSolveStatus('failed')
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur de statut')
                setSolveStatus('failed')
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
    }, [solveStatus, submissionId])

    const handlePlateSolving = async () => {
        setError(null)
        setSolveStatus('capturing')
        try {
            const gainValue = parseInt(gain, 10) || 100
            const exposureValue = parseFloat(exposureTime) || 5
            await updateCamera({ gain: gainValue, exposureTime: exposureValue })

            setSolveStatus('submitting')
            const result = await plate_solver.plateSolve(exposureValue, gainValue)
            setLastResult({
                calibration: lastResult?.calibration || { ra: 0, dec: 0, orientation: 0, pixscale: 0, radius: 0, parity: 0 },
                annotations: [],
                imageUri: result.image,
            })
            setSubmissionId(result.submission_id)
            setSolveStatus('polling')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur')
            setSolveStatus('failed')
        }
    }

    const handleSyncMount = async () => {
        if (!lastResult) return
        setError(null)
        setIsSyncing(true)
        try {
            const raHours = lastResult.calibration.ra / 15
            await telescope.syncToRaDec(raHours, lastResult.calibration.dec)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de synchronisation')
        } finally {
            setIsSyncing(false)
        }
    }

    const isSolving = solveStatus === 'capturing' || solveStatus === 'submitting' || solveStatus === 'polling'
    const hasResult = lastResult && lastResult.calibration.ra !== 0

    const getSolveStatusText = (): string => {
        switch (solveStatus) {
            case 'capturing': return 'Capture en cours...'
            case 'submitting': return 'Soumission...'
            case 'polling': return 'En attente...'
            case 'solved': return 'Résolu !'
            case 'failed': return error || 'Erreur'
            default: return 'Résolution'
        }
    }

    return (
        <View style={globalStyles.sidebarPanel}>
            <View style={globalStyles.panelHeader}>
                <TouchableOpacity style={globalStyles.panelBackButton} onPress={onClose}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={GlobalColors.textPrimary} />
                </TouchableOpacity>
                <Text style={textStyles.panelTitle}>Plate Solving</Text>
            </View>

            <ScrollView style={globalStyles.sidebarScroll} showsVerticalScrollIndicator={false}>
                {error && (
                    <View style={globalStyles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={14} color={GlobalColors.error} />
                        <Text style={globalStyles.errorMessage}>{error}</Text>
                    </View>
                )}

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
                                editable={!isSolving}
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
                                editable={!isSolving}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[globalStyles.buttonBlock, isSolving && globalStyles.buttonDisabled]}
                        onPress={handlePlateSolving}
                        disabled={isSolving}
                    >
                        {isSolving ? (
                            <>
                                <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                                <Text style={textStyles.button}>{getSolveStatusText()}</Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="crosshairs-gps" size={ICON_SIZE} color={GlobalColors.textPrimary} />
                                <Text style={textStyles.button}>Lancer le Plate Solving</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={globalStyles.sidebarSection}>
                    <Text style={globalStyles.sectionAccent}>Aperçu</Text>
                    <View style={[globalStyles.insetBox, styles.previewContainer]}>
                        {lastResult?.imageUri && cameraDimensions ? (
                            <AnnotatedImagePreview
                                imageUri={lastResult.imageUri}
                                annotations={lastResult.annotations}
                                imageDimensions={{ width: cameraDimensions.xsize, height: cameraDimensions.ysize }}
                            />
                        ) : (
                            <View style={styles.previewPlaceholder}>
                                <MaterialCommunityIcons name="image-off" size={32} color={GlobalColors.textMuted} />
                                <Text style={textStyles.hint}>Aucune capture</Text>
                            </View>
                        )}
                    </View>
                </View>

                {hasResult && (
                    <View style={globalStyles.sidebarSection}>
                        <View style={globalStyles.resultBox}>
                            <Text style={[textStyles.success, styles.resultTitle]}>Résultat</Text>
                            <View style={globalStyles.kvRow}>
                                <Text style={textStyles.rowLabel}>RA</Text>
                                <Text style={textStyles.rowValue}>{lastResult.calibration.ra.toFixed(4)}°</Text>
                            </View>
                            <View style={globalStyles.kvRow}>
                                <Text style={textStyles.rowLabel}>Dec</Text>
                                <Text style={textStyles.rowValue}>{lastResult.calibration.dec.toFixed(4)}°</Text>
                            </View>
                            <View style={globalStyles.kvRow}>
                                <Text style={textStyles.rowLabel}>Orientation</Text>
                                <Text style={textStyles.rowValue}>{lastResult.calibration.orientation.toFixed(1)}°</Text>
                            </View>
                            <View style={[globalStyles.kvRow, styles.kvRowLast]}>
                                <Text style={textStyles.rowLabel}>Échelle</Text>
                                <Text style={textStyles.rowValue}>{lastResult.calibration.pixscale.toFixed(2)} "/px</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[globalStyles.buttonBlock, isSyncing && globalStyles.buttonDisabled]}
                            onPress={handleSyncMount}
                            disabled={isSyncing}
                        >
                            {isSyncing ? (
                                <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="sync" size={ICON_SIZE} color={GlobalColors.textPrimary} />
                                    <Text style={textStyles.button}>Sync Mount</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

export default PlateSolving

const styles = StyleSheet.create({
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
