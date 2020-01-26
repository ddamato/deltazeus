import faunadb, { query } from 'faunadb';
import { concatCoords, fixedCoords } from './utils.js';
const db = new faunadb.Client({ secret: process.env.NETLIFY_SERVER_KEY });

export async function getToday({ latitude, longitude }) {
  const coords = fixedCoords(latitude, longitude);
  const dbRequest = query.Get(query.Match(query.Index('coords'), concatCoords(coords)));
  return await db.query(dbRequest);
}

export async function postToday(forecast) {
  const coords = fixedCoords(latitude, longitude);
  const data = { concat: concatCoords(coords), ...forecast };
  const dbRequest = query.Create(query.Collection(`dz_today`), { data });
  return await db.query(dbRequest);
}