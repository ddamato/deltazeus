import { getStore } from '@netlify/blobs';
import { PAUSED, pausedResponse } from './_paused.js';

// temp function while debugging
export default async function () {
    if (PAUSED) return pausedResponse();
    const store = getStore('feeds');
    
    const { blobs } = await store.list();
    for (const blob of blobs) {
        await store.delete(blob.key);
    }

    return new Response(`${blobs.length} blobs cleared`, {
      status: 200,
    });
}
