// xml.js
import { DOMImplementation, XMLSerializer, DOMParser } from 'xmldom';

const NS = 'deltazeus';

const defaultChannel = {
  title: 'Weather Feed',
  link: 'https://example.com/feeds',
  description: 'Weather feed for Delta Zeus',
  lastBuildDate: new Date().toUTCString(),
};

export class FeedXml {
  /**
   * Constructs the FeedXml instance.
   * If inputXml is provided, parses it.
   * Otherwise, creates new empty feed, optional metadata.
   *
   * @param {string|null} inputXml
   * @param {Object} metadata
   */
  constructor(inputXml = null, metadata = {}) {
    if (inputXml) {
      // Load from existing XML string
      const parser = new DOMParser();
      this.doc = parser.parseFromString(inputXml, 'application/xml');
      this.channel = this.doc.getElementsByTagName('channel')[0];
      if (!this.channel) throw new Error('Malformed feed XML: missing <channel>');
    } else {
      // Create new document with metadata
      const impl = new DOMImplementation();
      this.doc = impl.createDocument(null, 'rss', null);
      const rss = this.doc.documentElement;
      rss.setAttribute('version', '2.0');

      const baseURL = new URL(process.env.URL);
      const nsUri = new URL(NS, baseURL).toString();
      rss.setAttribute(`xmlns:${NS}`, nsUri);

      this.channel = this.doc.createElement('channel');
      rss.appendChild(this.channel);

      // Add default channel elements
      Object.entries(defaultChannel).forEach(([key, value]) => {
        const el = this.doc.createElement(key);
        el.appendChild(this.doc.createTextNode(value));
        this.channel.appendChild(el);
      });

      // Add metadata as namespaced elements
      Object.entries(metadata).forEach(([key, value]) => {
        const nsEl = this.doc.createElement(`${NS}:${key}`);
        nsEl.appendChild(this.doc.createTextNode(String(value)));
        this.channel.appendChild(nsEl);
      });
    }
  }

  createTextElement(tag, text) {
    const el = this.doc.createElement(tag);
    el.appendChild(this.doc.createTextNode(text));
    return el;
  }

  addItem(item) {
    const $item = this.doc.createElement('item');
    Object.entries(item).forEach(([key, value]) => {
      const el = this.createTextElement(key, value);
      $item.appendChild(el);
    });
    this.channel.appendChild($item);
  }

  addItems(items) {
    [].concat(items).forEach(item => this.addItem(item));
  }

  get xml() {
    const serializer = new XMLSerializer();
    let xml = serializer.serializeToString(this.doc);

    if (!xml.startsWith('<?xml')) {
      const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
      const stylesheetPI = '<?xml-stylesheet type="text/css" href="/feed.css"?>';
      xml = [xmlDeclaration, stylesheetPI, xml].join('\n');
    }
    return xml;
  }
}
