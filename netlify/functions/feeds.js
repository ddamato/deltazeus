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
  const feedXmlKey = `${feedId}.xml`;

  // For debugging.
  // await store.delete(`${feedId}.xml`);

  try {
    const existingFeedXml = await store.get(feedXmlKey, { type: 'text' });
  
    if (!existingFeedXml) {
      const feed = new FeedXml(null, metadata);
      // Add default "no updates" item
      feed.addItem({
        title: 'No updates yet',
        description: 'Feed will be updated daily at 5am local time.',
        pubDate: new Date().toUTCString(),
      });

      await store.set(feedXmlKey, feed.xml, { contentType: 'application/rss+xml' });
    }

    return {
      statusCode: 302,
      headers: {
        Location: `/feeds/${feedId}`,
      },
      body: '',
    };
  } catch (err) {
    console.error('Feed creation error:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
}

async function handleGet(feedId) {
  const feedXml = await store.get(`${feedId}.xml`, { type: 'text' });
  if (!feedXml) {
    return { statusCode: 404, body: 'Feed not found' };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
    body: feedXml,
  };
}

async function handlePut(feedId, event) {
  let metadata;
  try {
    metadata = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }
  if (!metadata || typeof metadata !== 'object') {
    return { statusCode: 400, body: 'Valid JSON body required' };
  }

  const feedXml = await store.get(`${feedId}.xml`, { type: 'text' });
  if (!feedXml) {
    return { statusCode: 404, body: 'Feed XML not found' };
  }

  // Load existing feed XML into FeedXml class
  let feed;
  try {
    feed = new FeedXml(feedXml);
  } catch (err) {
    console.error('Failed to parse existing feed XML:', err);
    return { statusCode: 500, body: 'Malformed feed XML' };
  }

  // Add new item from metadata
  feed.addItem(metadata);

  const updatedXml = feed.xml;

  await store.set(`${feedId}.xml`, updatedXml, { contentType: 'application/rss+xml' });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Feed XML updated' }),
  };
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
