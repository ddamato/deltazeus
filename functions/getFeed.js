import getWeather from '../api/weather.js';
import getCoordsByPostal from '../api/postal.js';
import Coords from '../api/coords.js';
import feedContents from '../api/rss.js';

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
    const records = await getWeather({ ...coords, time });
    if (records.length) {
      const contents = 'No weather changes yet, sync this feed with a RSS service for updates.';
      const link = await feedContents(coords, contents);
      return {
        statusCode: 200,
        body: link,
      };
    }
  }

  return {
    statusCode: 300,
    body: 'Incomplete query'
  };
  
}