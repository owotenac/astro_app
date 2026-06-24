import { GlobalColors, globalStyles } from '@/global/theme'
import { useMountStore } from '@/hooks/useMountStore'
import { formatToDMS } from '@/utils/compute'
import { ASCOM_Telescope } from '@/utils/mount'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type ConnectionState = 'unknown' | 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

type Props = {
    onClose: () => void
}

const telescope = new ASCOM_Telescope()

const Mount = ({ onClose }: Props) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('unknown')
    const [error, setError] = useState<string | null>(null)
    const [isSlewing, setIsSlewing] = useState(false)

    const [actualAz, setActualAz] = useState<number | undefined>(undefined)
    const [actualAlt, setActualAlt] = useState<number | undefined>(undefined)

    const setMountPosition = useMountStore(state => state.setMountPosition)
    const slewMode = useMountStore(state => state.slewMode)
    const setSlewMode = useMountStore(state => state.setSlewMode)
    const targetPosition = useMountStore(state => state.targetPosition)
    const clearTargetPosition = useMountStore(state => state.clearTargetPosition)

    const isConnected = connectionState === 'connected'
    const isLoading = connectionState === 'connecting' || connectionState === 'disconnecting' || connectionState === 'unknown'

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const connected = await telescope.isConnected()
                setConnectionState(connected as ConnectionState)
                // get actual position
                //if (isConnected) {
                const position = await telescope.getPosition()
                setActualAz(position.az)
                setActualAlt(position.alt)
                //}
            } catch {
                setConnectionState('disconnected')
            }
        }
        checkConnection()
    }, [])

    const handleActualPosition = async () => {
        try {
            const position = await telescope.getPosition()
            setActualAz(position.az)
            setActualAlt(position.alt)
        } catch {
            setError('Erreur de récupération de la position')
        }
    }

    const handleConnect = async () => {
        setError(null)
        setConnectionState('connecting')
        try {
            await telescope.connect()
            setConnectionState('connected')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de connexion')
            setConnectionState('disconnected')
        }
    }

    const handleDisconnect = async () => {
        setError(null)
        setConnectionState('disconnecting')
        try {
            await telescope.disconnect()
            setConnectionState('disconnected')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de déconnexion')
            setConnectionState('connected')
        }
    }

    const handleSlew = async () => {
        if (!targetPosition) return
        setError(null)
        setIsSlewing(true)
        try {
            await telescope.slew(targetPosition.az, targetPosition.alt)
            clearTargetPosition()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de pointage')
        } finally {
            setIsSlewing(false)
        }
    }

    const toggleSlewMode = () => {
        setSlewMode(!slewMode)
        if (slewMode) {
            clearTargetPosition()
        }
    }

    const formatCoord = (value: number | undefined, suffix: string) => {
        if (value === undefined) return '--'
        return `${value.toFixed(2)}${suffix}`
    }

    return (
        <View style={globalStyles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.white} />
                </TouchableOpacity>
                <Text style={globalStyles.font_subtitle}>Monture</Text>
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

            {/* position */}
            <View>
                <View style={styles.slewSection}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.sectionTitle}>Position</Text>
                        <TouchableOpacity onPress={handleActualPosition}>
                            <MaterialCommunityIcons name="refresh" size={20} color={GlobalColors.white} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.coordsContainer}>
                        <View style={styles.coordRow}>
                            <Text style={styles.coordLabel}>Azimut</Text>
                            <Text style={styles.coordValue}>{actualAz !== undefined ? formatToDMS(actualAz) : '--'}</Text>
                        </View>
                        <View style={styles.coordRow}>
                            <Text style={styles.coordLabel}>Altitude</Text>
                            <Text style={styles.coordValue}>{actualAlt !== undefined ? formatToDMS(actualAlt) : '--'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.showPositionButton, actualAz === undefined && styles.buttonDisabled]}
                        onPress={() => {
                            if (actualAz !== undefined && actualAlt !== undefined) {
                                setMountPosition({ az: actualAz, alt: actualAlt })
                            }
                        }}
                        disabled={actualAz === undefined || actualAlt === undefined}
                    >
                        <MaterialCommunityIcons name="crosshairs-gps" size={20} color={GlobalColors.white} />
                        <Text style={styles.buttonText}>Afficher sur la carte</Text>
                    </TouchableOpacity>

                </View>
            </View>

            {/* Slew Section */}
            <View style={[styles.slewSection, slewMode && styles.slewSectionActive]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.sectionTitle}>Pointage</Text>
                    <TouchableOpacity
                        style={[styles.modeToggle, slewMode && styles.modeToggleActive]}
                        onPress={toggleSlewMode}
                    >
                        <MaterialCommunityIcons
                            name={slewMode ? 'target' : 'target'}
                            size={18}
                            color={slewMode ? GlobalColors.background : GlobalColors.accent}
                        />
                        <Text style={[styles.modeToggleText, slewMode && styles.modeToggleTextActive]}>
                            {slewMode ? 'Mode actif' : 'Sélectionner'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {slewMode && !targetPosition && (
                    <View style={styles.instructionContainer}>
                        <MaterialCommunityIcons name="gesture-tap" size={20} color={GlobalColors.accent} />
                        <Text style={styles.instructionText}>
                            Touchez un objet sur la carte du ciel
                        </Text>
                    </View>
                )}

                {targetPosition && (
                    <>
                        <View style={styles.targetNameContainer}>
                            <MaterialCommunityIcons name="star-four-points" size={16} color={GlobalColors.accent} />
                            <Text style={styles.targetName}>{targetPosition.name}</Text>
                        </View>
                        <View style={styles.coordsContainer}>
                            <View style={styles.coordRow}>
                                <Text style={styles.coordLabel}>Azimut</Text>
                                <Text style={styles.coordValue}>{formatToDMS(targetPosition.az)}</Text>
                            </View>
                            <View style={styles.coordRow}>
                                <Text style={styles.coordLabel}>Altitude</Text>
                                <Text style={styles.coordValue}>{formatToDMS(targetPosition.alt)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.slewButton,
                                !isConnected && styles.buttonDisabled
                            ]}
                            onPress={handleSlew}
                            disabled={!isConnected || isSlewing}
                        >
                            {isSlewing ? (
                                <ActivityIndicator color={GlobalColors.white} size="small" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="telescope" size={20} color={GlobalColors.white} />
                                    <Text style={styles.buttonText}>Pointer</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    )
}

export default Mount

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
    slewSection: {
        marginTop: 30,
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
    coordsContainer: {
        marginBottom: 15,
        gap: 10,
    },
    coordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coordLabel: {
        color: GlobalColors.textSecondary,
        fontSize: 14,
    },
    coordValue: {
        color: GlobalColors.white,
        fontSize: 16,
        fontWeight: '500',
    },
    slewButton: {
        flex: 0,
    },
    showPositionButton: {
        flex: 0,
        marginTop: 10,
        backgroundColor: GlobalColors.accent,
    },
    slewSectionActive: {
        borderWidth: 2,
        borderColor: GlobalColors.accent,
    },
    modeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: GlobalColors.accent,
    },
    modeToggleActive: {
        backgroundColor: GlobalColors.accent,
    },
    modeToggleText: {
        color: GlobalColors.accent,
        fontSize: 12,
        fontWeight: '600',
    },
    modeToggleTextActive: {
        color: GlobalColors.background,
    },
    instructionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        backgroundColor: 'rgba(175, 169, 236, 0.1)',
        borderRadius: 8,
        marginBottom: 10,
    },
    instructionText: {
        color: GlobalColors.accent,
        fontSize: 14,
        flex: 1,
    },
    targetNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    targetName: {
        color: GlobalColors.white,
        fontSize: 18,
        fontWeight: '600',
    },
})