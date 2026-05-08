# Chess Puzzle Reels

A mobile-first Next.js chess puzzle solving app with a vertical reels-style feed.

## Features

- Per-puzzle solving timer
- Hardness-level, theme, and rating filters
- Focus-style generated sound loop and puzzle feedback cues
- Browser tab icon for deployed URLs
- Basic local login backed by browser IndexedDB
- Solved puzzles are hidden for the logged-in profile

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

This app pins Next.js and Node.js versions so Vercel builds stay deterministic.

## Puzzle dataset

`src/data/puzzles.json` is generated from the Lichess puzzle database with:

```bash
curl -L https://database.lichess.org/lichess_db_puzzle.csv.zst \
  | zstd -dc \
  | CHESS_JS_MODULE=chess.js node scripts/build-puzzle-dataset.mjs \
  > src/data/puzzles.json
```
