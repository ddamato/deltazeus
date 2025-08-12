import { get, remove } from './track.js';
import { FeedXml } from './xml.js';

const API_KEY = process.env.WEATHERAPI_KEY;

const store = getStore({
    name: 'feeds',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
});

const metrics = [
    'maxtemp_c',
    'maxtemp_f',
    'mintemp_c',
    'mintemp_f',
    'maxwind_kph',
    'maxwind_mph',
    'totalprecip_mm',
    'totalprecip_in',
    'avghumidity',
    'uv'
];

const isExpired = (iso, days) => Date.now() - new Date(iso).getTime() > days * 864e5;

function getDateRange(atHour) {
    const nowUtc = new Date();
    const currentUtcHour = nowUtc.getUTCHours();

    const targetUtcHour = (currentUtcHour + atHour + 24) % 24;

    const todayBoundary = new Date(Date.UTC(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate(),
        targetUtcHour, 0, 0, 0
    ));

    const yesterdayBoundary = new Date(todayBoundary);
    yesterdayBoundary.setUTCDate(todayBoundary.getUTCDate() - 1);

    const toDateString = (d) => d.toISOString().slice(0, 10);

    return {
        dt: toDateString(yesterdayBoundary),
        end_dt: toDateString(todayBoundary),
    };
}

async function weatherDiffs(feedId, dateRange) {

    const url = new URL('https://api.weatherapi.com/v1/history.json');
    url.search = new URLSearchParams({
        key: API_KEY,
        q: feedId.split('_').join(','),
        ...dateRange,
    }).toString();

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();

    const [{ day: yesterday }, { day: today }] = data.forecast.forecastday;
    return metrics.reduce((acc, metric) => Object.assign(acc, {[metric]: today[metric] - yesterday[metric]}), {});
}

function createUpdate(diffs) {
    // Takes each diff, checks to see if any change is significant.


    return '';
}

export default async function handler(req) {
    const utcHour = new Date().getUTCHours();
    // All feeds where the current time would be 5am based on their tzOffset and server time.
    const feeds = await get(5 - utcHour);

    for (const [feedId, lastUpdated] of Object.entries(feeds)) {
        if (isExpired(lastUpdated, 5)) {
            await store.delete(`${feedId}.xml`);
            await remove(feedId);
        } else {
            try {
                // All weather queried at noon by location
                const dateRange = getDateRange(12 - utcHour);
                const diffs = await weatherDiffs(feedId, dateRange);
                const description = createUpdate(diffs);
                if (description) {
                    const feed = await new FeedXml(feedId);
                    await feed.addItem({
                        title: `Significant Weather Update for ${dateRange.end_dt}`,
                        description,
                        pubDate: new Date().toUTCString(),
                    });
                }
            } catch (e) {
                console.error(`Failed to update feed ${feedId}:`, e);
            }
        }
    }
}

export const config = {
    // schedule: "@hourly",
};
