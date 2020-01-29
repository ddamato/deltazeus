import { getRecords, postRecords, deleteRecords, tableNames } from './database.js';
import getWeather from './weather.js';
import computeDeltas from './deltas.js';
import getFeed, { asText } from './rss.js';

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
  const updates = computeDeltas(previousWeather, newWeather, thresholds);
  const promises = updates.map(async (update) => {
    const { latitude, longitude, timezone, delta } = update;
    const { time } = forToday(update);
    const title = `deltazeus update for ${latitude}, ${longitude} on ${time} (${timezone})`;
    const coords = new Coords(latitude, longitude);
    const content = deltaResponse(delta, timezone);
    return await getFeed(coords, content, title);
  })

  const updatedFeeds = await Promise.all(promises);
  return updatedFeeds;
}


function deltaResponse(changes) {
  const responses = Object.keys(changes).reduce((acc, prop) => {
    const { human, units, convert } = properties[prop];
    const { delta, previous, current, isIncreased } = changes[prop];
    const changed = isIncreased ? 'increased' : 'decreased';

    const difference = createResponse(delta, units, convert);
    const previousAmount = createResponse(previous, units, convert);
    const currentAmount = createResponse(current, units, convert);

    const response = `The forecast of the ${human} has ${changed} by ${difference} from ${previousAmount} to ${currentAmount} according to our records.`;
    return acc.concat(asText(response));
  }, []);

  if (responses.length) {
    return {
      ul: { li: responses }
    };
  }
  return [];
}

function createResponse(value, units, convert) {
  const converted = convert ? ` (${convert(value)})` : '';
  return `${units(value)}${converted}`;
}
