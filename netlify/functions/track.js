import { useStore } from "./store";

const fileName = 'active.json';
const contentType = 'application/json';

const store = useStore();

export async function create(tzOffset, feedId) {
  let active = (await store.get(fileName, { type: 'json' })) || Array.from({ length: 24 }, () => ({}));

  const tzOffsetHour = Math.max(0, Math.min(23, parseInt(tzOffset, 10)));
  active[tzOffsetHour][feedId] = new Date().toISOString();

  await store.set(fileName, JSON.stringify(active), { contentType });
}

export async function update(feedId) {
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
  const active = await store.get(fileName, { type: 'json' })

  if (tzOffsetHour == null) {
    return active.reduce((acc, hourObj) => Object.assign(acc, hourObj), {});
  }
  return active[tzOffsetHour] || {};
}

export async function remove(feedId) {
  const active = await store.get(fileName, { type: 'json' })

  for (const hourObj of active) {
    if (hourObj[feedId]) {
      delete hourObj[feedId];
      break;
    }
  }

  await store.set(fileName, JSON.stringify(active), { contentType });
}
