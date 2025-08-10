import { getStore } from '@netlify/blobs';
import { Builder } from 'xml2js';

const store = getStore('feeds'); // All blobs for feeds & metadata will live here

function generateEmptyFeedXml(metadata) {
  const { lat, lon } = metadata;
  const url = new URL(process.env.URL); // Base URL for the feed
  const NS = 'deltazeus'; // Custom namespace for the feed
  const link = new URL(`/feeds/${lat}_${lon}`, url).toString();

  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true },
  });

  const customNS = Object.entries(metadata).reduce((acc, [key, value]) => {
    return Object.assign(acc, {[[NS, key].join(':')]: value});
  }, {});

  const feedObject = {
    rss: {
      $: {
        version: '2.0',
        'xmlns:custom': `${new URL(NS, url).toString()}`, // custom namespace URI
      },
      channel: {
        title: `Weather Feed for ${lat}, ${lon}`,
        link,
        description: `Empty weather feed for ${lat}, ${lon}`,
        ...customNS,
        item: {
          title: 'No updates yet',
          description: 'Feed will be updated daily at 5am local time.',
          pubDate: new Date().toUTCString(),
        },
      },
    },
  };

  return builder.buildObject(feedObject);
}

export async function handler(event, context) {

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { latitude, longitude } = context.geo;

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON in request body' };
  }

  const { lat, lon, timezone } = body;

  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    typeof timezone !== 'string' ||
    !timezone.trim()
  ) {
    return { statusCode: 400, body: 'lat, lon, and timezone are required' };
  }

  const feedId = `${lat}_${lon}`;
  const feedXmlKey = `${feedId}.xml`;
  const feedMetaKey = `${feedId}.json`;

  try {
    const existingFeed = await store.get(feedXmlKey, { type: 'text' });

    if (!existingFeed) {
      const emptyFeedXml = generateEmptyFeedXml(lat, lon, timezone);
      await store.set(feedXmlKey, emptyFeedXml, { contentType: 'application/rss+xml' });

      const metadata = {
        latitude: lat,
        longitude: lon,
        timezone,
        lastUpdated: null,
      };
      await store.set(feedMetaKey, JSON.stringify(metadata), { contentType: 'application/json' });
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
