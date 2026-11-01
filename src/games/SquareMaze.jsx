import { useState } from 'react';

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

const FALLBACK_GRID = [
  [37, 36, 35, 34, 33, 32, 31, 64],
  [38, 17, 16, 15, 14, 13, 30, 63],
  [39, 18, 5, 4, 3, 12, 29, 62],
  [40, 19, 6, 1, 2, 11, 28, 61],
  [41, 20, 7, 8, 9, 10, 27, 60],
  [42, 21, 22, 23, 24, 25, 26, 59],
  [43, 46, 47, 50, 51, 54, 55, 58],
  [44, 45, 48, 49, 52, 53, 56, 57],
];

const CLUE_COUNT = 19;
const CELL_COUNT = 64;

function getNeighbors(index) {
  const row = Math.floor(index / 8);
  const column = index % 8;
  return [
    ...(row > 0 ? [index - 8] : []),
    ...(row < 7 ? [index + 8] : []),
    ...(column > 0 ? [index - 1] : []),
    ...(column < 7 ? [index + 1] : []),
  ];
}

const NEIGHBORS = Array.from({ length: CELL_COUNT }, (_, index) => getNeighbors(index));

function createFallbackSolution() {
  const rotation = Math.floor(Math.random() * 4);
  const reflect = Math.random() < 0.5;
  const solution = Array(CELL_COUNT);

  FALLBACK_GRID.flat().forEach((number, index) => {
    let row = Math.floor(index / 8);
    let column = index % 8;
    if (reflect) column = 7 - column;
    for (let turn = 0; turn < rotation; turn += 1) {
      [row, column] = [column, 7 - row];
    }
    solution[row * 8 + column] = number;
  });

  return solution;
}

function createRandomSolution() {
  const visited = Array(CELL_COUNT).fill(false);
  const path = [];
  let searchNodes = 0;
  const searchLimit = 50000;

  function search(current) {
    searchNodes += 1;
    if (path.length === CELL_COUNT) return true;
    if (searchNodes >= searchLimit) return false;

    const candidates = NEIGHBORS[current]
      .filter((neighbor) => !visited[neighbor])
      .map((neighbor) => ({
        index: neighbor,
        onwardMoves: NEIGHBORS[neighbor].filter((next) => !visited[next] && next !== neighbor).length,
        tieBreaker: Math.random(),
      }))
      .sort((left, right) => left.onwardMoves - right.onwardMoves || left.tieBreaker - right.tieBreaker);

    for (const candidate of candidates) {
      visited[candidate.index] = true;
      path.push(candidate.index);
      if (search(candidate.index)) return true;
      path.pop();
      visited[candidate.index] = false;
      if (searchNodes >= searchLimit) return false;
    }

    return false;
  }

  const start = Math.floor(Math.random() * CELL_COUNT);
  visited[start] = true;
  path.push(start);
  if (!search(start)) return createFallbackSolution();

  const solution = Array(CELL_COUNT);
  path.forEach((cell, index) => {
    solution[cell] = index + 1;
  });
  return solution;
}

function createClues() {
  const candidates = Array.from({ length: 62 }, (_, index) => index + 2);
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }
  return new Set([1, 64, ...candidates.slice(0, CLUE_COUNT - 2)]);
}

function createGame() {
  const solution = createRandomSolution();
  const clues = createClues();
  const values = solution.map((number) => clues.has(number) ? String(number) : '');
  return { solution, clues, values };
}

function SquareMaze({ onNavigate }) {
  const [game, setGame] = useState(createGame);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);

  function updateValue(index, value) {
    if (!/^\d{0,2}$/.test(value)) return;
    setGame((current) => ({
      ...current,
      values: current.values.map((currentValue, cellIndex) => cellIndex === index ? value : currentValue),
    }));
    setChecked(false);
    setCompleted(false);
  }

  function checkGrid() {
    const correctCount = game.values.reduce(
      (count, value, index) => count + (Number(value) === game.solution[index] ? 1 : 0),
      0,
    );
    setChecked(true);
    setCompleted(correctCount === game.solution.length);
  }

  function resetGrid() {
    setGame(createGame());
    setChecked(false);
    setCompleted(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center px-4 pb-10 pt-4">
      <a
        href={`${BASE_PATH}/`}
        onClick={(event) => onNavigate(event, `${BASE_PATH}/`)}
        className="mb-5 self-start font-semibold text-purple-800 hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
      >
        <span aria-hidden="true" className="mr-2">←</span> Alle spil
      </a>

      <header className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-pink-600 sm:text-3xl">🧩 Kvadrat labyrint</h1>
        <p className="mt-2 text-sm text-slate-700 sm:text-base">
          Udfyld felterne fra 1 til 64. Gå op og ned eller fra side til side – aldrig diagonalt.
        </p>
      </header>

      <div
        role="group"
        aria-label="Kvadrat labyrint, udfyld tallene fra 1 til 64"
        className="grid w-full max-w-[30rem] grid-cols-8 gap-px overflow-hidden rounded-xl border-2 border-purple-300 bg-purple-200 shadow-lg"
      >
        {game.solution.map((number, index) => {
          const isFixed = game.clues.has(number);
          const isCorrect = Number(game.values[index]) === number;
          const cellStateClass = isFixed
            ? 'bg-amber-50 font-extrabold text-purple-950'
            : checked && isCorrect
              ? 'bg-emerald-100 text-emerald-900'
              : checked && game.values[index]
                ? 'bg-rose-100 text-rose-700'
                : 'bg-white text-purple-900';

          return (
            <input
              key={number}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              aria-label={`Række ${Math.floor(index / 8) + 1}, kolonne ${(index % 8) + 1}${isFixed ? ', starttal' : ''}`}
              readOnly={isFixed}
              value={game.values[index]}
              onChange={(event) => updateValue(index, event.target.value)}
              className={`aspect-square min-w-0 w-full p-0 text-center text-[clamp(0.65rem,3.8vw,1.1rem)] outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${cellStateClass}`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={checkGrid}
          className="rounded-xl bg-pink-500 px-5 py-2.5 font-bold text-white shadow transition hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
        >
          Tjek svar
        </button>
        <button
          type="button"
          onClick={resetGrid}
          className="rounded-xl bg-white px-5 py-2.5 font-bold text-purple-800 shadow transition hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
        >
          Start forfra
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-6 text-center text-sm font-bold">
        {completed
          ? <span className="text-emerald-700">🎉 Flot klaret! Alle tallene er rigtige.</span>
          : checked
            ? <span className="text-rose-700">Nogle felter mangler eller er forkerte. Prøv igen!</span>
            : null}
      </p>
    </main>
  );
}

export default SquareMaze;
