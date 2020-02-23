import getWeather from '../lib/weather.js';
import getCoordsByPostal from '../lib/postal.js';
import Rss from '../lib/rss.js';

export async function handler ({ queryStringParameters }) {
  const { latitude, longitude, postal, time } = queryStringParameters || {};
  let coords;
  if (postal) {
    coords = await getCoordsByPostal(postal);
  }

  if (latitude && longitude) {
    coords = new Coords(latitude, longitude);
  }

  if (coords && time) {
    await getWeather({ ...coords, time });
    return {
      statusCode: 200,
      body: new Rss(coords).getPublicUrl(),
    };
  }

  return {
    statusCode: 300,
    body: 'Incomplete query'
  };
}