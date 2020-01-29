import { getRecords, incrementRequests } from '../api/database.js';

export async function handler({ queryStringParameters }) {
  const { coords } = queryStringParameters || {};
  if (coords) {
    increment(coords);
    return {
      statusCode: 301,
      body: `https://rss.deltazeus.com/${coords}.xml`,
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(queryStringParameters),
  }
}

async function increment(coords) {
  let records = await getRecords(tableNames.DZ_TODAY, `{coords} = "${coords}"`);
  incrementRequests(records);
}