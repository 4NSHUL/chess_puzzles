# Chess Puzzle Reels

A mobile-first Next.js chess puzzle solving app with a vertical reels-style feed.

## Local development

```bash
npm install
npm run dev -- --port 5174
```

Open `http://localhost:5174`.

## Tests

```bash
npm test
```

## Vercel deployment

Use the repository root as the Vercel project root.

- Build command: `npm run build`
- Output directory: leave Vercel's Next.js default
- Install command: `npm install`

Vercel detects Next.js automatically from `next` in `package.json`.
