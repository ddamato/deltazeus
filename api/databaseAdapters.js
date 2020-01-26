import Airtable from 'airtable';
import { concatCoords, fixedCoords } from './utils.js';
const tables = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_TABLE_BASE);

async function parseAirtable(records) {
  return records.map(({fields}) => fields);
}

export async function getToday({ latitude, longitude }) {
  const coords = fixedCoords(latitude, longitude);
  const response = await tables('dz_today').select({
    filterByFormula: `IF({concat}="${concatCoords(coords)}",1,0)`,
  });
  const records = await response.all();
  return parseAirtable(records);
}

export async function postToday(forecast) {
  const { latitude, longitude } = forecast;
  const coords = fixedCoords(latitude, longitude);
  const fields = { concat: concatCoords(coords), ...forecast };
  const records = await tables('dz_today').create([{ fields }]);
  return parseAirtable(records);
}