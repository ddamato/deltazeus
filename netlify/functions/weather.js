// Unified metric config
export const weatherMetrics = {
  temperature_2m_max: {
    label: 'Max temperature',
    emoji: '🌡️',
    unitMetric: '°C',
    unitImperial: '°F',
    threshold: 5,
    convert: diffC => [diffC, (diffC * 1.8)],
  },
  temperature_2m_min: {
    label: 'Min temperature',
    emoji: '🌡️',
    unitMetric: '°C',
    unitImperial: '°F',
    threshold: 5,
    convert: diffC => [diffC, (diffC * 1.8)],
  },
  windspeed_10m_max: {
    label: 'Wind speed',
    emoji: '💨',
    unitMetric: 'km/h',
    unitImperial: 'mph',
    threshold: 15,
    convert: diffKph => [diffKph, (diffKph / 1.609)],
  },
  precipitation_sum: {
    label: 'Precipitation',
    emoji: '🌧️',
    unitMetric: 'mm',
    unitImperial: 'in',
    threshold: 10,
    convert: diffMm => [diffMm, (diffMm / 25.4)],
  },
};
