import Airtable from 'airtable';
import Coords from './coords.js';
const tables = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_TABLE_BASE);

export const tableNames = {
  DZ_TODAY: 'dz_today',
  DZ_DELTA: 'dz_delta',
  DZ_THRESHOLD: 'dz_threshold',
}

function parseRecords(records) {
  return records.map(({id, fields}) => ({ id, ...fields }));
}

export function asFields(fields) {
  return { fields };
}

export async function postForecast(forecast) {
  const { latitude, longitude } = forecast;
  const coords = new Coords(latitude, longitude);
  const record = { coords: coords.toString(), requests: 1, ...forecast };
  return postRecords(tableNames.DZ_TODAY, asFields(record));
}

export async function postRecords(table, data) {
  const records = await tables(table).create(data);
  return parseRecords(records);
}

export async function getRecords(table, filter) {
  if (filter) {
    filter = { filterByFormula: filter };
  }
  const response = tables(table).select(filter);
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