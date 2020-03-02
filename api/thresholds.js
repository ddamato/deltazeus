const { DYNAMO_TABLENAMES } = require('../lib/aws.js');
const headers = require('../lib/headers.js');
const Records = require('../lib/records.js');
const { properties, createThreshold } = require('../lib/properties.js');

module.exports.handler = async (event, context, callback) => {
  const records = await new Records({ coords: 'default' }, DYNAMO_TABLENAMES.DZ_THRESHOLDS).get();
  const thresholds = Object.keys(records).reduce((acc, prop) => {
    if (prop in properties) {
      const { abbr } = properties[prop];
      Object.assign(acc, { [abbr]: createThreshold(records[prop], prop) });
    }
    return acc;
  }, {});

  const response = {
    statusCode: 200,
    headers: headers(event),
    body: JSON.stringify({ thresholds }),
  };
  callback(null, response);
}