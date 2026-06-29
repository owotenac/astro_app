import { GlobalColors, globalStyles, Spacing, textStyles } from '@/global/theme'
import { useMountStore } from '@/hooks/useMountStore'
import { ASCOM_Telescope } from '@/utils/ascom_services'
import { formatToDMS } from '@/utils/compute'
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
            <View style={globalStyles.panelHeader}>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.textPrimary} />
                </TouchableOpacity>
                <Text style={textStyles.panelTitle}>Monture</Text>
            </View>

            {/* Connection Status */}
            <View style={globalStyles.statusContainer}>
                <View style={globalStyles.statusRow}>
                    <View style={[globalStyles.statusIndicator, isConnected && globalStyles.statusIndicatorConnected]} />
                    <Text style={textStyles.status}>
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
                <View style={globalStyles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color={GlobalColors.error} />
                    <Text style={globalStyles.errorMessage}>{error}</Text>
                </View>
            )}

            {/* Connection Buttons */}
            <View style={globalStyles.buttonRow}>
                <TouchableOpacity
                    style={[globalStyles.buttonPrimary, isConnected && globalStyles.buttonDisabled]}
                    onPress={handleConnect}
                    disabled={isConnected || isLoading}
                >
                    {connectionState === 'connecting' ? (
                        <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="lan-connect" size={20} color={GlobalColors.textPrimary} />
                            <Text style={textStyles.button}>Connecter</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[globalStyles.buttonPrimary, globalStyles.buttonDanger, !isConnected && globalStyles.buttonDisabled]}
                    onPress={handleDisconnect}
                    disabled={!isConnected || isLoading}
                >
                    {connectionState === 'disconnecting' ? (
                        <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="lan-disconnect" size={20} color={GlobalColors.textPrimary} />
                            <Text style={textStyles.button}>Déconnecter</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* position */}
            <View>
                <View style={globalStyles.cardSection}>
                    <View style={globalStyles.rowBetween}>
                        <Text style={globalStyles.sectionAccent}>Position</Text>
                        <TouchableOpacity onPress={handleActualPosition}>
                            <MaterialCommunityIcons name="refresh" size={20} color={GlobalColors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.coordsContainer}>
                        <View style={globalStyles.rowBetween}>
                            <Text style={textStyles.label}>Azimut</Text>
                            <Text style={textStyles.value}>{actualAz !== undefined ? formatToDMS(actualAz) : '--'}</Text>
                        </View>
                        <View style={globalStyles.rowBetween}>
                            <Text style={textStyles.label}>Altitude</Text>
                            <Text style={textStyles.value}>{actualAlt !== undefined ? formatToDMS(actualAlt) : '--'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[globalStyles.buttonPrimary, styles.showPositionButton, actualAz === undefined && globalStyles.buttonDisabled]}
                        onPress={() => {
                            if (actualAz !== undefined && actualAlt !== undefined) {
                                setMountPosition({ az: actualAz, alt: actualAlt })
                            }
                        }}
                        disabled={actualAz === undefined || actualAlt === undefined}
                    >
                        <MaterialCommunityIcons name="crosshairs-gps" size={20} color={GlobalColors.textPrimary} />
                        <Text style={textStyles.button}>Afficher sur la carte</Text>
                    </TouchableOpacity>

                </View>
            </View>

            {/* Slew Section */}
            <View style={[globalStyles.cardSection, slewMode && styles.slewSectionActive]}>
                <View style={globalStyles.rowBetween}>
                    <Text style={globalStyles.sectionAccent}>Pointage</Text>
                    <TouchableOpacity
                        style={[globalStyles.pillToggle, slewMode && globalStyles.pillToggleActive]}
                        onPress={toggleSlewMode}
                    >
                        <MaterialCommunityIcons
                            name={slewMode ? 'target' : 'target'}
                            size={18}
                            color={slewMode ? GlobalColors.background : GlobalColors.accent}
                        />
                        <Text style={[textStyles.accentSmall, slewMode && styles.modeToggleTextActive]}>
                            {slewMode ? 'Mode actif' : 'Sélectionner'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {slewMode && !targetPosition && (
                    <View style={globalStyles.calloutBox}>
                        <MaterialCommunityIcons name="gesture-tap" size={20} color={GlobalColors.accent} />
                        <Text style={[textStyles.accent, styles.instructionText]}>
                            Touchez un objet sur la carte du ciel
                        </Text>
                    </View>
                )}

                {targetPosition && (
                    <>
                        <View style={[globalStyles.row, styles.targetNameContainer]}>
                            <MaterialCommunityIcons name="star-four-points" size={16} color={GlobalColors.accent} />
                            <Text style={textStyles.headingSmall}>{targetPosition.name}</Text>
                        </View>
                            <View style={styles.coordsContainer}>
                            <View style={globalStyles.rowBetween}>
                                <Text style={textStyles.label}>Azimut</Text>
                                <Text style={textStyles.value}>{formatToDMS(targetPosition.az)}</Text>
                            </View>
                            <View style={globalStyles.rowBetween}>
                                <Text style={textStyles.label}>Altitude</Text>
                                <Text style={textStyles.value}>{formatToDMS(targetPosition.alt)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                globalStyles.buttonPrimary,
                                styles.slewButton,
                                !isConnected && globalStyles.buttonDisabled
                            ]}
                            onPress={handleSlew}
                            disabled={!isConnected || isSlewing}
                        >
                            {isSlewing ? (
                                <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="telescope" size={20} color={GlobalColors.textPrimary} />
                                    <Text style={textStyles.button}>Pointer</Text>
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
    coordsContainer: {
        marginBottom: Spacing.lg,
        gap: Spacing.md,
    },
    slewButton: {
        flex: 0,
    },
    showPositionButton: {
        flex: 0,
        marginTop: Spacing.md,
        backgroundColor: GlobalColors.accent,
    },
    slewSectionActive: {
        borderWidth: 2,
        borderColor: GlobalColors.accent,
    },
    modeToggleTextActive: {
        color: GlobalColors.background,
    },
    instructionText: {
        flex: 1,
    },
    targetNameContainer: {
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
})