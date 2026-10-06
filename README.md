# Yearbook Hero

Build a mobile-first web app (React, Vite, Tailwind, shadcn/ui) called "St. Louis Homeroom Archive" for a yearbook-scanning volunteer flow. No backend needed yet — use mock/local state, persisted to localStorage so a page refresh doesn't lose progress.

Primary color: a deep racing green; clean sans-serif typography.

Screens:

Home/Start — app name, short one-line mission, big "Start Scanning" button.

Missing Yearbooks Registry — a list/grid of yearbooks (mock data: school name, year, status badge: Unclaimed / In Progress / Done). Tapping an unclaimed one claims it and navigates to the scan screen.

Scan Screen — shows claimed yearbook's title, a live page counter ("Page 12"), a large camera-capture button. Since there's no backend yet, each tap should add a placeholder page image (a simple generated canvas image with the page number rendered on it is fine) to a thumbnail strip at the bottom and increment the counter. Include a "Rescan last page" button (removes/replaces the last thumbnail) and a "Finish Book" button.

Completion Screen — confirms the book is done, shows total pages captured, and includes a real "Download PDF" button that uses a client-side library (jsPDF or pdf-lib) to actually compile all the captured placeholder page images into a single multi-page PDF and download it. This is the one piece that should genuinely work, not just be mocked — the goal is to visually prove that a stack of captured page images becomes one real downloadable PDF. Also include a "Scan Another" button back to the registry.

Keep the visual style clean and modern — this is for teenage student volunteers scanning in a school gym, so it should feel approachable, fast, and a little bit fun (progress/gamification touches welcome, e.g. a subtle page counter animation).

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
