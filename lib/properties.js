import convert from 'convert-units';

export default {
  precipProbability: {
    human: 'precipitation probabilty',
    abbr: 'Precip Probability',
    units: percent,
  },
  precipAccumulation: {
    human: 'accumulation of precipition',
    abbr: 'Precip Amt.',
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
    units: percent,
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
    units: km,
  }
}

function percent(decimal) {
  return `${decimal * 100}%`;
}

function inches(value) {
  return `${value}in`
}

function fahrenheit(value) {
  return `${value}°F`
}

function mph(value) {
  return `${value}m/h`;
}

function celcius(value) {
  return `${convert(value).from('F').to('C')}°C`;
}

function centimeters(value) {
  return `${convert(value).from('in').to('cm')}cm`;
}

function km(value) {
  return `${convert(value).from('mi').to('m')/1000}km`;
}

function kph(value) {
  return `${convert(value).from('m/h').to('km/h')}km/h`;
}