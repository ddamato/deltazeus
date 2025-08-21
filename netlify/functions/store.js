import { getStore } from '@netlify/blobs';

const devStore = new Map();

export function useStore() {
    if (process.env.NETLIFY_DEV) {
        return devStore;
    } else {
        return getStore('feeds');
    }
}
