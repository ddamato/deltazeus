import { getRecords, postRecords, deleteRecords, asFields, tableNames } from './database.js';
import getWeather from './weather.js';
import properties from './properties.js';

const RELATIVE_HOUR_THRESHOLD = 5; // 5 AM local time

function getZoneTime(timezone) {
  const options = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: true, timeZone: timezone,
  };
  const date = new Intl.DateTimeFormat('en-US', options).format(now);
  return new Date(Date.parse(date));
}

function filterByTimezone(records) {
  return records.filter(({ timezone }) => {
    const now = getZoneTime(timezone);
    return now.getHours() === RELATIVE_HOUR_THRESHOLD;
  });
}

function forToday(record) {
  const now = getZoneTime(record.timezone);
  const time = now.toISOString().replace(/T.*/, '');
  return { time, ...record };
}

export default async function daily() {
  const today = getRecords(tableNames.DZ_TODAY).then(filterByTimezone);
  const delta =  getRecords(tableNames.DZ_DELTA).then(filterByTimezone);
  const previousWeather = today.filter(({ requests }) => requests);
  await deleteRecords(tableNames.DZ_TODAY, today);
  await deleteRecords(tableNames.DZ_DELTA, delta);
  const newWeather = await Promise.all(previousWeather.map(forToday).map(getWeather));
  const deltas = createDeltas(previousWeather, newWeather);
  await postRecords(tableNames.DZ_DELTA, deltas);
}

function createDeltas(oldRecords, newRecords) {
  return oldRecords.reduce((acc, oldRecord) => {
    const newRecord = newRecords.find((newRecord) => newRecord.coords === oldRecord.coords);
    const delta = createDelta(oldRecord, newRecord);
    return acc.concat(asFields(delta));
  }, []);
}

function createDelta(oldRecord, newRecord) {
  return Object.keys(oldRecord).reduce((acc, key) => {
    if (key in properties) {
      return {...acc, [key]: Number(newRecord[key]) - Number(oldRecord[key]) }
    }
    return acc;
  }, {});
}