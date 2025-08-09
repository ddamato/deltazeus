import { getStore } from '@netlify/blobs';
import { parseStringPromise, Builder } from 'xml2js';

const store = getStore('feeds'); // all blobs will live in this "feeds" store

export async function handler(event) {
  const feedId = event.pathParameters?.feedId;
  if (!feedId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Feed ID required' }),
    };
  }

  let body;
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }
  }

  switch (event.httpMethod) {
    case 'GET':
      return handleGet(feedId);

    case 'PUT':
      return handlePut(feedId, body);

    case 'DELETE':
      return handleDelete(feedId);

    default:
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
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
