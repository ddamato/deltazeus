import properties from './properties.js';

export default function computeDeltas(previousRecords, incomingRecords, thresholds) {
  return previousRecords.reduce((acc, previous) => {
    const incoming = incomingRecords.find(({coords}) => coords === previous.coords);
    let threshold = thresholds.find(({coords}) => coords === previous.coords);
    if (!threshold) {
      threshold = thresholds.find(({coords}) => coords === 'default') || thresholds[0];
    }
    const deltas = traverseProperties(previous, incoming, threshold);
    if (Object.keys(deltas).length) {
      acc[previous.coords] = deltas;
    }
    return acc;
  }, {});
}

function traverseProperties(previous, incoming, threshold) {
  return Object.keys(properties).reduce((acc, prop) => {
    const delta = Number(previous[prop]) - Number(incoming[prop]);
    const abs = Math.abs(delta);
    const isIncreased = Boolean(~(delta / abs));
    if (abs > threshold[prop]) {
      acc[prop] = {
        previous: previous[prop],
        current: incoming[prop],
        isIncreased,
      }
    }
    return acc;
  }, {});
}