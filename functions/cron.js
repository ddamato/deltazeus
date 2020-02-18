// import hourlyCron from '../api/cron.js';

module.exports.handler = (event, context, callback) => {
  const message = 'All good';

  const response = {
    statusCode: 200,
    body: message,
    headers: {
      'Content-Type': 'text/html'
    }
  }

  callback(null, response)
}