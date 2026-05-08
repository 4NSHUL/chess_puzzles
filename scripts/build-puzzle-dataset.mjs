import { createInterface } from "node:readline";
import { stdin, stdout, stderr } from "node:process";

const chessModulePath = process.env.CHESS_JS_MODULE || "chess.js";
const { Chess } = await import(chessModulePath);

const targetCount = Number(process.env.PUZZLE_TARGET_COUNT || 1600);
const minRating = Number(process.env.PUZZLE_MIN_RATING || 850);
const maxDeviation = Number(process.env.PUZZLE_MAX_DEVIATION || 100);
const minPopularity = Number(process.env.PUZZLE_MIN_POPULARITY || 80);
const minPlays = Number(process.env.PUZZLE_MIN_PLAYS || 100);

const puzzles = [];
let lineNumber = 0;

const rl = createInterface({
  input: stdin,
  crlfDelay: Infinity
});

for await (const line of rl) {
  lineNumber += 1;

  if (lineNumber === 1 || !line.trim()) {
    continue;
  }

  const [
    puzzleId,
    fen,
    moves,
    ratingValue,
    ratingDeviationValue,
    popularityValue,
    playsValue,
    themesValue,
    gameUrl,
    openingTagsValue = ""
  ] = line.split(",");

  const rating = Number(ratingValue);
  const ratingDeviation = Number(ratingDeviationValue);
  const popularity = Number(popularityValue);
  const plays = Number(playsValue);
  const moveList = moves.split(" ").filter(Boolean);

  if (
    !puzzleId ||
    !fen ||
    moveList.length < 2 ||
    rating < minRating ||
    ratingDeviation > maxDeviation ||
    popularity < minPopularity ||
    plays < minPlays
  ) {
    continue;
  }

  const game = new Chess(fen);
  const setupMove = applyUciMove(game, moveList[0]);

  if (!setupMove) {
    continue;
  }

  const solution = moveList.slice(1);
  const verification = new Chess(game.fen());

  if (!solution.every((move) => applyUciMove(verification, move))) {
    continue;
  }

  const themes = normalizeThemes(themesValue, openingTagsValue);

  puzzles.push({
    id: `lichess-${puzzleId}`,
    fen: game.fen(),
    sideToMove: game.turn(),
    solution,
    rating,
    difficulty: getDifficulty(rating),
    themes,
    hint: `Look for a ${themes.slice(0, 2).join(" and ")} idea.`,
    explanation: `Imported from a rated Lichess puzzle position with ${plays} recorded attempts.`,
    source: {
      name: "Lichess puzzle database",
      url: gameUrl
    }
  });

  if (puzzles.length >= targetCount) {
    break;
  }
}

if (puzzles.length < targetCount) {
  stderr.write(
    `Only selected ${puzzles.length} puzzles; target was ${targetCount}.\n`
  );
  process.exitCode = 1;
}

stdout.write(`${JSON.stringify(puzzles, null, 2)}\n`);

function applyUciMove(game, uci) {
  return game.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    ...(uci.slice(4) ? { promotion: uci.slice(4) } : {})
  });
}

function getDifficulty(rating) {
  if (rating < 1200) {
    return "Beginner";
  }

  if (rating < 1800) {
    return "Intermediate";
  }

  return "Advanced";
}

function normalizeThemes(themeText, openingTagsText) {
  const rawThemes = themeText.split(" ").filter(Boolean);
  const openingTags = openingTagsText
    .split(" ")
    .filter(Boolean)
    .map((tag) => tag.replace(/_/g, "-").toLowerCase());

  const themes = [...rawThemes, ...openingTags]
    .map((theme) => theme.replace(/_/g, "-").toLowerCase())
    .filter((theme) => theme && theme !== "short" && theme !== "long");

  return [...new Set(themes)].slice(0, 8);
}
