import { fetchWeatherApi } from "openmeteo";
import { getObserver } from "./observer";

export interface WeatherData {
    hourly: {
        time: Date[];
        cloud_cover: Float32Array<ArrayBufferLike> | null;
        weather_code: Float32Array<ArrayBufferLike> | null;
    };
    daily: {
        time: Date[];
        sunrise: Date[];
        sunset: Date[];
        moonrise: (Date | null)[];
        moonset: (Date | null)[];
        moon_phase: Float32Array<ArrayBufferLike> | null;
    };
}

export async function fetchWeatherData(): Promise<WeatherData> {

    const obs = getObserver()

    const params = {
        latitude: obs.latitude,
        longitude: obs.longitude,
        daily: ["sunrise", "sunset", "moonrise", "moonset", "moon_phase"],
        hourly: ["cloud_cover", "weather_code"],
        timezone: "Europe/Berlin",
        forecast_days: 2,
    };
    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWeatherApi(url, params);

    // Process first location. Add a for-loop for multiple locations or weather models
    const response = responses[0];

    // Attributes for timezone and location
    const latitude = response.latitude();
    const longitude = response.longitude();
    const elevation = response.elevation();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const utcOffsetSeconds = response.utcOffsetSeconds();

    // console.log(
    //     `\nCoordinates: ${latitude}°N ${longitude}°E`,
    //     `\nElevation: ${elevation}m asl`,
    //     `\nTimezone: ${timezone} ${timezoneAbbreviation}`,
    //     `\nTimezone difference to GMT+0: ${utcOffsetSeconds}s`,
    // );

    const hourly = response.hourly()!;
    const daily = response.daily()!;

    // Define Int64 variables so they can be processed accordingly
    const sunrise = daily.variables(0)!;
    const sunset = daily.variables(1)!;
    const moonrise = daily.variables(2)!;
    const moonset = daily.variables(3)!;

    // Days without a moonrise or moonset return this value instead of a timestamp
    const missingInt64 = 9223372036854775807n;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {
        hourly: {
            time: Array.from(
                { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
                (_, i) => new Date((Number(hourly.time()) + i * hourly.interval()) * 1000)
            ),
            cloud_cover: hourly.variables(0)!.valuesArray(),
            weather_code: hourly.variables(1)!.valuesArray(),
        },
        daily: {
            time: Array.from(
                { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
                (_, i) => new Date((Number(daily.time()) + i * daily.interval()) * 1000)
            ),
            // Map Int64 values to according structure
            sunrise: [...Array(sunrise.valuesInt64Length())].map(
                (_, i) => new Date((Number(sunrise.valuesInt64(i))) * 1000)
            ),
            // Map Int64 values to according structure
            sunset: [...Array(sunset.valuesInt64Length())].map(
                (_, i) => new Date((Number(sunset.valuesInt64(i))) * 1000)
            ),
            // Map Int64 values to according structure
            moonrise: [...Array(moonrise.valuesInt64Length())].map(
                (_, i) => {
                    const value = moonrise.valuesInt64(i)!;
                    return value === missingInt64 ? null : new Date((Number(value)) * 1000);
                }
            ),
            // Map Int64 values to according structure
            moonset: [...Array(moonset.valuesInt64Length())].map(
                (_, i) => {
                    const value = moonset.valuesInt64(i)!;
                    return value === missingInt64 ? null : new Date((Number(value)) * 1000);
                }
            ),
            moon_phase: daily.variables(4)!.valuesArray(),
        },
    };

    // // The 'weatherData' object now contains a simple structure, with arrays of datetimes and weather information
    // console.log("\nHourly data:\n", weatherData.hourly)
    // console.log("\nDaily data:\n", weatherData.daily)

    return weatherData
}