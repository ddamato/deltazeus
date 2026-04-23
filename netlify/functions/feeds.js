import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { FeedXml } from './xml.js';
import { create, update } from './track.js';

/**
 * Creates a payload from the Netlify Context as a backup.
 * 
 * @param {Object} netlifyContext - Context from Netlify handler
 * @returns {Object} - A similar payload in case it is malformed 
 */
function contextMeta(netlifyContext) {
  if (!netlifyContext?.geo) return {};
  const { latitude, longitude, timezone } = netlifyContext.geo;
  return {
    lat: Number(latitude.toFixed(0)),
    lon: Number(longitude.toFixed(0)),
    tzName: timezone,
  };
}

/**
 * Gets the temporary filepath for an XML file.
 * 
 * @param {String} feedId - lat_lon identifier
 * @returns {String} - Filepath for temp file
 */
function getTmpPath(feedId) {
  return path.join(os.tmpdir(), `${feedId}.xml`);
}

/**
 * Creates a new feed.
 * 
 * @param {Request} req - HTTP Request
 * @param {Object} netlifyContext - Netlify Context
 * @returns {Response} - HTTP Response, redirect to GET
 */
async function handlePost(req, netlifyContext) {
  const parsed = Object.fromEntries(await req.formData());
  const { lat, lon, tzName } = Object.assign({}, contextMeta(netlifyContext), parsed);
  const feedId = `${lat}_${lon}`;

  try {
    console.log(`Creating feed: ${feedId} at ${tzName}`);
    const feed = await new FeedXml(feedId, tzName);

    if (feed.isNew) {
      const d = new Date();

      await feed.addItem({
        title: 'No updates yet',
        description: 'Feed will be updated daily at 5am local time if there are significant changes.',
        pubDate: d.toUTCString(),
        guid: d.toISOString()
      });

      await create(tzName, feedId);

      // Write feed XML to /tmp to guarantee availability
      await fs.promises.writeFile(getTmpPath(feedId), feed.xml, 'utf-8');
    }

    const endpoint = `/feeds/${feedId}`;

    return new Response(null, {
      status: 302,
      headers: { Location: endpoint }
    });
  } catch (err) {
    console.error('Feed creation error:', err);
    return new Response('Feed creation error', { status: 500 });
  }
}

/**
 * Gets the feed XML.
 * 
 * @param {String} feedId - lat_lon identifier
 * @returns {Response} - The feed XML
 */
async function handleGet(feedId) {
  try {
    const feed = await new FeedXml(feedId);
    await update(feedId);
    return new Response(feed.xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300',
        'Netlify-CDN-Cache-Control': 'public, s-maxage=3600, durable',
        'Netlify-Cache-Tag': `feed-${feedId}`,
      }
    });
  } catch (err) {
    console.error(`Request for unknown feed: ${feedId}`, err);
    return new Response('Feed not found. If it was just created, try refreshing this page', { status: 404 });
  }
}

export default async (req, netlifyContext) => {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const feedId = parts.at(-1);

  switch (req.method) {
    case 'POST':
      return handlePost(req, netlifyContext);
    case 'GET':
      return handleGet(feedId);
    default:
      return new Response('Method Not Allowed', { status: 405 });
  }
};
