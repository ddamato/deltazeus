import { Router } from 'lambda-router';

const NETLIFY_FUNCTIONS = '/.netlify/functions/api'
let paths = {
  DEFAULT_GET: '/',
};
const router = Router({ logger: console });
Object.keys(paths).forEach((path) => paths[path] = NETLIFY_FUNCTIONS + path);

router.get(paths.DEFAULT_GET, () => {
  return { message: 'success' }
});

export async function handler (lambdaEvent, context) {
  context.callbackWaitsForEmptyEventLoop = false
  let result = await router.route(lambdaEvent, context)
 
  return result.response;
}