# deltazeus
Most of us check to prepare for the day. If the weather never changed, we'd probably never check. But it changes nearly everyday! How do you keep up? That's where **deltzeus** comes in handy.

deltazeus.com

This system is built to be serverless, leveraging serverless.com and [AWS](https://aws.amazon.com) for maintaining the infrastructure between services. Static files are hosted on [S3](https://aws.amazon.com/s3/) while API endpoints are done with [Lambda](https://aws.amazon.com/lambda/) functions.

## Getting the weather
This uses the [Dark Sky daily forecast API](https://darksky.net/dev/docs#time-machine-request) to retrieve the weather conditions by latitude and longitude.

### Coordinates
After receiving coordinates, they are reduced to 1 signifigant digit. [The first decimal place is worth up to 11.1 km](https://gis.stackexchange.com/a/8674/50516): it can distinguish the position of one large city from a neighboring large city. We can assume the weather differences are not signifigant the more specific the location.

From here, the system passes around a `Coords` instance which has a `.toString()` method. The method will concatenate the coordinates with an underscore character (`_`) for use as a primary identifier in the system.

### Reducing API calls
Every time someone asks for a feed link, we need to ensure we have weather on file for that location. If we have it, we can quickly return the feed link. If not, then we get the weather from the Dark Sky API. This is so we call the third-party API the minimum number of times to be under the [rate limit](https://darksky.net/dev/docs/faq#cost).

## Ensuring feeds are active
The feed link provided is actually a proxy to the API which records each time someone or something requests the feed. Each time it is requested, a related entry is incremented in the database and the system responds with a redirect to the actual feed file (ending in `.xml`). If the feed isn't being checked regularly, we drop the service of that feed in the next update cycle.

Third-party feed subscription services (e.g: [Feedly](https://feedly.com/), [IFTTT](https://ifttt.com/)) will check this periodically so once the user enters the proxy link, the feed should remain active until the unsubscribe to it.

## Updating the feeds
The feeds are updated with a [cron job](https://code.tutsplus.com/tutorials/scheduling-tasks-with-cron-jobs--net-8800), managed by [Github Actions](https://github.com/features/actions) which just hits an API endpoint every hour. The function at the end of the cron job is checking for entries in the database by timezone and determining if it is 5:00 AM in that current location. If it is, we do some work to update the feed.

- Save the weather for this location in memory.
- Filter out all the weather records that have not been requested.
- Get updated weather and store it where yesterday's weather was.
- Compare the differences.
- Update the RSS feeds.

Weather that was filtered out is removed from the database entirely so it is not queried again (as it is deemed inactive). However, the feed file for the location still exists. This allows the system to keep a record of activity for that location.
