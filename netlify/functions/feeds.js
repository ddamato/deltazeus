import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
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

function contextMeta(netlifyContext) {
  if (!netlifyContext?.geo) return {};
  const { latitude, longitude, timezone } = netlifyContext.geo;
  return {
    lat: Number(latitude.toFixed(0)),
    lon: Number(longitude.toFixed(0)),
    tzOffset: timeZoneOffset(timezone),
  };
}

function getTmpPath(feedId) {
  return path.join(os.tmpdir(), `${feedId}.xml`);
}

async function handlePost(req, netlifyContext) {
  const parsed = Object.fromEntries(await req.formData());
  const { lat, lon, tzOffset } = Object.assign({}, contextMeta(netlifyContext), parsed);
  const feedId = `${lat}_${lon}`;

  try {
    const feed = await new FeedXml(feedId, true);

    if (feed.isNew) {
      const d = new Date();

      await feed.addItem({
        title: 'No updates yet',
        description: 'Feed will be updated daily at 5am local time if there are significant changes.',
        pubDate: d.toUTCString(),
        guid: d.toISOString()
      });

      const tzOffsetHours = Math.round(tzOffset / 3600);
      await create(tzOffsetHours, feedId);
      await update(feedId);

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

async function handleGet(feedId) {
  // Look in tmp directory first
  return fs.promises.readFile(getTmpPath(feedId), 'utf-8').catch((err) => {
    // If it doesn't exist there
    console.log(`${feedId} does not exist in tmp`);
    if (err.code !== 'ENOENT') throw err;
    // Try getting from blobs
    return new FeedXml(feedId).then((feed) => update(feedId).then(() => feed.xml));
  }).then((xml) => {
    return new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    })
  }).catch((err) => {
    // Feed isn't available, either missing in /tmp or not available in blobs
    console.error(`Request for unknown feed: ${feedId}`, err);
    return new Response('Feed not found. If it was just created, try refreshing this page', { status: 404 });
  });
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
