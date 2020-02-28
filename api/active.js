const headers = require('../lib/headers.js');
const Records = require('../lib/records.js');

module.exports.handler = async (event, context, callback) => {
  const active = await new Records().all();
  response = {
    statusCode: 200,
    headers,
    body: JSON.stringify({ active }),
  };
  callback(null, response);
}