// This file should be auto-gen from /api

module.exports.handler = ({ queryStringParameters }, context, callback) => {
  const message = queryStringParameters;

  const response = {
    statusCode: 200,
    body: message,
    headers: {
      'Content-Type': 'text/html'
    }
  }

  callback(null, response)
}