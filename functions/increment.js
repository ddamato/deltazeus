import { getRecords, incrementRequests } from '../api/database.js';

export async function handler({ queryStringParameters }) {
  return {
    statusCode: 200,
    body: 'cool',
  }
}

async function increment(coords) {
  let records = await getRecords(tableNames.DZ_TODAY, `{coords} = "${coords}"`);
  incrementRequests(records);
}