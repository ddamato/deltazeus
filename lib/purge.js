const Records = require('./records.js');
const Rss = require('./rss.js');

module.exports = async function(coords) {
  try {
    await new Records(coords).delete();
    await new Rss(coords).delete();
  } catch (err) {
    console.log(err);
  }
}