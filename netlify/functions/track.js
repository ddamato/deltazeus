import { getStore } from '@netlify/blobs';

const fileName = 'active.json';
const contentType = 'application/json';

/**
 * Determines the current hour at given timezone.
 * 
 * @param {String} tzName - The IANA timezone name
 * @returns {Number} - The local hour at that timezone
 */
function getLocalHour(tzName) {
    return Number(
        new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: tzName,
        }).format(new Date())
    );
}

/**
 * Creates a tracking entry, store as blob.
 * Executes on POST.
 * 
 * @param {String} tzName - IANA timezone name
 * @param {String} feedId - lat_lon identifier
 * 
 * @example
 * { America/New_York: { 41_-74: 2025-08-25 } }
 */
export async function create(tzName, feedId) {
  const store = getStore('feeds');
  const active = (await store.get(fileName, { type: 'json' })) || {};

  // Ensure tzName object exists, create timestamp
  if (!active[tzName]) active[tzName] = {};
  active[tzName][feedId] = new Date().toISOString();

  // Store update
  await store.set(fileName, JSON.stringify(active), { contentType });
}

/**
 * Updates a tracking entry.
 * Executes on GET.
 * 
 * @param {String} feedId - lat_lon identifier
 */
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

/**
 * Get a collection of entries where
 * the timezone matches the given hour.
 * 
 * @example atHour = 5, returns entries where
 * it is currently 5am for that timezone.
 * 
 * @param {Number} atHour - The hour to lookup by timezone.
 * @returns {Object} - A collection of { [feedId]: lastUpdatedDate }
 */
export async function get(atHour) {
  const store = getStore('feeds');
  const active = await store.get(fileName, { type: 'json' });
  const include = (tzName) => typeof atHour !== 'number' || getLocalHour(tzName) === atHour;

  // Return object of { [feedId]: lastUpdated }
  return Object.entries(active).reduce((acc, [tzName, entry]) => {
    return include(tzName) ? Object.assign(acc, entry) : acc;
  }, {});
}

/**
 * Deletes an entry, clears timezone if empty.
 * 
 * @param {String} feedId - lat_lon identifier
 */
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
