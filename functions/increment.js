import { getRecords, incrementRequests } from '../api/database.js';

export async function handler({ queryStringParameters }) {
  const { xml } = queryStringParameters;
  const response = {
    statusCode: 302,
    body: queryStringParameters,
  }
  if (xml) {
    const coords = xml.split('.').shift();
    increment(coords);
    response.headers = {
      Location: `https://rss.deltazeus.com/${coords}.xml`
    };
  }
  return response;
}

async function increment(coords) {
  let records = await getRecords(tableNames.DZ_TODAY, `{coords} = "${coords}"`);
  incrementRequests(records);
}