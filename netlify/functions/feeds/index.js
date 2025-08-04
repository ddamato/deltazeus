import { get, set } from '@netlify/blobs';
import { Builder } from 'xml2js';

function generateEmptyFeedXml(lat, lon, timezone) {
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true },
  });

  const feedObject = {
    rss: {
      $: {
        version: '2.0',
        'xmlns:custom': 'http://example.com/custom', // add your custom namespace URI
      },
      channel: {
        title: `Weather Feed for ${lat},${lon}`,
        link: `https://yourdomain.com/feeds/${lat}_${lon}`,
        description: `Empty weather feed for ${lat},${lon}`,
        'custom:metadata': {
          'custom:latitude': lat,
          'custom:longitude': lon,
          'custom:timezone': timezone,
          'custom:lastUpdated': '',
        },
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

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const { lat, lon, timezone } = body;

  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    typeof timezone !== 'string' ||
    !timezone.trim()
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'lat, lon, and timezone are required' }),
    };
  }

  const feedId = `${lat}_${lon}`;
  const feedXmlPath = `feeds/${feedId}.xml`;

  try {
    let existingFeed;
    try {
      existingFeed = await get(feedXmlPath);
    } catch {
      existingFeed = null;
    }

    if (!existingFeed) {
      const emptyFeedXml = generateEmptyFeedXml(lat, lon, timezone);
      await set(feedXmlPath, emptyFeedXml, { contentType: 'application/rss+xml' });

      const metadata = {
        latitude: lat,
        longitude: lon,
        timezone,
        lastUpdated: null,
      };
      await set(feedMetaPath, JSON.stringify(metadata), { contentType: 'application/json' });
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        feedId,
        url: `/feeds/${feedId}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
