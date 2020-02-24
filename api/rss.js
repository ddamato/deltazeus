const Coords = require('../lib/coords.js');
const Records = require('../lib/records.js');

module.exports.handler = async (event, context, callback) => {
  const { queryStringParameters } = event;
  const { coords } = queryStringParameters || {};
  let response = {
    statusCode: 404,
    body: JSON.stringify(queryStringParameters),
  }

  if (coords && /_/.test(coords)) {
    const [latitude, longitude] = coords.split('_');
    await new Records({ coords: new Coords(latitude, longitude) }).increment();
    response = {
      statusCode: 301,
      headers: {
        Location: `https://www.deltazeus.com/rss/${coords}.xml`,
      }
    };
  }
  callback(null, response);
}