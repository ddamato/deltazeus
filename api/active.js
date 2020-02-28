const headers = require('../lib/headers.js');
const Records = require('../lib/records.js');
const Coords = require('../lib/coords.js');
const Rss = require('../lib/rss.js');

module.exports.handler = async (event, context, callback) => {
  const records = await new Records().all();
  const active = Object.keys(records).reduce((acc, { latitude, longitude }) => {
    const coords = new Coords(latitude, longitude);
    const rss = new Rss(coords).getPublicUrl();
    return acc.concat({ latitude, longitude, rss });
  }, []);
  const response = {
    statusCode: 200,
    headers: headers(event),
    body: JSON.stringify({ active }),
  };
  callback(null, response);
}