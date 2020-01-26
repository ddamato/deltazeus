import Router from 'lambda-router';

const router = Router({ logger: console });

router.get('/', async () => {
  return { message: 'Success' };
});
router.unknown((event, { response }, path) => {
  return response(404, {
    message: `You dun screwed up, now. ${path} doesn't exist!`
  })
})

export async function handler (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  let result = await router.route(event, context)

  return result.response
}