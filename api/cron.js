const cron = require('../lib/cron.js');

module.exports.handler = async (event, context, callback) => {
  const update = await cron();
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