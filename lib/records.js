import dynaql from 'dynaql';
import awsConfig, { DYNAMO_TABLENAMES } from './aws.js';
const db = dynaql(awsConfig);

export default class Records {
  constructor(fields, table) {
    this.table = table || DYNAMO_TABLENAMES.DZ_TODAY;
    this.fields = fields;
    if (this.fields.coords) {
      this.fields.coords = `${this.fields.coords}`;
    }
  }

  async get() {
    const { coords } = this.fields;
    const { result } = await db.get(this.table, { coords });
    return result;
  }

  async post() {
    const { result } = await db.update(this.table, this.fields);
    return result;
  }

  async delete() {
    await db.delete(this.table, { coords });
  }

  async increment() {
    const record = await this.get();
    this.fields.requests = Number(record && record.requests) + 1;
    return this.post();
  }

  async reset() {
    this.fields.requests = 0;
    return this.post();
  }
}