const cron = require('../lib/cron.js');

module.exports.handler = async (event, context, callback) => {
  const update = await cron();
  const response = {
    statusCode: 200,
    body: JSON.stringify({ update })
  };
  callback(null, response);
}