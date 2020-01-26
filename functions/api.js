import { Router } from 'lambda-router';
const router = Router({
  logger: console // uses logger-wrapper.
})

router.get('/', () => {
  return { message: 'success' }
});

export async function handler (lambdaEvent, context) {
  context.callbackWaitsForEmptyEventLoop = false
  let result = await router.route(lambdaEvent, context)
 
  return result.response;
}