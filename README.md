# deltazeus

## API

- `/api/location`, allows a user to enter a `q` param and returns an array of results which include a `lat`, `lon`, and `tzOffset`. After selected, this data is used to create or reference an existing `.xml` feed.
- `/feeds`, a POST with the aforementioned data will either create or reference an existing feed, finally redirecting to the feed URL which should be subscribed in some service such as [IFTTT](https://ifttt.com/), [Zapier](https://zapier.com/), or any [RSS reader](https://en.wikipedia.org/wiki/Comparison_of_feed_aggregators).
- `/feeds/<feedId>`, a GET to an existing feed will show the `.xml` file of the feed at the `<feedId>` composed as `lat_lon` with a single decimal place of precision for each.

## Cron

On an hourly basis, the cron will:
- Get a reference to all feeds where the location would be 5am.
- If the feed has not been requested in 5 days, it is deleted.
- If it is still active:
  - We query yesterday and today's weather for that location.
  - We compare Average Temperature, Maximum Wind Speed, Total Precipitation, Average Humidity, and UV Index between the days.
  - If any of the differences are "significant" (determined by a lookup), entries are written into the related feeds.
  
## Track

In order to keep track of active feeds, helper functions are provided from `track.js`
- `create(tzOffset, feedId)` is used on the `/feeds` POST request if the feed doesn't yet exist.
- `update(feedId)` is used on each `/feeds/<feedId>` request.
- `get(tzOffset)` returns all of the feeds that match the given timezone offset. This is used for the cron.
- `remove(feedId)` removes the feed from tracking. Occurs during the cron when determining which feeds are active.

## FeedXml

The `FeedXml` constructor exported from `xml.js` handles all xml-related needs. When instantiated, storage is called which is why the call expects an `await`.

```js
// Throws if the feed doesn't exist.
const feed = await new FeedXml(feedId);
```

Importantly, there's two arguments here. The second argument is a flag that determines if we expect to create a feed if it doesn't exist. This is important since hitting the `/feeds/<feedId>` also instantiates a `new FeedXml` and _could_ create a new file even if it wasn't meant to exist.

```js
// Create the feed if it doesn't exist.
const feed = await new FeedXml(feedId, true)
```

The main methods used on the instance are:
- `feed.xml` returns the XML string, used for responses.
- `feed.addItem(item)` adds the item to the feed. This also writes the updated `feed.xml` into storage.
- 