import { GlobalColors, globalStyles, Radius, Spacing, textStyles } from '@/global/theme'
import { useMountStore } from '@/hooks/useMountStore'
import { ASCOM_Telescope } from '@/utils/ascom_services'
import { formatToDMS } from '@/utils/compute'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type ConnectionState = 'unknown' | 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

type Props = {
    onClose: () => void
}

const telescope = new ASCOM_Telescope()

const ICON_SIZE = 16

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
                const position = await telescope.getPosition()
                setActualAz(position.az)
                setActualAlt(position.alt)
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
                <Text style={textStyles.panelTitle}>Monture</Text>
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
                    <View style={globalStyles.sidebarSectionHeader}>
                        <Text style={globalStyles.sectionAccent}>Position</Text>
                        <TouchableOpacity style={globalStyles.iconButton} onPress={handleActualPosition}>
                            <MaterialCommunityIcons name="refresh" size={14} color={GlobalColors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <View style={globalStyles.kvRow}>
                        <Text style={textStyles.rowLabel}>Azimut</Text>
                        <Text style={textStyles.rowValue}>{actualAz !== undefined ? formatToDMS(actualAz) : '--'}</Text>
                    </View>
                    <View style={[globalStyles.kvRow, styles.kvRowLast]}>
                        <Text style={textStyles.rowLabel}>Altitude</Text>
                        <Text style={textStyles.rowValue}>{actualAlt !== undefined ? formatToDMS(actualAlt) : '--'}</Text>
                    </View>

                    <TouchableOpacity
                        style={[globalStyles.buttonBlock, actualAz === undefined && globalStyles.buttonDisabled]}
                        onPress={() => {
                            if (actualAz !== undefined && actualAlt !== undefined) {
                                setMountPosition({ az: actualAz, alt: actualAlt })
                            }
                        }}
                        disabled={actualAz === undefined || actualAlt === undefined}
                    >
                        <MaterialCommunityIcons name="crosshairs-gps" size={ICON_SIZE} color={GlobalColors.textPrimary} />
                        <Text style={textStyles.button}>Afficher sur la carte</Text>
                    </TouchableOpacity>
                </View>

                <View style={[globalStyles.sidebarSection, slewMode && styles.sectionActive]}>
                    <View style={globalStyles.sidebarSectionHeader}>
                        <Text style={globalStyles.sectionAccent}>Pointage</Text>
                        <TouchableOpacity
                            style={[globalStyles.pillToggle, slewMode && globalStyles.pillToggleActive]}
                            onPress={toggleSlewMode}
                        >
                            <MaterialCommunityIcons
                                name="target"
                                size={14}
                                color={slewMode ? GlobalColors.textPrimary : GlobalColors.textMuted}
                            />
                            <Text style={[textStyles.chip, slewMode && styles.pillToggleTextActive]}>
                                {slewMode ? 'Actif' : 'Sélectionner'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {slewMode && !targetPosition && (
                        <View style={globalStyles.calloutBox}>
                            <MaterialCommunityIcons name="gesture-tap" size={16} color={GlobalColors.textMuted} />
                            <Text style={[textStyles.hint, styles.instructionText]}>
                                Touchez un objet sur la carte du ciel
                            </Text>
                        </View>
                    )}

                    {targetPosition && (
                        <>
                            <View style={[globalStyles.row, styles.targetNameContainer]}>
                                <MaterialCommunityIcons name="star-four-points" size={14} color={GlobalColors.textMuted} />
                                <Text style={textStyles.objectTitle}>{targetPosition.name}</Text>
                            </View>
                            <View style={globalStyles.kvRow}>
                                <Text style={textStyles.rowLabel}>Azimut</Text>
                                <Text style={textStyles.rowValue}>{formatToDMS(targetPosition.az)}</Text>
                            </View>
                            <View style={[globalStyles.kvRow, styles.kvRowLast]}>
                                <Text style={textStyles.rowLabel}>Altitude</Text>
                                <Text style={textStyles.rowValue}>{formatToDMS(targetPosition.alt)}</Text>
                            </View>

                            <TouchableOpacity
                                style={[globalStyles.buttonCompact, !isConnected && globalStyles.buttonDisabled]}
                                onPress={handleSlew}
                                disabled={!isConnected || isSlewing}
                            >
                                {isSlewing ? (
                                    <ActivityIndicator color={GlobalColors.textPrimary} size="small" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="telescope" size={ICON_SIZE} color={GlobalColors.textPrimary} />
                                        <Text style={textStyles.button}>Pointer</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                </View>
            </ScrollView>
        </View>
    )
}

export default Mount

const styles = StyleSheet.create({
    dangerButtonText: {
        color: GlobalColors.textSecondary,
    },
    kvRowLast: {
        borderBottomWidth: 0,
        marginBottom: Spacing.sm,
    },
    sectionActive: {
        backgroundColor: GlobalColors.surfaceInset,
        marginHorizontal: -Spacing.xs,
        paddingHorizontal: Spacing.xs,
        borderRadius: Radius.sm,
    },
    pillToggleTextActive: {
        color: GlobalColors.textPrimary,
    },
    instructionText: {
        flex: 1,
    },
    targetNameContainer: {
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
})
