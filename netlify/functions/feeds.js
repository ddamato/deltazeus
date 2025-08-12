import multipartParser from 'lambda-multipart-parser';
import { FeedXml } from './xml.js';
import { create, update } from './track.js';

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

  const { lat, lon, tzOffset } = Object.assign({}, contextMeta(context), parsed);
  const feedId = `${lat}_${lon}`;

  try {
    const feed = await new FeedXml(feedId, true);

    await feed.addItem({
      title: 'No updates yet',
      description: 'Feed will be updated daily at 5am local time.',
      pubDate: new Date().toUTCString(),
    });

    await create(tzOffset, feedId);

    return {
      statusCode: 302,
      headers: {
        Location: `/feeds/${feedId}`,
      },
      body: '',
    };
  } catch (err) {
    console.error('Feed creation error:', err);
    return {
      statusCode: 500,
      body: 'Feed creation error'
    };
  }
}

async function handleGet(feedId) {
  try {
    const feed = await new FeedXml(feedId);
    await update(feedId);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
      body: feed.xml,
    };
  } catch (err) {
    return {
      statusCode: 404,
      body: 'Feed not found'
    };
  }
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

    default:
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
  }
}
