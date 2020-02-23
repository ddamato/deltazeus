import Records from './records.js';
import getWeather from './weather.js';
import Rss from './rss.js';
import Coords from './coords.js';
import Delta from './delta.js';

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

export function forToday(record) {
  const now = getZoneTime(record.timezone);
  const time = now.toISOString().replace(/T.*/, '');
  return { time, ...record };
}

function byTimezoneOffset({timezone}) {
  const now = getZoneTime(timezone);
  return now.getHours() === RELATIVE_HOUR_THRESHOLD;
}

export default async function hourlyCron() {

  // Get all records that require updates
  const all = await new Records().all()
  const today = all.filter(byTimezoneOffset);

  // If there's nothing to update right now, return early
  if (!today.length) {
    return false;
  }

  // Store weather from yesterday in memory
  const previousWeather = today.filter(({ requests }) => requests);

  // Delete all records from yesterday
  await Promise.all(today.map(async (fields) => await new Records(fields).delete()));

  // Get new weather (and flatten)
  const forecasts = await Promise.all(previousWeather.map(forToday).map(getWeather));
  const newWeather = forecasts.reduce((acc, forecast) => acc.concat(forecast), []);

  // Create the updates
  const deltas = getDeltas(previousWeather, newWeather);
  await Promise.all(deltas.map(prepareFeed));
  return true;
}

function getDeltas(previousRecords, incomingRecords) {
  return previousRecords.map((previous) => {
    const incoming = incomingRecords.find(({ coords }) => coords === previous.coords);
    return new Delta(previous, incoming);
  });
}

async function prepareFeed(delta) {
  const { latitude, longitude, time, timezone } = forToday(delta.fields());
  const title = `deltazeus update for ${latitude}, ${longitude} on ${time} (${timezone})`;
  const content = await delta.description('&lt;br/&gt;');
  const coords = new Coords(latitude, longitude);
  const feed = await new Rss(coords).prepare();
  return await feed.append(content, title).update();
}