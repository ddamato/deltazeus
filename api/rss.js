import path from 'path';
import fs from 'fs-extra';
import convert from 'xml-js';

const GENERAL_RSS_DESCRIPTION = 'The difference in weather between the posted date and the day before, updated when signifigant.';

export async function feedContents(coords, content) {
  const filePath = getPath(coords);
  if (!fs.existsSync(filePath)) {
    bootstrapFeed(coords);
  }

  if (content) {
    const xml = fs.readFileSync(filePath, 'utf8');
    const rssJs = convert.xml2js(xml, { compact: true });
    const entry = prepareItem(coords, content);
    rssJs.rss.channel.item = [].concat(rssJs.rss.channel.item, entry).filter(Boolean);
    writeXML(filePath, rssJs);
  }
  
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

function getPath(coords) {
  return path.resolve(__dirname, '..', 'web', 'rss', `${coords}.xml`);
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
  const rssJs = {
    _declaration: { _attributes: { version: '1.0' } },
    _instruction: { 'xml-stylesheet': 'type="text/css" href="style.css"' },
    rss: getRss(coords),
  };
  writeXML(getPath(coords), rssJs);
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

function writeXML(path, rssJs) {
  const contents = convert.js2xml(rssJs, { compact: true });
  fs.ensureFileSync(path);
  fs.writeFileSync(path, contents);
}