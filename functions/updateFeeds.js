import daily from '../api/cron.js';

export async function handler() {
  return await daily();
}