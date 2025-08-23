// Unified metric config
export const weatherMetrics = {
  temperature_2m_max: {
    label: 'Max temperature',
    emoji: '🌡️',
    unitMetric: '°C',
    unitImperial: '°F',
    threshold: 5,
    convert: valC => [valC, (valC * 9 / 5 + 32).toFixed(1)],
  },
  temperature_2m_min: {
    label: 'Min temperature',
    emoji: '🌡️',
    unitMetric: '°C',
    unitImperial: '°F',
    threshold: 5,
    convert: valC => [valC, (valC * 9 / 5 + 32).toFixed(1)],
  },
  windspeed_10m_max: {
    label: 'Wind speed',
    emoji: '💨',
    unitMetric: 'km/h',
    unitImperial: 'mph',
    threshold: 15,
    convert: valKph => [valKph, (valKph / 1.609).toFixed(1)],
  },
  precipitation_sum: {
    label: 'Precipitation',
    emoji: '🌧️',
    unitMetric: 'mm',
    unitImperial: 'in',
    threshold: 10,
    convert: valMm => [valMm, (valMm / 25.4).toFixed(2)],
  },
};
