const { DZ_AWS_ACCESS_KEY, DZ_AWS_SECRET_KEY } = process.env;
const region = 'us-east-1';

export default {
  region,
  accessKeyId: DZ_AWS_ACCESS_KEY,
  secretAccessKey: DZ_AWS_SECRET_KEY
};

export const DYNAMO_TABLENAMES = {
  DZ_TODAY: 'deltazeusToday',
  DZ_THRESHOLDS: 'deltazeusThresholds',
}
