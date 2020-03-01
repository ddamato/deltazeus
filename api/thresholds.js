const { DYNAMO_TABLENAMES } = require('../lib/aws.js');
const headers = require('../lib/headers.js');
const Records = require('../lib/records.js');
const { properties } = require('../lib/properties.js');

module.exports.handler = async (event, context, callback) => {
  const records = await new Records({ coords: 'default' }, DYNAMO_TABLENAMES.DZ_THRESHOLDS).get();
  const thresholds = Object.keys(records).reduce((acc, prop) => {
    if (prop in properties) {
      const { convert, units, abbr } = properties[prop];      
      const converted = convert ? ` (${convert(records[prop])})` : '';
      const value = `${units(records[prop])}${converted}`;
      Object.assign(acc, { [abbr]: value });
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