// This file should be auto-gen from /api

module.exports.handler = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify(event),
    headers: {
      'Content-Type': 'text/html'
    }
  }

  callback(null, response)
}