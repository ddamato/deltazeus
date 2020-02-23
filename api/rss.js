import Coords from '../lib/coords.js';
import Records from '../lib/records.js';

export async function handler({ queryStringParameters }) {
  const { coords } = queryStringParameters || {};
  if (coords) {
    await new Records({ coords: new Coords(coords) }).increment();
    return {
      statusCode: 301,
      headers: {
        Location: `https://www.deltazeus.com/rss/${coords}.xml`,
      }
    }
  }
  return {
    statusCode: 404,
    body: JSON.stringify(queryStringParameters),
  }
}