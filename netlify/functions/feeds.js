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
    lat: Number(latitude.toFixed(1)),
    lon: Number(longitude.toFixed(1)),
    tzOffset: timeZoneOffset(timezone),
  };
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
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `/feeds/${feedId}` }
    });
  } catch (err) {
    console.error('Feed creation error:', err);
    return new Response('Feed creation error', { status: 500 });
  }
}

async function handleGet(feedId) {
  try {
    const feed = await new FeedXml(feedId);
    await update(feedId);
    return new Response(feed.xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch {
    return new Response('Feed not found', { status: 404 });
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
