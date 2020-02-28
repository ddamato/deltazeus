const allowedOrigins = [
  'https://deltazeus.com',
  'https://www.deltazeus.com',
  'https://deltazeus.s3.amazonaws.com',
  'http://deltazeus.s3-website-us-east-1.amazonaws.com',
  'http://localhost:[0-9]*'
];

module.exports = function(event) {
  let allowedOrigin = allowedOrigins[0];

  if (event.headers) {
    const origin = event.headers.Origin || event.headers.origin;
    const isAllowed = origin && allowedOrigins.some((allowed) => origin.match(new RegExp(allowed)));
  
    allowedOrigin = isAllowed ? origin : allowedOrigins[0];
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': true,
  };
}
