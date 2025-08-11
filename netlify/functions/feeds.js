import { getStore } from '@netlify/blobs';
import multipartParser from 'lambda-multipart-parser';
import { FeedXml } from './xml.js';

const store = getStore({
  name: 'feeds',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_API_TOKEN,
});

function timeZoneOffset(tz) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset"
  });

  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(p => p.type === "timeZoneName");

  const match = offsetPart?.value.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] || "0", 10);

  return hours * 100 + Math.sign(hours) * minutes;
}

function contextMeta(context) {
  if (!context.geo) return {};
  const { latitude, longitude, timezone } = context.geo;
  return {
    lat: Number(latitude.toFixed(1)),
    lon: Number(longitude.toFixed(1)),
    tzOffset: timeZoneOffset(timezone),
  };
}

async function updateActive(feedId) {
  const fileName = 'active.json';
  const contentType = 'application/json';
  try {
    const active = await ensureStore({ fileName, contentType });
    active[feedId] = new Date().toISOString();
    console.log('Updating active feeds:', active);
    await store.set(fileName, JSON.stringify(active), { contentType });
  } catch (err) {}
}

async function getFeed(feedId) {
  const xml = await store.get(`${feedId}.xml`, { type: 'text' });
  if (!xml) {
    throw new Error(`Feed XML not found for ID: ${feedId}`);
  }
  return new FeedXml(xml);
}

async function ensureStore({ fileName, content = '', contentType = 'application/xml' }) {
  const type = contentType?.endsWith('json') ? 'json' : 'text';
  const existing = await store.get(fileName, { type });
  if (!existing) await store.set(fileName, content, { contentType });
  return existing || await store.get(fileName, { type: 'text' });
}

async function handlePost(event, context) {
  let parsed;
  try {
    parsed = await multipartParser.parse(event);
  } catch (err) {
    console.error('Failed to parse multipart form:', err);
    return { statusCode: 400, body: 'Invalid multipart form data' };
  }

  const metadata = Object.assign({}, contextMeta(context), parsed);
  delete metadata.files;
  const feedId = `${metadata.lat}_${metadata.lon}`;
  const fileName = `${feedId}.xml`;

  try {

    const feed = new FeedXml(null, metadata);

    feed.addItem({
      title: 'No updates yet',
      description: 'Feed will be updated daily at 5am local time.',
      pubDate: new Date().toUTCString(),
    });

    await ensureStore({ fileName, content: feed.xml });

    return {
      statusCode: 302,
      headers: {
        Location: `/feeds/${feedId}`,
      },
      body: '',
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Feed creation error'
    };
  }
}

async function handleGet(feedId) {
  try {
    const feed = await getFeed(feedId);
    await updateActive(feedId);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
      body: feed.xml,
    }
  } catch (err) {
    return {
      statusCode: 404,
      body: 'Feed not found'
    };
  }
}

async function handlePut(feedId, event) {
  try {
    const metadata = JSON.parse(event?.body || '{}');
    const feed = await getFeed(feedId);
    feed.addItem(metadata);
    await ensureStore({ fileName: `${feedId}.xml`, content: feed.xml });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Feed XML updated' }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: 'Server error, failed to update feed',
    };
  }
}

async function handleDelete(feedId) {
  await store.delete(`${feedId}.xml`);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Feed deleted' }),
  };
}

export async function handler(event, context) {
  const path = event.path; // "/.netlify/functions/feeds/40.7_-73.6"
  const parts = path.split('/');
  const feedId = parts.at(-1);

  switch (event.httpMethod) {
    case 'POST':
      return handlePost(event, context);

    case 'GET':
      return handleGet(feedId);

    case 'PUT':
      return handlePut(feedId, event);

    case 'DELETE':
      return handleDelete(feedId);

    default:
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
  }
}
