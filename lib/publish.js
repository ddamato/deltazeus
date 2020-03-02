const axios = require('axios');
const PUBSUBHUBBUB_API_URL = 'https://pubsubhubbub.appspot.com';

module.exports = async function (feeds) {
  feeds = [].concat(feeds).filter(Boolean);

  if (!feeds.length) {
    return;
  }

  const payload = new FormData();
  payload.set('hub.mode', 'publish');

  feeds.forEach((feed) => payload.append('hub.url', encodeURIComponent(feed.getPublicUrl())));

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  try {
    await axios.post(PUBSUBHUBBUB_API_URL, payload, { headers });
  } catch (err) {
    console.log(err);
  }
  return feeds;
}