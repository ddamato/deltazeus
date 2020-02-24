const Coords = require('../lib/coords.js');
const Records = require('../lib/records.js');
const Rss = require('../lib/rss.js');

module.exports.handler = async (event, context, callback) => {
  const { queryStringParameters } = event;
  const { coords } = queryStringParameters || {};
  let response = {
    statusCode: 404,
    body: JSON.stringify(queryStringParameters),
  }

  if (coords && /_/.test(coords)) {
    const [latitude, longitude] = coords.split('_');
    const fields = { coords: new Coords(latitude, longitude) };
    const exists = await new Rss(fields.coords).exists();
    if (exists) {
      await new Records(fields).increment();
      response = {
        statusCode: 302,
        headers: {
          Location: `https://www.deltazeus.com/rss/${coords}.xml`,
        }
      };
    }
  }
  callback(null, response);
}