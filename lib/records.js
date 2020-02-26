const Sparkplug = require('sparkplug');
const { awsConfig, DYNAMO_TABLENAMES } = require('./aws.js');
const spark = new Sparkplug(awsConfig);

module.exports = class Records {
  constructor(fields, table) {
    this.db = spark.table(table || DYNAMO_TABLENAMES.DZ_TODAY);
    this.fields = fields || {};
    if (this.fields.coords) {
      this.fields.coords = `${this.fields.coords}`;
    }
  }

  fields() {
    return this.fields;
  }

  async get() {
    const { coords } = this.fields;
    const { data } = await this.db.get({ coords });
    this.fields = data;
    return data;
  }

  async filter(value) {
    const { data } = await this.db.query(value).exec();
    return data
  }

  async all() {
    const { data } = await this.db.scan().strongRead().exec();
    return data;
  }

  async post() {
    await this.db.put(this.fields);
    return this.fields;
  }

  async delete() {
    const { coords } = this.fields;
    await this.db.delete({ coords });
  }

  async increment() {
    const record = await this.get();
    if (record) {
      this.fields.requests = Number(record.requests) + 1;
      return await this.post();
    }
  }

  async reset() {
    this.fields.requests = 0;
    return this.post();
  }
}