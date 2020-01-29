import { getRecords, incrementRequests, tableNames } from '../api/database.js';

export async function handler({ queryStringParameters }) {
  const { coords } = queryStringParameters || {};
  if (coords) {
    await increment(coords);
    return {
      statusCode: 301,
      headers: {
        Location: `https://rss.deltazeus.com/${coords}.xml`,
      }
    }
  }
  return {
    statusCode: 404,
    body: JSON.stringify(queryStringParameters),
  }
}

async function increment(coords) {
  let records = await getRecords(tableNames.DZ_TODAY, `{coords} = "${coords}"`);
  return incrementRequests(records);
}