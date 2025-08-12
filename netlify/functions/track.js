const fileName = 'active.json';
const contentType = 'application/json';

const store = getStore({
  name: 'feeds',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_API_TOKEN,
});

export async function create(tzOffset, feedId) {
  let active;

  try {
    active = await store.get(fileName, { type: 'json' });
  } catch {
    active = Array.from({ length: 24 }, () => ({}));
    await store.set(fileName, JSON.stringify(active), { contentType });
  }

  const tzOffsetHour = parseInt(tzOffset, 10);
  active.at(tzOffsetHour)[feedId] = new Date().toISOString();

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
  const active = await store.get(fileName, { type: 'json' });
  return active.at(tzOffsetHour) || {};
}

export async function remove(feedId) {
  const active = await store.get(fileName, { type: 'json' });

  for (const hourObj of active) {
    if (hourObj[feedId]) {
      delete hourObj[feedId];
      break;
    }
  }

  await store.set(fileName, JSON.stringify(active), { contentType });
}
