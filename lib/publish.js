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

  // node FormData doesn't support arrays and must be turned into a string
  const urls = feeds.map((feed) => encodeURIComponent(feed.getPublicUrl()));
  payload.append('hub.url', JSON.stringify(urls));

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  try {
    await axios.post(PUBSUBHUBBUB_API_URL, payload, { headers });
  } catch (err) {
    console.log(err);
  }
  return feeds;
}