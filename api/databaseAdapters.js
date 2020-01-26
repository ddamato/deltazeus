import Airtable from 'airtable';
import { concatCoords, fixedCoords } from './utils.js';
const tables = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_TABLE_BASE);

export async function getToday({ latitude, longitude }) {
  const coords = fixedCoords(latitude, longitude);
  const { records } = await tables('dz_today').select({
    filterByFormula: `{concat} = ${concatCoords(coords)}`
  });
  return records;
}

export async function postToday(forecast) {
  const coords = fixedCoords(latitude, longitude);
  const fields = { concat: concatCoords(coords), ...forecast };
  const { records } = await tables('dz_today').create([{ fields }]);
  return records;
}