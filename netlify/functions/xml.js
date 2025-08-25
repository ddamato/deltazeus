import { getStore } from '@netlify/blobs';
import { DOMImplementation, XMLSerializer, DOMParser } from 'xmldom';

/**
 * Creates a new feed,
 * requires an await to retrieve the feed from the store.
 */
export class FeedXml {

    constructor(feedId, create) {
        this.fileName = `${feedId}.xml`;

        return (async () => {
            try {
                // Get
                const xml = await this.store.get(this.fileName, { type: 'text' });
                const parser = new DOMParser();
                this.doc = parser.parseFromString(xml, 'application/xml');
                this.channel = this.doc.getElementsByTagName('channel')[0];
                if (!this.channel) throw new Error('Malformed feed XML: missing <channel>');

            } catch (err) {

                if (!create) throw err;

                this.isNew = create;

                // Prepare for post
                const impl = new DOMImplementation();
                this.doc = impl.createDocument(null, 'rss', null);
                const rss = this.doc.documentElement;
                rss.setAttribute('version', '2.0');

                this.channel = this.doc.createElement('channel');
                rss.appendChild(this.channel);

                const coords = feedId.split('_').join(', ');

                const defaultChannel = {
                    title: 'deltazeus',
                    description: `Weather feed for ${coords}`,
                    link: `https://deltazeus.com/feeds/${feedId}`,
                    lastBuildDate: new Date().toUTCString()
                }

                // Add default channel elements
                Object.entries(defaultChannel).forEach(([key, value]) => {
                    const el = this.doc.createElement(key);
                    el.appendChild(this.doc.createTextNode(value));
                    this.channel.appendChild(el);
                });
            }

            return this;
        })();
    }

    get store() {
        return getStore('feeds');
    }

    createTextElement(tag, text) {
        const el = this.doc.createElement(tag);
        el.appendChild(this.doc.createTextNode(text));
        return el;
    }

    addItem(item) {
        if (!item || typeof item !== 'object') return;
        const $item = this.doc.createElement('item');
        Object.entries(item).forEach(([key, value]) => {
            $item.appendChild(this.createTextElement(key, value));
        });
        const $items = this.channel.getElementsByTagName('item');
        // Always insert as the first item in the list
        if (!$items.length) {
            this.channel.appendChild($item);
        } else {
            this.channel.insertBefore($item, $items[0])
        }
        return this.store.set(this.fileName, this.xml, { contentType: 'application/xml' });
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
