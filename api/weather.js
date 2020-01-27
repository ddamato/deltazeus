import DarkSky from 'dark-sky';
import Coords from './coords.js';
import { getToday, postToday } from './database.js';
const darksky = new DarkSky(process.env.DARKSKY_API_SECRET);

export default async function getWeather({ latitude, longitude, time }) {
  const coords = new Coords(latitude, longitude);
  let records = await getToday(coords);
  if (!records.length) {
    const forecast = await getDarkskyWeather({ time, ...coords });
    records = await postToday(forecast);
  }
  return records;
}

async function getDarkskyWeather(options) {
  const forecast = await darksky.options(options).get();
  return parseDarkskyResponse(forecast);
}

function parseDarkskyResponse(response) {
  const { latitude, longitude, timezone, daily } = response;
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
    timezone,
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