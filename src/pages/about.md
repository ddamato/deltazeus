---
layout: '@layouts/Page.astro'
---

## What is deltazeus?

Most of us check to prepare for the day. If the weather never changed, we'd probably never check. But it changes nearly everyday! How do you keep up? That's where **deltazeus** comes in handy.

**deltazeus** makes weather effortless. Instead of checking forecasts every day, it only notifies you when today's weather feels significantly different from yesterday at your location. If nothing changes, you hear nothing. And with RSS, you choose how to get alerts—through text, email, or even your smart home.

## What is RSS?

The acronym Really Simple Syndication describes a file format used for providing users with frequently updated content. Content distributors syndicate an RSS feed, thereby allowing users to subscribe a channel for content. For example, most blogs are powered by RSS behind the scenes. You could subscribe to updates via their RSS feed rather than visiting the site and checking for updates.

There are different services that help subscribe to RSS feeds. Personally, I like to use [feedly](https://feedly.com) for news but for **deltazeus**, I'll recommend hooking up your RSS feed to a service like [Zapier](https://zapier.com/) as it will allow for email or push notifications for each new feed item.

## Location Precision

The latitude and longitude for each feed is saved at a level of precision that represents an area of roughly 111km/70mi, or about the size of the country of Switzerland located in Europe. Weather isn't often so different within a region of this size. This also reduces the calls needed to fetch weather for shared locations.

## History

This project first debuted in 2015 as a way for me to learn how to create a full stack application. Originally, the backend was created with PHP and MySQL, along with other server-side technologies like cronjobs.

In 2020, the stack was updated to use serverless.com through an AWS configuration. This allowed the majority of the backend to be written in JavaScript.

In 2025, the stack was updated again to rely on Netlify's infrastructure instead of getting lost within AWS configurations and cryptic system warnings. This system now uses [Open Meteo](https://open-meteo.com/) for weather data, [Open Cage](https://opencagedata.com/) for location data, and [Netlify](https://netlify.com) for hosting.

Created by [Donnie D'Amato](https://donnie.damato.design)