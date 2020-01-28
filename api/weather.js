import DarkSky from 'dark-sky';
import Coords from './coords.js';
import { getRecords, postForecast, tableNames, incrementRequests } from './database.js';
import feedContents from './rss.js';
import properties from './properties.js';
const darksky = new DarkSky(process.env.DARKSKY_API_SECRET);

export default async function getWeather({ latitude, longitude, time }) {
  const coords = new Coords(latitude, longitude);
  let records = await getRecords(tableNames.DZ_TODAY, `{coords} = "${coords}"`);
  let contents;
  if (!records.length) {
    const forecast = await getDarkskyWeather({ time, ...coords });
    await postForecast(forecast);
    contents = 'No weather changes yet, sync this feed with a RSS service for updates.'
  } else {
    await incrementRequests(records);
  }
  return feedContents(coords, contents);
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