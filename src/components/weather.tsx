import { GlobalColors, globalStyles, textStyles } from '@/global/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { computePlanetByName } from '@/utils/planets';
import { WeatherData, fetchWeatherData } from '@/utils/weather';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Polygon, Rect, Text as SvgText } from 'react-native-svg';

const CHART_CONFIG = {
    margin: {
        left: 35,
        right: 10,
        top: 10,
        bottom: 20,
    },
    height: 100,
};

interface Props {
    onClose: () => void;
}

interface ChartLayout {
    chartWidth: number;
    chartHeight: number;
    xStep: number;
    toX: (index: number) => number;
    toY: (value: number) => number;
    baselineY: number;
}

interface WeatherComponentData {
    hoursRange: Array<Date>
    cloudCover: Array<number>
    weatherCode: Array<number>
    moonImpact: Array<number>
    layout: ChartLayout
}

function extractNightData(weatherData: WeatherData) {
    if (!weatherData) return [];
    const nights = [{ sunrise: weatherData.daily.sunrise[1].getTime(), sunset: weatherData.daily.sunset[0].getTime() }]

    // 1. Définition des fenêtres temporelles (sunset - 2h à sunrise + 2h)
    const windows = nights.map(({ sunset, sunrise }) => ({
        start: sunset - 3600 * 1000 * 2,
        end: sunrise + 3600 * 1000 * 2,
    }));

    // 2. Transformation et filtrage
    return weatherData.hourly.time
        .map((timeStr, index) => ({
            time: timeStr,
            cloudCover: weatherData.hourly.cloud_cover![index],
            weatherCode: weatherData.hourly.weather_code![index],
            timestamp: timeStr.getTime(),
        }))
        .filter(({ timestamp }) =>
            windows.some((w) => timestamp >= w.start && timestamp <= w.end)
        );
}

const buildComponentData = (weatherData: WeatherData, containerWidth: number): WeatherComponentData => {
    if (!weatherData || !weatherData.daily || !weatherData.daily.moon_phase) return {} as WeatherComponentData;

    const d = extractNightData(weatherData)
    const { margin, height } = CHART_CONFIG;

    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = height;
    const xStep = d.length > 1 ? chartWidth / (d.length - 1) : chartWidth;

    const layout: ChartLayout = {
        chartWidth,
        chartHeight,
        xStep,
        toX: (index: number) => margin.left + index * xStep,
        toY: (value: number) => margin.top + chartHeight * (1 - value / 100),
        baselineY: margin.top + chartHeight,
    };

    const moonPhase = weatherData?.daily?.moon_phase[0] ?? 0;
    const illumination = (1 - Math.cos(moonPhase * 2 * Math.PI)) / 2;

    const moonImpact: Array<number> = []
    for (let i = 0; i < d.length; i++) {
        const moonPositionByDate = computePlanetByName("Lune", d[i].time)
        if (!moonPositionByDate || moonPositionByDate.altitude < 0) {
            moonImpact.push(0)
            continue
        }
        const altitudeRad = (moonPositionByDate.altitude * Math.PI) / 180;
        const altitudeFactor = Math.sin(altitudeRad);
        const impact = illumination * altitudeFactor * 100;
        moonImpact.push(Math.min(100, Math.max(0, Math.round(impact))))
    }

    return {
        hoursRange: d.map(h => h.time),
        cloudCover: d.map(h => h.cloudCover),
        weatherCode: d.map(h => h.weatherCode),
        moonImpact,
        layout,
    }
}

const convertTime = (date: Date | null | undefined): string => {
    if (!date) return "--h--m--s";
    return `${date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short'
    })} - ${date.getHours()}h${date.getMinutes().toString().padStart(2, '0')}m${date.getSeconds().toString().padStart(2, '0')}s`;
};

