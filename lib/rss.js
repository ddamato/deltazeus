const S3 = require('tiny-s3');
const convert = require('xml-js');
const { awsConfig } = require('./aws.js');
awsConfig.endpoint = `s3.${awsConfig.region}.amazonaws.com`;

const s3 = new S3(awsConfig);

const RSS_FILE_LOCATION = 'deltazeus/rss';
const GENERAL_RSS_DESCRIPTION = 'The difference in weather between the posted date and the day before, updated when signifigant.';

module.exports = class Rss {
  constructor(coords) {
    this.coords = coords;
  }

  _bootstrap(xml) {
    const rssJs = convert.xml2js(xml, { compact: true });
    const content = 'No updates yet. Please be sure to subscribe to this feed.';
    rssJs.rss.channel = {
      'atom:link': this._getAtomLink(),
      language: 'en-us',
      ...this._getRequiredTags(),
      item: this._getRequiredTags({ content }),
    }

    return rssJs;
  }
  
  _getAtomLink() {
    return [{
      _attributes: {
        rel: 'self',
        type: 'application/rss+xml',
        href: this.getPublicUrl(),
      }
    }, {
      _attributes: {
        rel: 'hub',
        href: 'http://pubsubhubbub.appspot.com',
      }
    }, {
      _attributes: {
        rel: 'hub',
        href: 'http://pubsubhubbub.superfeedr.com/',
      }
    }]
  }

  _getGuid() {
    const guid = parseInt(new Date().getTime() * Math.random());
    return {
      _attributes: { isPermaLink: false },
      ...asText(guid),
    }
  }

  _getRequiredTags(options) {
    let { title, description, content } = options || {};
    title = title || `deltazeus weather for ${this.coords.latitude}, ${this.coords.longitude}`;
    description = description || GENERAL_RSS_DESCRIPTION;
    const link = this.getPublicUrl();
  
    const entry = {
      title: asText(title),
      link: asText(link),
      description: asText(description),
    };

    if (content) {
      entry.description = asText(content);
      entry['content:encoded'] = asText(content);
      entry.pubDate = asText(new Date().toUTCString());
      entry.guid = this._getGuid();
    }

    return entry;
  }

  _set(xml) {
    if (typeof xml === 'string') {
      this.rssJs = convert.xml2js(xml, { compact: true });
    }
  }

  append(content, title) {
    const entry = this._getRequiredTags({ content, title });
    this.rssJs.rss.channel.item = [].concat(this.rssJs.rss.channel.item, entry).filter(Boolean);
    return this;
  }

  get() {
    return this.rssJs;
  }

  getPublicUrl() {
    return `https://rss.deltazeus.com/${this.coords}`;
  }

  async exists() {
    if (!this.get()) {
      try {
        const { Body } = await s3.get(`${this.coords}.xml`, RSS_FILE_LOCATION);
        this._set(Body.toString());
      } catch (err) {
        return false;
      }
    }
    return !!this.get();
  }

  async init() {
    await this.prepare();
    await this.update();
  }

  async prepare() {
    const exists = await this.exists();
    if (!exists) {
      await this.reset();
    }
    return this;
  }

  async reset() {
    const { Body } = await s3.get(`template.xml`, RSS_FILE_LOCATION);
    this.rssJs = this._bootstrap(Body.toString());
    return this;
  }

  async update() {
    const contents = convert.js2xml(this.rssJs, { compact: true });
    // tiny-s3 doesn't expose the additional keys
    await s3.client.putObjectFxd({
      Key: `${this.coords}.xml`,
      Body: Buffer.from(`${contents}`),
      Bucket: RSS_FILE_LOCATION,
      ContentType: 'text/xml; charset=utf-8',
      ACL: 'public-read',
    });
    return this;
  }

  async delete() {
    await s3.delete(`${this.coords}.xml`, RSS_FILE_LOCATION);
  }
}

function asText(text) {
  return { _text: text };
}