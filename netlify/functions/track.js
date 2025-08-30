import { getStore } from '@netlify/blobs';

const fileName = 'active.json';
const contentType = 'application/json';

function getLocalHour(tzName) {
    return Number(
        new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: tzName,
        }).format(new Date())
    );
}

export async function create(tzName, feedId) {
  const store = getStore('feeds');
  const active = (await store.get(fileName, { type: 'json' })) || {};

  // Ensure tzName object exists, create timestamp
  if (!active[tzName]) active[tzName] = {};
  active[tzName][feedId] = new Date().toISOString();

  // Store update
  await store.set(fileName, JSON.stringify(active), { contentType });
}

export async function update(feedId) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' });

  // For each tz, look for feedId and update
  for (const tzName in active) {
    if (active[tzName][feedId]) {
      active[tzName][feedId] = new Date().toISOString();
    }
  }

  // Store update
  await store.set(fileName, JSON.stringify(active), { contentType });
}

export async function get(atHour) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' });
  const include = (tzName) => typeof atHour !== 'number' || getLocalHour(tzName) === atHour;

  // Return object of { [feedId]: lastUpdated }
  return Object.entries(active).reduce((acc, [tzName, entry]) => {
    return typeof include(tzName) ? Object.assign(acc, entry) : acc;
  }, {});
}

export async function remove(feedId) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' })

  // For each tz, look for feedId and delete
  for (const tzName in active) {
    if (active[tzName][feedId]) {
      delete active[tzName][feedId];
    }

    // clear any empty tz
    if (!Object.keys(active[tzName]).length) {
      delete active[tzName];
    }
  }

  await store.set(fileName, JSON.stringify(active), { contentType });
}
