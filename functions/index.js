import getWeather from '../api/weather.js';
import getCoordsByPostal from '../api/postal.js';
import Coords from '../api/coords.js';

export async function handler ({ queryStringParameters }) {
  const { latitude, longitude, postal, time } = queryStringParameters || {};
  let coords;
  if (postal) {
    coords = getCoordsByPostal(postal);
  }

  if (latitude && longitude) {
    coords = new Coords(latitude, longitude);
  }

  if (coords) {
    const weather = await getWeather({ ...coords, time });
    return {
      statusCode: 200,
      body: JSON.stringify(weather)
    };
  }

  return {
    statusCode: 300,
    body: 'Incomplete query'
  };
  
}