import convert from 'convert-units';

export default {
  precipProbability: {
    human: 'precipitation probabilty',
    units: percent,
  },
  precipAccumulation: {
    human: 'accumulation of precipition',
    units: inches,
    convert: centimeters,
  },
  apparentTemperatureHigh: {
    human: 'high temperature',
    units: fahrenheit,
    convert: celcius,
  },
  apparentTemperatureLow: {
    human: 'low temperature',
    units: fahrenheit,
    convert: celcius,
  },
  dewPoint: {
    human: 'dew point',
    units: percent,
  },
  humidity: {
    human: 'humidity',
    units: percent,
  },
  windSpeed: {
    human: 'wind speed',
    units: mph,
    convert: kph,
  },
  cloudCover: {
    human: 'cloud cover',
    units: percent,
  },
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

function kph(value) {
  return `${convert(value).from('m/h').to('km/h')}km/h`;
}