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
    rssJs.rss.channel = {
      'atom:link': this._getAtomLink(),
      language: 'en-us',
      ...this._getRequiredTags(),
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
  
    const rss = {
      title: asText(title),
      link: asText(link),
      description: asText(description),
      pubDate: asText(new Date().toUTCString()),
      guid: this._getGuid(),
    };

    if (content) {
      rss['content:encoded'] = asText(content);
      rss.description = asText(content);
    }

    return rss;
  }

  _set(xml) {
    this.rssJs = convert.xml2js(xml, { compact: true });
  }

  append(content, title) {
    const entry = this._getRequiredTags({ content, title });
    rssJs.rss.channel.item = [].concat(rssJs.rss.channel.item, entry).filter(Boolean);
    return this;
  }

  get() {
    return this.rssJs;
  }

  getPublicUrl() {
    return `https://rss.deltazeus.com/${this.coords}`;
  }

  async prepare() {
    try {
      const response = await s3.get(`${this.coords}.xml`, RSS_FILE_LOCATION);
      this._set(response.Body);
    } catch ({code}) {
      if (code === 'NoSuchKey') {
        this.reset();
      }
    }
    return this;
  }

  async reset() {
    const { Body } = await s3.get(`template.xml`, RSS_FILE_LOCATION);
    this.rssJs = this._bootstrap(Body);
    this.update();
    return this;
  }

  async update() {
    const contents = convert.js2xml(this.rssJs, { compact: true });
    // tiny-s3 doesn't expose the additional keys
    await s3.client.putObjectFxd({
      Key: `${this.coords}.xml`,
      Body: Buffer.from(`${contents}`),
      Bucket: RSS_FILE_LOCATION,
      ContentType: 'text/xml',
      ACL: 'public-read',
    });
    return this;
  }
}

function asText(text) {
  return { _text: text };
}