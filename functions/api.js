import Router from 'lambda-router';

const router = Router();

router.get('/', async () => {
  return { message: 'Success' };
});
router.unknown((x, y, path) => {
  return {
    message: `You dun screwed up, now. ${path} doesn't exist!`
  };
})

export async function handler (event, context) {
  const result = await router.route(event, context);
  return result.response;
}