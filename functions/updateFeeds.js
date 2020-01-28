import daily from '../api/cron.js';

export async function handler() {
  const records = await daily();
  return {
    statusCode: 200,
    body: JSON.stringify(records),
  };
}