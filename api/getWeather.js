import DarkSky from 'dark-sky';
import { fixedCoords } from './utils.js';
import { getToday, postToday } from './databaseAdapters.js';
const darksky = new DarkSky(process.env.DARKSKY_API_SECRET);

export default async function getWeather(options) {
  const { latitude, longitude, ...time } = options;
  const config = { time, ...fixedCoords(latitude, longitude) };
  let records = await getToday(config);
  if (!records.length) {
    const forecast = await getDarkskyWeather(options);
    records = await postToday(forecast);
  }
  return records;
}

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
  } = daily.data.shift();

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