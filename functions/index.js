import getWeather from '../api/weather.js';

export async function handler ({ path, httpMethod, queryStringParameters, body }, context) {
  const weather = await getWeather({latitude: 40.7181, longitude: -73.8448, time: '2020-01-26T12:00:00.000Z'});
  return {
    statusCode: 200,
    body: JSON.stringify(weather)
  };
}