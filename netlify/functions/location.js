/**
 * Handles querying with a location,
 * returns lat, lon, tzOffset as array of results
 *
 * @param {Request} req - Fetch API Request
 * @returns {Response}
 */
export default async function (req) {
  const urlObj = new URL(req.url);
  const q = urlObj.searchParams.get("q");

  if (!q) {
    return new Response(
      JSON.stringify({ error: "Must provide a query param" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const isCoords = /^-?\d+(\.\d+)?\s*\+\s*-?\d+(\.\d+)?$/.test(q);

  try {
    // Build OpenCage request
    const apiUrl = new URL("https://api.opencagedata.com/geocode/v1/json");
    apiUrl.searchParams.set("q", q);
    apiUrl.searchParams.set("key", process.env.OPENCAGE_API_KEY);
    apiUrl.searchParams.set("limit", isCoords ? 1 : 5);
    apiUrl.searchParams.set("language", "en");

    const response = await fetch(apiUrl);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch from API" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    // Flatten timezone data into the same object
    const results = data.results.map((result) => {
      const tz = result.annotations?.timezone || {};
      return {
        label: result.formatted,
        lat: Number(result.geometry.lat.toFixed(1)),
        lon: Number(result.geometry.lng.toFixed(1)),
        tzName: tz.name || null,
        tzOffset: tz.offset_sec ?? null,
        tzOffsetString: tz.offset_string || null,
        tzAbbr: tz.short_name || null,
      };
    });

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
