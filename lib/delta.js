const properties = require('./properties.js');
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
      const previous = this.previous[prop];
      const current = this.incoming[prop];

      const delta = Number(previous) - Number(current);
      const abs = Math.abs(delta);
      const isIncreased = Boolean(~(delta / abs));
      if (abs > thresholds[prop]) {
        acc[prop] = {
          delta,
          previous,
          current,
          isIncreased,
        }
      }

      return acc;
    }, {})
  }

  async descriptions(joiner) {
    const changes = await this.get();
    const desc = Object.keys(changes).map((prop) => {
      const { abbr, units, convert } = properties[prop];
      const { delta, current, isIncreased } = changes[prop];
      const changed = isIncreased ? '▲' : '▼';

      const difference = createResponse(delta, units, convert);
      const currentAmount = createResponse(current, units, convert);

      return `◈ ${abbr}: ${currentAmount}, ${changed}${difference} `;
    });

    if (typeof joiner === 'string') {
      return desc.join(joiner);
    }
    return desc;
  }
}

function createResponse(value, units, convert) {
  const converted = convert ? ` (${convert(value)})` : '';
  return `${units(value)}${converted}`;
}