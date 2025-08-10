import { getStore } from '@netlify/blobs';
import { parseStringPromise, Builder } from 'xml2js';
import multipartParser from 'lambda-multipart-parser';

const store = getStore({
    name: 'feeds',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
});

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
        return Object.assign(acc, { [[NS, key].join(':')]: value });
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
                lastBuildDate: new Date().toUTCString(),
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

function timeZoneOffset(tz) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset"
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === "timeZoneName");

    // offsetPart.value will be like "GMT-5" or "GMT+3"
    const match = offsetPart?.value.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] || "0", 10);

    // Convert to `-500` style
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

    try {
        const existingFeed = await store.get(feedXmlKey, { type: 'text' });

        if (!existingFeed) {
            const emptyFeedXml = generateEmptyFeedXml(metadata);
            await store.set(feedXmlKey, emptyFeedXml, { contentType: 'application/rss+xml' });
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
    headers: { 'Content-Type': 'application/rss+xml' },
    body: feedXml,
  };
}

async function handlePut(feedId, metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { statusCode: 400, body: 'Valid JSON body required' };
  }

  const feedXml = await store.get(`${feedId}.xml`, { type: 'text' });
  if (!feedXml) {
    return { statusCode: 404, body: 'Feed XML not found' };
  }

  // Parse XML to JS object
  const feedObj = await parseStringPromise(feedXml);

  // Ensure structure exists
  feedObj.rss = feedObj.rss || {};
  feedObj.rss.channel = feedObj.rss.channel || [{}];
  const channel = feedObj.rss.channel[0];

  // Ensure custom metadata exists
  channel['weather:metadata'] = channel['weather:metadata'] || [{}];
  const customMeta = channel['weather:metadata'][0];

  // Update metadata (example: lastUpdated)
  customMeta['weather:lastUpdated'] = [metadata.lastUpdated || new Date().toISOString()];

  // Build XML back from JS object
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true },
  });
  const updatedXml = builder.buildObject(feedObj);

  // Save updated XML feed
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
