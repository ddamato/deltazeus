import { getRecords, postRecords, deleteRecords, tableNames } from './database.js';
import getWeather from './weather.js';
import computeDeltas from './deltas.js';

const RELATIVE_HOUR_THRESHOLD = 5; // 5 AM local time

function getZoneTime(timezone) {
  const options = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: true, timeZone: timezone,
  };
  const date = new Intl.DateTimeFormat('en-US', options).format(new Date());
  return new Date(Date.parse(date));
}

function filterByTimezone(records) {
  return records.filter(({ timezone }) => {
    const now = getZoneTime(timezone);
    return now.getHours() === RELATIVE_HOUR_THRESHOLD;
  });
}

export function forToday(record) {
  const now = getZoneTime(record.timezone);
  const time = now.toISOString().replace(/T.*/, '');
  return { time, ...record };
}

export default async function hourlyCron() {
  const today = await getRecords(tableNames.DZ_TODAY).then(filterByTimezone);
  if (!today.length) {
    return [];
  }

  const previousWeather = today.filter(({ requests }) => requests);
  await deleteRecords(tableNames.DZ_TODAY, today);
  const response = await Promise.all(previousWeather.map(forToday).map(getWeather));
  const newWeather = response.reduce((acc, record) => acc.concat(record), []);
  const thresholds = await getRecords(tableNames.DZ_THRESHOLDS);
  const deltas = computeDeltas(previousWeather, newWeather, thresholds);
  if (Object.keys(deltas).length) {
    // write the feed for each
  }

  return [];
}


function deltaResponse({ prop, time, isIncreased, delta }) {
  const byPercent = ['precipProbability', 'cloudCover'];
  const byDegrees = ['apparentTemperatureHigh', 'apparentTemperatureLow', 'dewPoint'];

  if (byPercent.includes(prop)) {
    delta = `${delta*100}%`;
  }

  if (byDegrees.includes(prop)) {
    delta = `${delta} degrees`;
  }

  const direction = isIncreased ? 'increased' : 'decreased';
  return `The forecast of the ${properties[prop]} for ${time} has ${direction} by ${delta} since the last update.`;
}
