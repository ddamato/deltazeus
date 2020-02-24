const DarkSky = require('dark-sky');
const Coords = require('./coords.js');
const Records = require('./records.js');
const properties = require('./properties.js');
const darksky = new DarkSky(process.env.DZ_DARKSKY_API_SECRET);

module.exports = async function getWeather({ latitude, longitude, time }) {
  const coords = new Coords(latitude, longitude);
  let forecast = await new Records({ coords }).get();
  if (!forecast) {
    forecast = await getDarkskyWeather({ time, ...coords });
    await new Records(forecast).post();
  }
  return forecast;
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
    latitude,
    longitude,
    coords,
    timezone,
    requests: 0,
    ...record,
  };
}