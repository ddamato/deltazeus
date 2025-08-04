export async function handler(event) {
  const feedId = event.pathParameters?.feedId;
  if (!feedId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Feed ID required' }),
    };
  }

  switch (event.httpMethod) {
    case 'GET':
      return handleGet(feedId);

    case 'PUT':
      return handlePut(feedId, body);

    case 'DELETE':
      return handleDelete(feedId);

    default:
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
  }
}

async function handleGet(feedId) {
  if (!feedId) {
    return { statusCode: 400, body: 'Feed ID required in path' };
  }
  const feedXml = await get(`feeds/${feedId}.xml`);
  if (!feedXml) {
    return { statusCode: 404, body: 'Feed not found' };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/rss+xml' },
    body: feedXml,
  };
}

async function handlePut(feedId, body) {
  if (!feedId) {
    return { statusCode: 400, body: 'Feed ID required in path' };
  }
  if (!body) {
    return { statusCode: 400, body: 'Request body required' };
  }

  // Example: Also update lastUpdated inside XML metadata
  const feedXml = await get(`feeds/${feedId}.xml`);
  if (!feedXml) {
    return { statusCode: 404, body: 'Feed XML not found' };
  }

  // Parse XML to JS object
  const feedObj = await parseStringPromise(feedXml);

  // Ensure custom namespace & metadata path exist
  feedObj.rss = feedObj.rss || {};
  feedObj.rss.channel = feedObj.rss.channel || [{}];
  const channel = feedObj.rss.channel[0];

  // Assume your custom metadata is inside a custom:metadata tag in the 'custom' namespace
  // Here 'custom' prefix might appear as 'custom:metadata' key or with explicit namespaces depending on feed XML
  // To keep it simple, let's define/update a custom metadata object under channel['custom:metadata']
  channel['custom:metadata'] = channel['custom:metadata'] || [{}];
  const customMeta = channel['custom:metadata'][0];

  // Update the lastUpdated field in metadata
  customMeta['custom:lastUpdated'] = [metadata.lastUpdated || new Date().toISOString()];

  // Build XML back from JS object
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true },
    // Add namespaces if needed, example:
    // rootName: 'rss',
  });
  const updatedXml = builder.buildObject(feedObj);

  // Save updated XML feed
  await set(`feeds/${feedId}.xml`, updatedXml, { contentType: 'application/rss+xml' });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Feed XML updated' }),
  };
}

async function handleDelete(feedId) {
  if (!feedId) {
    return { statusCode: 400, body: 'Feed ID required in path' };
  }
  await remove(`feeds/${feedId}.xml`);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Feed deleted' }),
  };
}

