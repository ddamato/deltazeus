// This file should be auto-gen from /api

module.exports.handler = async (event, context, callback) => {
  await sleep(() => {});
  const response = {
    statusCode: 200,
    body: JSON.stringify(process.versions),
    headers: {
      'Content-Type': 'text/html'
    }
  }

  callback(null, response)
}

async function sleep(fn) {
  await timeout(3000);
  return fn.apply(this, arguments);
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}