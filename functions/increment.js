import { getRecords, incrementRequests } from '../api/database.js';

export async function handler({ queryStringParameters }) {
  const { coords } = queryStringParameters;
  increment(coords);
  return {
    statusCode: 302,
    headers: {
      Location: `https://www.deltazeus.com/rss/${coords}.xml`
    }
  };
}

async function increment(coords) {
  let records = await getRecords(tableNames.DZ_TODAY, `{coords} = "${coords}"`);
  incrementRequests(records);
}