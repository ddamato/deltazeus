// Single toggle to pause all Netlify function activity.
// Set to `true` to short-circuit handlers and skip the cron schedule.
export const PAUSED = true;

export const pausedResponse = () =>
  new Response('Service temporarily paused', { status: 503 });
