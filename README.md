# Yearbook Hero

An early interactive prototype of the volunteer-facing capture app described in the **St. Louis Homeroom Archive** proposal — built to make the concept tangible for proposal reviewers, not as production software.

> **Demo only — not private, not production.** This link has no authentication and nothing uploaded is encrypted or access-controlled. Don't capture real names, personal information, or anything sensitive while testing. See `DEMO-OVERVIEW.md` in the main proposal repo for the full capability disclaimer.

## What's implemented

- Claiming a yearbook from a missing-yearbooks registry
- Live in-browser camera capture (`getUserMedia`) with an on-screen alignment guide
- Rescanning a page mid-session, or recapturing specific pages after review
- Real multi-page PDF generation from captured pages, downloadable on both desktop and mobile
- Local-only persistence (browser storage) so progress survives a page refresh

## What's intentionally simplified

- **No real edge detection** — pages are center-cropped to a fixed aspect ratio as a stand-in for genuine computer-vision page-boundary detection (the kind Apple's Notes app does when scanning a document).
- **No backend** — everything lives in this browser only; no cloud storage, security scanning, or custody transfer, all of which are part of the real proposal's design.
- **No multi-user sync** — the registry is local to whichever device/browser it's running on.
- **No OCR, search, or per-name lookup** — deferred in the main proposal's scope as well.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/87f16cd3-1caf-4712-b54c-4bd73a23a898).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
