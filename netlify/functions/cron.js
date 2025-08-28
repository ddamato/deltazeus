import { getStore } from '@netlify/blobs';
import { get, remove } from './track.js';
import { FeedXml } from './xml.js';
import { weatherMetrics } from './weather.js';

const isExpired = (iso, days) => Date.now() - new Date(iso).getTime() > days * 864e5;

function isSignificant(key, yesterday, today) {
  const metric = weatherMetrics[key];
  if (!metric) return NaN;
  const diff = today[key] - yesterday[key];
  return Math.abs(diff) >= metric.threshold ? diff : NaN;
}

function formatChange(diff, metric) {
  const trendEmoji = diff > 0 ? '📈' : '📉';
  const arrow = diff > 0 ? '↑' : '↓';
  const [diffMetric, diffImperial] = metric.convert(diff);
  return `${metric.emoji} ${trendEmoji} ${metric.label} ${arrow}: ${Math.abs(diffMetric)}${metric.unitMetric} / ${Math.abs(diffImperial)}${metric.unitImperial}`;
}

async function weatherDiffs(feedId) {
  const now = new Date();
  const [end_date] = now.toISOString().split('T');
  now.setDate(now.getDate() - 1);
  const [start_date] = now.toISOString().split('T');
  const [latitude, longitude] = feedId.split('_');

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude,
    longitude,
    start_date,
    end_date,
    daily: Object.keys(weatherMetrics).join(','),
    timezone: 'auto',
  });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  if (!data.daily || data.daily.time.length < 2) {
    throw new Error('Not enough daily data returned');
  }

  console.log(`Weather data received for ${feedId}`);

  return Object.keys(data.daily).reduce(
    (acc, key) => {
      if (key === 'time') return acc;
      acc.yesterday[key] = data.daily[key][0];
      acc.today[key] = data.daily[key][1];
      return acc;
    },
    { yesterday: {}, today: {}, date: data.daily.time.at(-1) }
  );
}

function createUpdate(yesterday, today) {
  return Object.keys(weatherMetrics)
    .map((key) => {
      const diff = isSignificant(key, yesterday, today);
      if (!isNaN(diff)) return formatChange(diff, weatherMetrics[key]);
    })
    .filter(Boolean)
    .join('\n');
}

export default async function handler() {
  const utcHour = new Date().getUTCHours();
  const store = getStore('feeds');
  const feeds = await get(5 - utcHour); // feeds representing 5am local time

  console.log(`Target feeds for UTC ${utcHour}`, JSON.stringify(feeds));

  for (const [feedId, lastUpdated] of Object.entries(feeds)) {
    // If feed has not been updated in 5 days, remove
    if (isExpired(lastUpdated, 5)) {
      console.log(`Deleting ${feedId} due to inactivity...`);
      await store.delete(`${feedId}.xml`);
      await remove(feedId);
      continue;
    }

    try {
      console.log(`Retrieving weather for ${feedId}`);
      const { yesterday, today, date } = await weatherDiffs(feedId);
      console.log(`Weather retrieved for ${feedId}`);
      const description = createUpdate(yesterday, today);
      console.log(`Updates created for ${feedId}:`, description);

      if (description) {
        const feed = await new FeedXml(feedId);
        const d = new Date();
        await feed.addItem({
          title: `Significant Weather Update for ${date}`,
          description,
          pubDate: d.toUTCString(),
          guid: d.toISOString(),
        });
      }
    } catch (err) {
      console.error(`Failed to update feed ${feedId}:`, err);
    }
  }

  return new Response(`Feeds updated: ${Object.keys(feeds).join(', ')}`, { status: 200 });
}

export const config = {
  schedule: "@hourly"
};
