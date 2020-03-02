const Records = require('./records.js');
const getWeather = require('./weather.js');
const Rss = require('./rss.js');
const Coords = require('./coords.js');
const Delta = require('./delta.js');

const RELATIVE_HOUR_THRESHOLD = 5; // 5 AM local time
const PUBSUBHUBBUB_API_URL = 'https://pubsubhubbub.appspot.com';

function getZoneTime(timezone) {
  const options = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: true, timeZone: timezone,
  };
  const date = new Intl.DateTimeFormat('en-US', options).format(new Date());
  return new Date(Date.parse(date));
}

function forToday(record) {
  const now = getZoneTime(record.timezone);
  const time = now.toISOString().replace(/T.*/, '');
  return { time, ...record };
}

function byTimezoneOffset({ timezone }) {
  const now = getZoneTime(timezone);
  return now.getHours() === RELATIVE_HOUR_THRESHOLD;
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
  const content = await delta.changes('\n');
  if (content) {
    const coords = new Coords(latitude, longitude);
    const feed = await new Rss(coords).prepare();
    return await feed.append(content, title).update();
  }
}

module.exports = async function hourlyCron(force) {

  // Get all records that require updates
  const all = await new Records().all();
  const today = force ? all : all.filter(byTimezoneOffset);

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
  const updates = await Promise.all(deltas.map(prepareFeed));
  await publishFeeds(updates);
  return !!updates.length;
}

async function publishFeeds(feeds) {
  feeds = [].concat(feeds).filter(Boolean);

  if (!feeds.length) {
    return;
  }

  const payload = new FormData();
  payload.set('hub.mode', 'publish');

  feeds.forEach((feed) => payload.append('hub.url', encodeURIComponent(feed.getPublicUrl())));

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  try {
    await axios.post(PUBSUBHUBBUB_API_URL, payload, { headers });
  } catch (err) {
    console.log(err);
  }
  return feeds;
}