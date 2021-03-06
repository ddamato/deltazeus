const Coords = require('../lib/coords.js');
const Records = require('../lib/records.js');
const Rss = require('../lib/rss.js');
const headerFn = require('../lib/headers.js');

module.exports.handler = async (event, context, callback) => {
  const { queryStringParameters } = event;
  const { coords } = queryStringParameters || {};
  const headers = headerFn(event);
  let response = {
    statusCode: 404,
    headers,
    body: JSON.stringify(queryStringParameters),
  }

  if (coords && /_/.test(coords)) {
    const [latitude, longitude] = coords.split('_');
    const fields = { coords: new Coords(latitude, longitude) };
    const exists = await new Rss(fields.coords).exists();
    if (exists) {
      await new Records(fields).increment();
      const Location = `https://www.deltazeus.com/rss/${coords}.xml`;
      response = {
        statusCode: 302,
        headers: Object.assign(headers, { Location })
      };
    }
  }
  callback(null, response);
}