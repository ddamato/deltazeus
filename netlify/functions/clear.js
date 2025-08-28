import { getStore } from '@netlify/blobs';

export default async function () {
    const store = getStore('feeds');
    
    const { blobs } = await store.list();
    for (const blob of blobs) {
        await store.delete(blob.key);
    }

    return new Response(`${blobs.length} blobs cleared`, {
      status: 200,
    });
}
