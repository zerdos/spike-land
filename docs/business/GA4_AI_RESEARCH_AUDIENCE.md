# GA4 AI Research Audience

This repo now emits richer GA4 blog signals for researcher-oriented content from
the edge blog API.

## What gets sent

Every blog post view still sends `blog_view`, but it now includes these custom
parameters:

- `blog_category`
- `blog_tags_csv`
- `content_cluster`
- `target_audience`
- `ai_research_fit`
- `ai_research_score`
- `matched_topics`

For posts that score as researcher-oriented, the edge API also sends a second
event:

- `blog_view_ai_research`

## Recommended GA4 setup

Create event-scoped custom dimensions for:

- `blog_category`
- `content_cluster`
- `target_audience`
- `ai_research_fit`
- `matched_topics`

Create one event-scoped custom metric for:

- `ai_research_score`

## Recommended audience

Build a GA4 audience called `AI Researchers` using either of these rules:

1. Include users who triggered `blog_view_ai_research`
2. Or include users where:
   - event name = `blog_view`
   - `target_audience` = `ai_researchers`

## Google Ads

To use this audience for remarketing or observation in Google Ads:

- link the GA4 property to Google Ads
- enable the advertising features needed for audience export
- ensure consent settings allow advertising where legally required

## Important limit

This setup identifies research intent from content consumption. It is useful for
audience building and content ROI measurement, but it is not a reliable job-title
or company-role detector by itself.
