import cron from '../lib/cron.js';

export async function handler() {
  const update = await cron();
  return {
    statusCode: 200,
    body: JSON.stringify({ update })
  }
}