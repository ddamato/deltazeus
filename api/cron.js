const cron = require('../lib/cron.js');

module.exports.handler = async (event, context, callback) => {
  const { queryStringParameters } = event;
  const { force } = queryStringParameters || {};
  const update = await cron(force);
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({ update })
  };
  callback(null, response);
}