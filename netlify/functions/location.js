export async function handler(event) {
  const { q, lat, lon } = event.queryStringParameters;

  // Decide whether it's freeform text or lat/lon
  let query;
  if (q) {
    query = q;
  } else if (lat && lon) {
    query = `${lat}+${lon}`;
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Provide either ?q=<place> or ?lat=<lat>&lon=<lon>' }),
    };
  }

  try {
    // Build OpenCage request
    const url = new URL('https://api.opencagedata.com/geocode/v1/json');
    url.searchParams.set('q', query);
    url.searchParams.set('key', process.env.OPENCAGE_API_KEY);
    url.searchParams.set('limit', q ? 5 : 1);
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
        lat: result.geometry.lat,
        lon: result.geometry.lng,
        tzName: tz.name || null,
        tzOffset: tz.offset_sec ?? null,
        tzOffsetString: tz.offset_string || null,
        tzAbbr: tz.short_name || null,
      };
    });

    // For reverse geocoding (lat/lon): return a single object
    if (lat && lon) {
      return {
        statusCode: 200,
        body: JSON.stringify(results[0] || {}),
      };
    }

    // For freeform input: return multiple suggestions
    return {
      statusCode: 200,
      body: JSON.stringify({ suggestions: results }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
