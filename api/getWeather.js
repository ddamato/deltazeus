import DarkSky from 'dark-sky';
import { getToday, postToday } from './databaseAdapters.js';
const darksky = new DarkSky(process.env.DARKSKY_API_SECRET);

/**
 * Get weather from the application at specific coords and time
 * @param {Object} options A configuration object
 * @param {String} options.latitude Latitude to get weather from
 * @param {String} options.longitude Longitude to get weather from
 * @param {String} options.time ISO8601 format of the day to get the time from
 */
export async function getWeather(options) {
  // Check the database for weather
  let record = await getToday(options);
  if (!record) {
    const forecast = await getDarkskyWeather(options);
    record = await postToday(forecast);
    console.log('Record created');
  }
  return record;
}

/**
 * Get weather from the Dark Sky API, should only be called once the DB has been checked for the same values
 * @param {Object} options A configuration object
 * @param {String} options.latitude Latitude to get weather from
 * @param {String} options.longitude Longitude to get weather from
 * @param {String} options.time ISO8601 format of the day to get the time from
 */
async function getDarkskyWeather(options) {
  const forecast = await darksky.options(options).get();
  return parseDarkskyResponse(forecast);
}

function parseDarkskyResponse(response) {
  const { latitude, longitude, daily } = response;
  const {
    precipProbability,
    precipAccumulation,
    apparentTemperatureHigh,
    apparentTemperatureLow,
    dewPoint,
    humidity,
    windSpeed,
    cloudCover,
  } = daily;

  return {
    latitude,
    longitude,
    precipProbability,
    precipAccumulation,
    apparentTemperatureHigh,
    apparentTemperatureLow,
    dewPoint,
    humidity,
    windSpeed,
    cloudCover,
  };
}