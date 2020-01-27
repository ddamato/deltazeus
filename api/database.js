import Airtable from 'airtable';
import Coords from './coords.js';
const tables = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_TABLE_BASE);

function parseRecords(records) {
  return records.map(({id, fields}) => ({ id, ...fields }));
}

export async function getToday({ latitude, longitude }) {
  const filterByFormula = `AND({latitude} = ${latitude}, {longitude} = ${longitude})`;
  const response = tables('dz_today').select({ filterByFormula });
  const records = await response.all();
  return parseRecords(records);
}

export async function postToday(forecast) {
  const { latitude, longitude } = forecast;
  const coords = new Coords(latitude, longitude);
  const fields = { coords: coords.toString(), requests: 1, ...forecast };
  return postAll('dz_today', [{ fields }]);
}

export async function postAll(table, data) {
  const records = await tables(table).create(data);
  return parseRecords(records);
}

export async function getAll(table) {
  const response = tables(table).select();
  const records = await response.all();
  return parseRecords(records);
}

export async function deleteRecords(table, records) {
  const promises = records.splice(0, 10).map(async ({ id }) => await tables(table).destroy(id));
  if (records.length) {
    return await deleteRecords(records);
  }
  return await Promise.all(promises);
}