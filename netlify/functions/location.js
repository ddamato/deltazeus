export async function handler(event) {
  const { q } = event.queryStringParameters;
  if (!q) return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Must provide a query param' }),
  };
  const isCoords = /^-?\d+(\.\d+)?\s*\+\s*-?\d+(\.\d+)?$/.test(q);

  try {
    // Build OpenCage request
    const url = new URL('https://api.opencagedata.com/geocode/v1/json');
    url.searchParams.set('q', q);
    url.searchParams.set('key', process.env.OPENCAGE_API_KEY);
    url.searchParams.set('limit', isCoords ? 1 : 5);
    url.searchParams.set('language', 'en');

    const response = await fetch(url);
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch from API' }),
      };
    }

    const data = await response.json();

    // Flatten timezone data into the same object
    const results = data.results.map((result) => {
      const tz = result.annotations?.timezone || {};
      return {
        label: result.formatted,
        lat: result.geometry.lat.toFixed(1),
        lon: result.geometry.lng.toFixed(1),
        tzName: tz.name || null,
        tzOffset: tz.offset_sec ?? null,
        tzOffsetString: tz.offset_string || null,
        tzAbbr: tz.short_name || null,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
