import DarkSky from 'dark-sky';
import Coords from './coords.js';
import { getRecords, postForecast, tableNames, incrementRequests } from './database.js';
import properties from './properties.js';
const darksky = new DarkSky(process.env.DARKSKY_API_SECRET);

export default async function getWeather({ latitude, longitude, time }) {
  const coords = new Coords(latitude, longitude);
  let records = await getRecords(tableNames.DZ_TODAY, `{coords} = "${coords}"`);
  if (!records.length) {
    const forecast = await getDarkskyWeather({ time, ...coords });
    records = await postForecast(forecast);
  }
  return records;
}

async function getDarkskyWeather(options) {
  const forecast = await darksky.options(options).get();
  return parseDarkskyResponse(forecast);
}

function parseDarkskyResponse(response) {
  const { latitude, longitude, timezone, daily } = response;
  const forecast = daily.data.shift();
  const record = Object.keys(forecast).reduce((acc, prop) => {
    return prop in properties
      ? { ...acc, [prop]: forecast[prop] }
      : acc;
  }, {});

  return {
    latitude,
    longitude,
    timezone,
    ...record,
  };
}