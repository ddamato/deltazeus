import AWS from 'aws-sdk';
import axios from 'axios';
import convert from 'xml-js';

const { AWS_KEY_ID, AWS_SECRET_KEY1, AWS_SECRET_KEY2 } = process.env;

const config = {
  region: 'us-east-1',
  accessKeyId: AWS_KEY_ID,
  secretAccessKey: `${AWS_SECRET_KEY1}/${AWS_SECRET_KEY2}`,
};

AWS.config.update(config);
const s3 = new AWS.S3();

const GENERAL_RSS_DESCRIPTION = 'The difference in weather between the posted date and the day before, updated when signifigant.';

export default async function feedContents(coords, content) {
  let rssJs;
  try {
    xml = await axios.get(filePath);
    rssJs = convert.xml2js(xml, { compact: true });
  } catch (err) {
    rssJs = bootstrapFeed(coords);
  }

  if (content) {
    const entry = prepareItem(coords, content);
    rssJs.rss.channel.item = [].concat(rssJs.rss.channel.item, entry).filter(Boolean);
  }

  writeXML(coords, rssJs);
  return getRssLink(coords);
}

function getGuid() {
  const guid = parseInt(new Date().getTime() * Math.random());
  return {
    _attributes: { isPermaLink: false },
    ...asText(guid),
  }
}

function prepareItem(coords, description) {
  return {
    guid: getGuid(),
    ...getRequiredTags({ coords, description })
  };
}

function asText(text) {
  return { _text: text };
}

function getAtomLink(coords) {
  return {
    _attributes: {
      rel: 'self',
      type: 'application/rss+xml',
      href: `https://www.deltazeus.com/rss/${coords}.xml`,
    }
  }
}

function bootstrapFeed(coords) {
  return {
    _declaration: { _attributes: { version: '1.0' } },
    _instruction: { 'xml-stylesheet': 'type="text/css" href="https://www.deltazeus.com/style.rss.css"' },
    rss: getRss(coords),
  };
}

function getRss(coords) {
  return {
    _attributes: { 
      version: '2.0',
      'xmlns:atom': 'http://www.w3.org/2005/Atom'
    },
    channel: {
      'atom:link': getAtomLink(coords),
      ...getRequiredTags({ coords, description: GENERAL_RSS_DESCRIPTION }),
    }
  }
}

function getRssLink(coords) {
  return `https://www.deltazeus.com/rss/${coords}.xml`;
}

function getRequiredTags({ title, link, description, coords }) {
  if (coords && !title) {
    title = `deltazeus weather for ${coords.latitude}, ${coords.longitude}`
  }

  if (coords && !link) {
    link = getRssLink(coords);
  }

  if (typeof description === 'string') {
    description = asText(description);
  }

  return {
    title: asText(title),
    link: asText(link),
    description,
    pubDate: asText(new Date().toUTCString()),
  }
}

async function writeXML(coords, rssJs) {
  const contents = convert.js2xml(rssJs, { compact: true });
  await s3.putObject({
    Bucket: 'deltazeus',
    Key: `rss/${coords}.xml`,
    ContentType: 'application/xml',
    Body: Buffer.from(`${contents}`, 'utf8')
  }).promise();
}