const Weather = ({ onClose }: Props) => {
    const { isMobilePortrait } = useResponsive();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [componentData, setComponentData] = useState<WeatherComponentData | null>();
    const [containerWidth, setContainerWidth] = useState<number>(0);

    useEffect(() => {
        fetchWeatherData().then(setWeather);
    }, []);

    useEffect(() => {
        if (weather && containerWidth > 0) {
            setComponentData(buildComponentData(weather, containerWidth));
        }
    }, [weather, containerWidth]);

    const handleLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    return (
        <View style={globalStyles.sidebarPanel}>


            {/* Header */}
            {!isMobilePortrait && (
                <View style={globalStyles.panelHeader}>
                    <TouchableOpacity onPress={() => { onClose() }}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={textStyles.panelTitle}>Meteo</Text>
                </View>
            )}
            <Text style={[textStyles.sectionLabel, globalStyles.sectionLabelMargin]}>Ephéméride</Text>
            <View style={globalStyles.card}>
                <View style={globalStyles.rowBetween}>
                    <Text style={textStyles.label}>Levé du Soleil</Text>
                    <Text style={textStyles.value}>{convertTime(weather?.daily.sunrise[0])}</Text>
                </View>
                <View style={globalStyles.rowBetween}>
                    <Text style={textStyles.label}>Coucher du Soleil</Text>
                    <Text style={textStyles.value}>{convertTime(weather?.daily.sunset[0])}</Text>
                </View>
                <View style={globalStyles.rowBetween}>
                    <Text style={textStyles.label}>Levé de la Lune</Text>
                    <Text style={textStyles.value}>{convertTime(weather?.daily.moonrise[0])}</Text>
                </View>
                <View style={globalStyles.rowBetween}>
                    <Text style={textStyles.label}>Coucher de la Lune</Text>
                    <Text style={textStyles.value}>{convertTime(weather?.daily.moonset[1])}</Text>
                </View>
                {/* <View style={{flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10}}>
                    <Text>Phase lunaire</Text>
                    <Text>{weather?.daily.moon_phase[0]}</Text>
                </View> */}
            </View>
            <Text style={[textStyles.sectionLabel, globalStyles.sectionLabelMargin]}>Forecast</Text>
            <View style={globalStyles.card}>
                <View onLayout={handleLayout}>

                    <Svg width={"100%"} height={CHART_CONFIG.height + CHART_CONFIG.margin.top + CHART_CONFIG.margin.bottom}>
                        {componentData?.layout && (
                            <>
                                {/* Y-axis labels */}
                                {[0, 50, 100].map((value) => (
                                    <SvgText
                                        key={`y-${value}`}
                                        x={CHART_CONFIG.margin.left - 5}
                                        y={componentData.layout.toY(value) + 3}
                                        fill={GlobalColors.textPrimary}
                                        fontSize={10}
                                        textAnchor="end"
                                    >
                                        {value}%
                                    </SvgText>
                                ))}
                                {/* Background */}
                                <Rect
                                    x={CHART_CONFIG.margin.left}
                                    y={CHART_CONFIG.margin.top}
                                    width={componentData.layout.chartWidth}
                                    height={componentData.layout.chartHeight}
                                    fill={GlobalColors.accent}
                                />
                                {/* Night range (2h after sunset to 2h before sunrise) */}
                                <Rect
                                    x={componentData.layout.toX(2)}
                                    y={CHART_CONFIG.margin.top}
                                    width={componentData.layout.toX(componentData.hoursRange.length - 3) - componentData.layout.toX(2)}
                                    height={componentData.layout.chartHeight}
                                    fill={GlobalColors.background}
                                    opacity={0.5}
                                />
                                {/* Cloud cover polygon */}
                                <Polygon
                                    points={(() => {
                                        const { toX, toY, baselineY } = componentData.layout;
                                        const points = componentData.cloudCover.map((v, i) => `${toX(i)},${toY(v)}`);
                                        const firstX = toX(0);
                                        const lastX = toX(componentData.cloudCover.length - 1);
                                        return [`${firstX},${baselineY}`, ...points, `${lastX},${baselineY}`].join(' ');
                                    })()}
                                    fill={GlobalColors.textPrimary}
                                    opacity={0.5}
                                />
                                {/* Cloud cover points */}
                                {componentData.cloudCover.map((value, index) => (
                                    <Rect
                                        key={`cloud-${index}`}
                                        x={componentData.layout.toX(index) - 3}
                                        y={componentData.layout.toY(value) - 3}
                                        width={6}
                                        height={6}
                                        fill={GlobalColors.textPrimary}
                                    />
                                ))}
                                {/* Moon impact polygon */}
                                <Polygon
                                    points={(() => {
                                        const { toX, toY, baselineY } = componentData.layout;
                                        const points = componentData.moonImpact.map((v, i) => `${toX(i)},${toY(v)}`);
                                        const firstX = toX(0);
                                        const lastX = toX(componentData.moonImpact.length - 1);
                                        return [`${firstX},${baselineY}`, ...points, `${lastX},${baselineY}`].join(' ');
                                    })()}
                                    fill={GlobalColors.primary}
                                    opacity={0.7}
                                />
                                {/* Moon impact points */}
                                {componentData.moonImpact.map((value, index) => (
                                    <Rect
                                        key={`moon-${index}`}
                                        x={componentData.layout.toX(index) - 2.5}
                                        y={componentData.layout.toY(value) - 2.5}
                                        width={5}
                                        height={5}
                                        fill={GlobalColors.primary}
                                    />
                                ))}
                                {/* Hour labels */}
                                {componentData.hoursRange.map((hour, index) => (
                                    <SvgText
                                        key={index}
                                        x={componentData.layout.toX(index)}
                                        y={componentData.layout.baselineY + CHART_CONFIG.margin.bottom - 5}
                                        fill={GlobalColors.textPrimary}
                                        fontSize={10}
                                        textAnchor="middle"
                                    >
                                        {hour.getHours().toString().padStart(2, '0') + 'h'}
                                    </SvgText>
                                ))}
                            </>
                        )}
                    </Svg>
                </View>

            </View>

        </View>
    )
}

export default Weather

const styles = StyleSheet.create({})