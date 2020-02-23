const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const region = 'us-east-1';

export default {
  region,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY
};

export const DYNAMO_TABLENAMES = {
  DZ_TODAY: 'deltazeusToday',
  DZ_THRESHOLDS: 'deltazeusThresholds',
}
