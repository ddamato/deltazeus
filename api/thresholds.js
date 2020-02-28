const { DYNAMO_TABLENAMES } = require('../lib/aws.js');
const headers = require('../lib/headers.js');
const Records = require('../lib/records.js');
const properties = require('../lib/properties.js');

module.exports.handler = async (event, context, callback) => {
  const records = await new Records({ coords: 'default' }, DYNAMO_TABLENAMES.DZ_THRESHOLDS).get();
  const thresholds = Object.keys(records).reduce((acc, prop) => {
    if (prop in properties) {
      const key = properties[prop].abbr;
      const value = properties[prop].units(records[prop]);
      Object.assign(acc, { [key]: value });
    }
    return acc;
  }, {});

  response = {
    statusCode: 200,
    headers,
    body: JSON.stringify({ thresholds }),
  };
  callback(null, response);
}