const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env;
const region = 'us-east-1';

export default {
  region,
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY
};

export const DYNAMO_TABLENAMES = {
  DZ_TODAY: 'deltazeusToday',
  DZ_THRESHOLDS: 'deltazeusThresholds',
}
