const convert = require('convert-units');

const SIGNIFIGANT_DIGITS = 1;

module.exports = {
  precipProbability: {
    human: 'precipitation probabilty',
    abbr: 'Precip. Probability',
    units: percent,
  },
  precipAccumulation: {
    human: 'accumulation of precipition',
    abbr: 'Precip. Amt.',
    units: inches,
    convert: centimeters,
  },
  apparentTemperatureHigh: {
    human: 'high temperature',
    abbr: 'High Temp.',
    units: fahrenheit,
    convert: celcius,
  },
  apparentTemperatureLow: {
    human: 'low temperature',
    abbr: 'Low Temp.',
    units: fahrenheit,
    convert: celcius,
  },
  dewPoint: {
    human: 'dew point',
    abbr: 'Dew Pt.',
    units: fahrenheit,
    convert: celcius,
  },
  humidity: {
    human: 'humidity',
    abbr: 'Humidity',
    units: percent,
  },
  windSpeed: {
    human: 'wind speed',
    abbr: 'Wind Sp.',
    units: mph,
    convert: kph,
  },
  cloudCover: {
    human: 'cloud cover',
    abbr: 'Cloud Cover',
    units: percent,
  },
  visibility: {
    human: 'visibility',
    abbr: 'Vis.',
    units: miles,
    convert: km,
  }
}

function truncate(input) {
  return Number(input).toFixed(SIGNIFIGANT_DIGITS);
}

function percent(decimal) {
  return `${truncate(decimal * 100)}%`;
}

function inches(value) {
  return `${truncate(value)}in`;
}

function fahrenheit(value) {
  return `${truncate(value)}°F`;
}

function miles(value) {
  return `${truncate(value)}mi`;
}

function mph(value) {
  return `${truncate(value)}m/h`;
}

function celcius(value) {
  const result = convert(value).from('F').to('C');
  return `${truncate(result)}°C`;
}

function centimeters(value) {
  const result = convert(value).from('in').to('cm');
  return `${truncate(result)}cm`;
}

function km(value) {
  const result = convert(value).from('mi').to('m')/1000;
  return `${truncate(result)}km`;
}

function kph(value) {
  const result = convert(value).from('m/h').to('km/h');
  return `${truncate(result)}km/h`;
}