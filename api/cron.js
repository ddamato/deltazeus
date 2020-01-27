import { getAll, postAll, deleteRecords } from './database.js';
import getWeather from './weather.js';

const RELATIVE_HOUR_THRESHOLD = 5; // 5 AM local time

function timezoneRecords(records) {
  return records.filter(({ timezone }) => {
    const now = getRelativeTime(timezone);
    return now.getHours() === RELATIVE_HOUR_THRESHOLD;
  });
}

function getRelativeTime(timezone) {
  const options = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: true, timeZone: timezone,
  };
  const date = new Intl.DateTimeFormat('en-US', options).format(now);
  return new Date(Date.parse(date));
}

function addTime(record) {
  const now = getRelativeTime(record.timezone);
  const time = now.toISOString().replace(/T.*/, '');
  return { time, ...record };
}

export async function daily() {

  const yesterday = getAll('dz_yeserday').then(timezoneRecords);
  await deleteRecords('dz_yesterday', yesterday);

  const today = getAll('dz_today').then(timezoneRecords);
  const requested = today.filter(({requests}) => requests);
  await postAll('dz_yesterday', requested);
  await deleteRecords('dz_today', today);
  await Promise.all(requested.map(addTime).map(getWeather));
}