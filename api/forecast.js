const getWeather = require('../lib/weather.js');
const getCoordsByPostal = require('../lib/postal.js');
const Rss = require('../lib/rss.js');

module.exports.handler = async (event, context, callback) => {
  const { queryStringParameters } = event;
  const { latitude, longitude, postal, time } = queryStringParameters || {};
  let coords;
  let response = {
    statusCode: 300,
    body: 'Incomplete query'
  };

  if (postal) {
    coords = await getCoordsByPostal(postal);
  }

  if (latitude && longitude) {
    coords = new Coords(latitude, longitude);
  }

  if (coords && time) {
    await getWeather({ ...coords, time });
    response = {
      statusCode: 200,
      body: new Rss(coords).getPublicUrl(),
    };
  }

  callback(null, response);
}