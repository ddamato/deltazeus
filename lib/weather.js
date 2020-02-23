import DarkSky from 'dark-sky';
import Coords from './coords.js';
import Records from './records.js';
import properties from './properties.js';
const darksky = new DarkSky(process.env.DARKSKY_API_SECRET);

export default async function getWeather({ latitude, longitude, time }) {
  const coords = new Coords(latitude, longitude);
  let records = new Records({ coords });
  const exists = await records.get();
  if (!exists) {
    const forecast = await getDarkskyWeather({ time, ...coords });
    records = new Records(forecast);
    await records.post();
  }
  await records.increment();
  return records;
}

async function getDarkskyWeather(options) {
  const response = await darksky.options(options).get();
  return parseDarkskyResponse(response);
}

function parseDarkskyResponse(response) {
  const { latitude, longitude, timezone, daily } = response;
  const coords = new Coords(latitude, longitude);
  const forecast = daily.data.shift();
  const record = Object.keys(forecast).reduce((acc, prop) => {
    return prop in properties
      ? { ...acc, [prop]: forecast[prop] }
      : acc;
  }, {});

  return {
    coords,
    timezone,
    requests: 0,
    ...record,
  };
}