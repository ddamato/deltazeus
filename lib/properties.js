const convert = require('convert-units');

const SIGNIFIGANT_DIGITS = 1;

const properties = {
  precipProbability: {
    human: 'precipitation probabilty',
    abbr: 'Precip. Probability',
    config: percent,
  },
  precipAccumulation: {
    human: 'accumulation of precipition',
    abbr: 'Precip. Amt.',
    config: inches,
    convert: centimeters,
  },
  apparentTemperatureHigh: {
    human: 'high temperature',
    abbr: 'High Temp.',
    config: fahrenheit,
    convert: celcius,
  },
  apparentTemperatureLow: {
    human: 'low temperature',
    abbr: 'Low Temp.',
    config: fahrenheit,
    convert: celcius,
  },
  dewPoint: {
    human: 'dew point',
    abbr: 'Dew Pt.',
    config: fahrenheit,
    convert: celcius,
  },
  humidity: {
    human: 'humidity',
    abbr: 'Humidity',
    config: percent,
  },
  windSpeed: {
    human: 'wind speed',
    abbr: 'Wind Sp.',
    config: mph,
    convert: kph,
  },
  cloudCover: {
    human: 'cloud cover',
    abbr: 'Cloud Cover',
    config: percent,
  },
  visibility: {
    human: 'visibility',
    abbr: 'Vis.',
    config: miles,
    convert: km,
  }
}

module.exports.properties = properties;

function truncate(input) {
  return Number(Number(input).toFixed(SIGNIFIGANT_DIGITS));
}

function fullReturn(result) {
  result.value = `${result.number}${result.units}`;
  result.abs = `${Math.abs(result.number)}${result.units}`;
  return result;
}

function percent(decimal) {
  return fullReturn({
    number: truncate(decimal * 100),
    units: '%',
  });
}

function inches(value) {
  return fullReturn({
    number: truncate(value),
    units: 'in'
  });
}

function fahrenheit(value) {
  return fullReturn({
    number: truncate(value),
    units: '°F'
  });
}

function miles(value) {
  return fullReturn({
    number: truncate(value),
    units: 'mi'
  });
}

function mph(value) {
  return fullReturn({
    number: truncate(value),
    units: 'm/h',
  });
}

function celcius(value) {
  const result = convert(value).from('F').to('C');
  return fullReturn({
    number: truncate(result),
    units: '°C',
  });
}

function centimeters(value) {
  const result = convert(value).from('in').to('cm');
  return fullReturn({
    number: truncate(result),
    units: 'cm',
  });
}

function km(value) {
  const result = convert(value).from('mi').to('m')/1000;
  return fullReturn({
    number: truncate(result),
    units: 'km',
  });
}

function kph(value) {
  const result = convert(value).from('m/h').to('km/h');
  return fullReturn({
    number: truncate(result),
    units: 'km/h',
  });
}

module.exports.createResult = function (current, prop) {
  const { config, convert } = properties[prop];
  if (convert) {
    return `${config(current).value} (${convert(current).value})`;
  }
  return config(current).value;
}

module.exports.createChange = function (previous, current, prop) {
  const { config, convert } = properties[prop];
  const { abs } = config(previous - current);
  if (convert) {
    const { number, units } = convert(previous);
    const delta = number - convert(current).number;
    return `${abs} (${Math.abs(delta)}${units})`;
  }
  return abs;
}

module.exports.createThreshold = function (threshold, prop) {
  const { config, convert } = properties[prop];
  if (convert) {
    return `${config(threshold).abs} (${convert(threshold).abs})`;
  }
  return config(threshold).abs;
}
