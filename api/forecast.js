const Coords = require('../lib/coords.js');
const getWeather = require('../lib/weather.js');
const getCoordsByPostal = require('../lib/postal.js');
const Rss = require('../lib/rss.js');
const headers = require('../lib/headers.js');
const publishFeeds = require('../lib/publish.js');

module.exports.handler = async (event, context, callback) => {
  const { queryStringParameters } = event;
  const { latitude, longitude, postal, time } = queryStringParameters || {};
  let coords;
  let response = {
    statusCode: 300,
    headers,
    body: JSON.stringify({ message: 'Incomplete query' })
  };

  if (postal) {
    coords = await getCoordsByPostal(postal);
  }

  if (latitude && longitude) {
    coords = new Coords(latitude, longitude);
  }

  if (coords && time) {
    await getWeather({ ...coords, time });
    const rss = new Rss(coords);
    const exists = await rss.exists();
    if (!exists) {
      await rss.init();
      await publishFeeds(rss);
    }
    response = {
      statusCode: 200,
      headers: headers(event),
      body: JSON.stringify({ rss: rss.getPublicUrl() }),
    };
  }

  callback(null, response);
}