import { getStore } from '@netlify/blobs';

const fileName = 'active.json';
const contentType = 'application/json';

export async function create(tzOffsetHour, feedId) {
  const store = getStore('feeds');
  const active = (await store.get(fileName, { type: 'json' })) || Array.from({ length: 24 }, () => ({}));

  active.at(tzOffsetHour)[feedId] = new Date().toISOString();

  await store.set(fileName, JSON.stringify(active), { contentType });
}

export async function update(feedId) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' });

  for (const hourObj of active) {
    if (hourObj[feedId]) {
      hourObj[feedId] = new Date().toISOString();
      break;
    }
  }

  await store.set(fileName, JSON.stringify(active), { contentType });
}

export async function get(tzOffsetHour) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' });

  if (tzOffsetHour == null) {
    // If given no offset, return all { [feedId]: lastUpdated } in one object
    return active.reduce((acc, hourObj) => Object.assign(acc, hourObj), {});
  }
  return active.at(tzOffsetHour) || {};
}

export async function remove(feedId) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' })

  for (const hourObj of active) {
    if (hourObj[feedId]) {
      delete hourObj[feedId];
      break;
    }
  }

  await store.set(fileName, JSON.stringify(active), { contentType });
}
