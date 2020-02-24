const { DZ_AWS_ACCESS_KEY, DZ_AWS_SECRET_KEY } = process.env;
const region = 'us-east-1';

module.exports = {
  awsConfig: {
    region,
    accessKeyId: DZ_AWS_ACCESS_KEY,
    secretAccessKey: DZ_AWS_SECRET_KEY
  },
  DYNAMO_TABLENAMES: {
    DZ_TODAY: 'deltazeusToday',
    DZ_THRESHOLDS: 'deltazeusThresholds',
  }
};
