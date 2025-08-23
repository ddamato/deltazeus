import { getStore } from '@netlify/blobs';
import { get, remove } from './track.js';
import { FeedXml } from './xml.js';

const significantDiffs = {
    'avgtemp_c': 5,
    'avgtemp_f': 9,
    'maxwind_kph': 15,
    'maxwind_mph': 9,
    'totalprecip_mm': 10,
    'totalprecip_in': .4,
    'avghumidity': 15,
    'uv': 2
};

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

function isSignificant(metricKey, yesterday, today) {
    if (!(metricKey in significantDiffs)) return NaN;
    const diff = today[metricKey] - yesterday[metricKey];
    return Math.abs(diff) >= significantDiffs[metricKey] ? diff : NaN;
}

function formatChange(label, emoji, diff1, unit1, diff2, unit2) {
    const trendEmoji = diff1 > 0 ? '📈' : '📉';
    const arrow = diff1 > 0 ? '↑' : '↓';
    let message = `${emoji} ${trendEmoji} ${label} ${arrow}: ${Math.abs(diff1)}${unit1}`;

    if (diff2 !== undefined && unit2) {
        message += ` / ${Math.abs(diff2)}${unit2}`;
    }

    return message;
}

async function weatherDiffs(feedId, dateRange) {

    const url = new URL('https://api.weatherapi.com/v1/history.json');
    url.search = new URLSearchParams({
        key: process.env.WEATHER_API_KEY,
        q: feedId.split('_').join(','),
        ...dateRange,
    }).toString();

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();

    const [{ day: yesterday }, { day: today }] = data.forecast.forecastday;
    return { yesterday, today };
}

function createUpdate(yesterday, today) {

    const messages = [];

    // Average temperature
    const diffC = isSignificant('avgtemp_c', yesterday, today);
    const diffF = isSignificant('avgtemp_f', yesterday, today);
    if (!isNaN(diffC) || !isNaN(diffF)) {
        messages.push(formatChange('Average temperature', '🌡️', diffC ?? 0, '°C', diffF ?? 0, '°F'));
    }

    // Wind speed
    const diffKph = isSignificant('maxwind_kph', yesterday, today);
    const diffMph = isSignificant('maxwind_mph', yesterday, today);
    if (!isNaN(diffKph) || !isNaN(diffMph)) {
        messages.push(formatChange('Wind speed', '💨', diffKph ?? 0, ' kph', diffMph ?? 0, ' mph'));
    }

    // Precipitation
    const diffMm = isSignificant('totalprecip_mm', yesterday, today);
    const diffIn = isSignificant('totalprecip_in', yesterday, today);
    if (!isNaN(diffMm) || !isNaN(diffIn)) {
        messages.push(formatChange('Precipitation', '🌧️', diffMm ?? 0, ' mm', diffIn ?? 0, ' in'));
    }

    // Humidity
    const diffHum = isSignificant('avghumidity', yesterday, today);
    if (!isNaN(diffHum)) {
        messages.push(formatChange('Humidity', '💧', diffHum, '%'));
    }

    // UV
    const diffUV = isSignificant('uv', yesterday, today);
    if (!isNaN(diffUV)) {
        messages.push(formatChange('UV index', '☀️', diffUV, ''));
    }

    return messages.join('\n').trim();
}

export default async function handler() {
    const store = getStore('feeds');
    const utcHour = new Date().getUTCHours();
    // All feeds where the current time would be 5am based on their tzOffset and server time.
    
    const offset = null; // 5 - utcHour;
    const feeds = await get(offset);

    for (const [feedId, lastUpdated] of Object.entries(feeds)) {
        if (isExpired(lastUpdated, 5)) {
            await store.delete(`${feedId}.xml`);
            await remove(feedId);
        } else {
            try {
                // All weather queried at noon by location
                const dateRange = getDateRange(12 - utcHour);
                const { yesterday, today } = await weatherDiffs(feedId, dateRange);
                const description = createUpdate(yesterday, today);
                if (description) {
                    const feed = await new FeedXml(feedId);
                    const d = new Date();
                    await feed.addItem({
                        title: `Significant Weather Update for ${dateRange.end_dt}`,
                        description,
                        pubDate: d.toUTCString(),
                        guid: d.toISOString()
                    });
                }
                return new Response('Feeds updated', { status: 200 });
            } catch (err) {
                console.error(`Failed to update feed ${feedId}:`, err);
                return new Response('Internal Server Error', { status: 500 });
            }
        }
    }
}

export const config = {
    schedule: "@hourly"
}
