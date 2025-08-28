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
  const active = await store.get(fileName, { type: 'json' }) || {};

  let existing = active[tzName];
  if (!existing) { active[tzName] = {}; }
  Object.assign(active[tzName], {[feedId]: new Date().toISOString()});

  await store.set(fileName, JSON.stringify(active), { contentType });
}

export async function update(feedId) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' });

  for (const tzName in active) {
    if (active[tzName].feedId === feedId) {
      active[tzName].lastRequested = new Date().toISOString();
    }
  }

  await store.set(fileName, JSON.stringify(active), { contentType });
}

export async function get(atHour) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' });

  return Object.entries(active).reduce((acc, [tzName, entry]) => {
    return typeof atHour !== 'number' || getLocalHour(tzName) === atHour ? Object.assign(acc, entry) : acc;
  }, {});
}

export async function remove(feedId) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' })

  for (const tzName in active) {
    if (active[tzName].feedId === feedId) {
      delete active[tzName];
    }
  }

  await store.set(fileName, JSON.stringify(active), { contentType });
}
