import hourlyCron from '../api/cron.js';

export async function handler() {
  const records = await hourlyCron();
  return {
    statusCode: 200,
    body: JSON.stringify(records),
  };
}