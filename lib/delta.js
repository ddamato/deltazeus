const { properties, createResult, createChange } = require('./properties.js');
const Records = require('./records.js');
const { DYNAMO_TABLENAMES } = require('./aws.js');

module.exports = class Delta {
  constructor(previous, incoming) {
    if (previous.coords !== incoming.coords) {
      throw new Error('coords do not match in Delta instance');
    }

    this.previous = previous;
    this.incoming = incoming;
  }

  fields() {
    return this.previous;
  }

  async get() {
    let thresholds = await new Records(this.previous, DYNAMO_TABLENAMES.DZ_THRESHOLDS).get();
    if (!thresholds) {
      thresholds = await new Records({ coords: 'default' }, DYNAMO_TABLENAMES.DZ_THRESHOLDS).get();
    }

    return Object.keys(properties).reduce((acc, prop) => {
      const previous = Number(this.previous[prop]);
      const current = Number(this.incoming[prop]);

      if (Math.abs(Number(previous) - Number(current)) > thresholds[prop]) {
        acc[prop] = { previous, current }
      }

      return acc;
    }, {})
  }

  async changes(joiner) {
    const changes = await this.get();
    const desc = Object.keys(changes).map((prop) => {
      const { abbr } = properties[prop];
      const { previous, current } = changes[prop];

      const currentAmount = createResult(current, prop);
      const changed = createDirection(previous, current);
      const difference = createChange(previous, current, prop);

      return `◈ ${abbr}: ${currentAmount}, ${changed}${difference} `;
    });

    if (typeof joiner === 'string') {
      return desc.join(joiner);
    }
    return desc;
  }
}

function createDirection(previous, current) {
  const delta = Number(previous) - Number(current);
  return Boolean(~(delta / Math.abs(delta))) ? '▲' : '▼';
}
