const allowedOrigins = [
  'https://deltazeus.com',
  'https://www.deltazeus.com',
  'http://localhost:[0-9]*'
];

module.exports = function(event) {
  const origin = event.headers.Origin || event.headers.origin;
  const allowedOrigin = allowedOrigins.find((allowed) => origin.match(allowed)) || allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': true,
  };
}
