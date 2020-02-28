const { DYNAMO_TABLENAMES } = require('../lib/aws.js');
const headers = require('../lib/headers.js');
const Records = require('../lib/records.js');

module.exports = async function (event, context, callback) {
  const thresholds = await new Records({ coords: 'default' }, DYNAMO_TABLENAMES.DZ_THRESHOLDS).get();
  response = {
    statusCode: 200,
    headers,
    body: JSON.stringify({ thresholds }),
  };
  callback(null, response);
}