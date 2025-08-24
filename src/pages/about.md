---
layout: '@layouts/Page.astro'
---

## What is deltazeus?

Most of us check to prepare for the day. If the weather never changed, we'd probably never check. But it changes nearly everyday! How do you keep up? That's where **deltazeus** comes in handy.

Traditional weather apps require you to actively go to your weather app, look at the current data, and try to make a determination about what each data point means. Instead, **deltazeus** will provide a link to an RSS feed for weather updates in your area. The feed will only update if the changes are significant.

## What is RSS?

The acronym Really Simple Syndication describes a file format used for providing users with frequently updated content. Content distributors syndicate an RSS feed, thereby allowing users to subscribe a channel for content. For example, most blogs are powered by RSS behind the scenes. You could subscribe to updates via their RSS feed rather than visiting the site and checking for updates.

There are different services that help subscribe to RSS feeds. Personally, I like to use [feedly](https://feedly.com) for news but for **deltazeus**, I'll recommend hooking up your RSS feed to a service like [Zapier](https://zapier.com/) as it will allow for email or push notifications for each new feed item.

## History

This project first debuted in 2015 as a way for me to learn how to create a full stack application. Originally, the backend was created with PHP and MySQL, along with other server-side technologies like cronjobs.

In 2020, the stack was updated to use serverless.com through an AWS configuration. This allowed the majority of the backend to be written in JavaScript.

In 2025, the stack was updated again to rely on Netlify's infrastructure instead of getting lost within AWS configurations and cryptic system warnings.