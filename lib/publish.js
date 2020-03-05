const axios = require('axios');
const FormData = require('form-data');
const PUBSUBHUBBUB_API_URL = 'https://pubsubhubbub.appspot.com';

module.exports = async function (feeds) {
  feeds = [].concat(feeds).filter(Boolean);

  if (!feeds.length) {
    return;
  }

  const payload = new FormData();
  payload.append('hub.mode', 'publish');
  feeds.forEach((feed) => payload.append('hub.url', feed.getPublicUrl()));

  const headers = payload.getHeaders();
  try {
    await axios.post(PUBSUBHUBBUB_API_URL, payload, { headers });
  } catch (err) {
    console.log(err);
  }
  return feeds;
}