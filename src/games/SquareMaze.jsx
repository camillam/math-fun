import { useState } from 'react';

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

const LEVELS = {
  easy: { size: 6, clueCount: 12 },
  medium: { size: 8, clueCount: 19 },
  hard: { size: 8, clueCount: 12 },
};

function getNeighbors(index, size) {
  const row = Math.floor(index / size);
  const column = index % size;
  return [
    ...(row > 0 ? [index - size] : []),
    ...(row < size - 1 ? [index + size] : []),
    ...(column > 0 ? [index - 1] : []),
    ...(column < size - 1 ? [index + 1] : []),
  ];
}

function createFallbackSolution(size) {
  const rotation = Math.floor(Math.random() * 4);
  const reflect = Math.random() < 0.5;
  const path = [];
  for (let row = 0; row < size; row += 1) {
    const columns = Array.from({ length: size }, (_, column) => column);
    if (row % 2 === 1) columns.reverse();
    columns.forEach((column) => path.push(row * size + column));
  }

  const transformedPath = path.map((cell) => {
    let row = Math.floor(cell / size);
    let column = cell % size;
    if (reflect) column = size - 1 - column;
    for (let turn = 0; turn < rotation; turn += 1) {
      [row, column] = [column, size - 1 - row];
    }
    return row * size + column;
  });
  const areAdjacent = (first, second) => Math.abs(Math.floor(first / size) - Math.floor(second / size))
    + Math.abs((first % size) - (second % size)) === 1;

  for (let move = 0; move < 160; move += 1) {
    const reversibleSegments = [];
    for (let start = 0; start < transformedPath.length; start += 1) {
      for (let end = start + 1; end < transformedPath.length; end += 1) {
        const connectsBefore = start === 0 || areAdjacent(transformedPath[start - 1], transformedPath[end]);
        const connectsAfter = end === transformedPath.length - 1 || areAdjacent(transformedPath[start], transformedPath[end + 1]);
        if (connectsBefore && connectsAfter) reversibleSegments.push([start, end]);
      }
    }

    if (reversibleSegments.length === 0) break;
    const [start, end] = reversibleSegments[Math.floor(Math.random() * reversibleSegments.length)];
    const reversedSegment = transformedPath.slice(start, end + 1).reverse();
    transformedPath.splice(start, reversedSegment.length, ...reversedSegment);
  }

  const solution = Array(size * size);
  transformedPath.forEach((cell, numberIndex) => {
    solution[cell] = numberIndex + 1;
  });

  return solution;
}

function createRandomSolution(size) {
  const cellCount = size * size;
  const neighbors = Array.from({ length: cellCount }, (_, index) => getNeighbors(index, size));
  const visited = Array(cellCount).fill(false);
  const path = [];
  let searchNodes = 0;
  const searchLimit = 50000;

  function search(current) {
    searchNodes += 1;
    if (path.length === cellCount) return true;
    if (searchNodes >= searchLimit) return false;

    const candidates = neighbors[current]
      .filter((neighbor) => !visited[neighbor])
      .map((neighbor) => ({
        index: neighbor,
        onwardMoves: neighbors[neighbor].filter((next) => !visited[next]).length,
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

  const start = Math.floor(Math.random() * cellCount);
  visited[start] = true;
  path.push(start);
  if (!search(start)) return createFallbackSolution(size);

  const solution = Array(cellCount);
  path.forEach((cell, index) => {
    solution[cell] = index + 1;
  });
  return solution;
}

function createClues(size, clueCount) {
  const numberCount = size * size;
  const candidates = Array.from({ length: numberCount - 2 }, (_, index) => index + 2);
  let selectedClues;

  if (size === 6) {
    const interiorClueCount = clueCount - 2;
    selectedClues = Array.from({ length: interiorClueCount }, (_, segment) => {
      const start = 2 + Math.floor((segment * candidates.length) / interiorClueCount);
      const end = 2 + Math.floor(((segment + 1) * candidates.length) / interiorClueCount);
      return start + Math.floor(Math.random() * (end - start));
    });
  } else {
    for (let index = candidates.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
    }
    selectedClues = candidates.slice(0, clueCount - 2);
  }

  return new Set([1, numberCount, ...selectedClues]);
}

function createGame(difficulty) {
  const { size, clueCount } = LEVELS[difficulty];
  const solution = createRandomSolution(size);
  const clues = createClues(size, clueCount);
  const values = solution.map((number) => clues.has(number) ? String(number) : '');
  return { solution, clues, values, size };
}

function SquareMaze({ onNavigate }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [game, setGame] = useState(() => createGame('medium'));
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  function startNewGame(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    setGame(createGame(nextDifficulty));
    setChecked(false);
    setCompleted(false);
    setShowWinModal(false);
  }

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
    const isComplete = correctCount === game.solution.length;
    setCompleted(isComplete);
    if (isComplete && !completed) {
      window.confetti?.({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setShowWinModal(true);
    }
  }

  function resetGrid() {
    startNewGame();
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
          Udfyld felterne fra 1 til {game.solution.length}. Gå op og ned eller fra side til side – aldrig diagonalt.
        </p>
      </header>

      <div role="group" aria-label="Sværhedsgrad" className="mb-4 inline-flex gap-1.5 rounded-2xl border border-purple-200 bg-white/80 p-1.5 shadow-md">
        <button
          type="button"
          aria-pressed={difficulty === 'easy'}
          onClick={() => startNewGame('easy')}
          className={`rounded-xl px-4 py-2 text-sm font-bold shadow ${difficulty === 'easy' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Let
        </button>
        <button
          type="button"
          aria-pressed={difficulty === 'medium'}
          onClick={() => startNewGame('medium')}
          className={`rounded-xl px-4 py-2 text-sm font-bold shadow ${difficulty === 'medium' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Mellem
        </button>
        <button
          type="button"
          aria-pressed={difficulty === 'hard'}
          onClick={() => startNewGame('hard')}
          className={`rounded-xl px-4 py-2 text-sm font-bold shadow ${difficulty === 'hard' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Svær
        </button>
      </div>

      <div
        role="group"
        aria-label={`Kvadrat labyrint, udfyld tallene fra 1 til ${game.solution.length}`}
        className={`grid ${game.size === 6 ? 'w-3/4 max-w-[22.5rem] grid-cols-6' : 'w-full max-w-[30rem] grid-cols-8'} gap-px overflow-hidden rounded-xl border-2 border-purple-300 bg-purple-200 shadow-lg`}
      >
        {game.solution.map((number, index) => {
          const isFixed = game.clues.has(number);
          const isEndpoint = number === 1 || number === game.solution.length;
          const isCorrect = Number(game.values[index]) === number;
          const cellStateClass = isFixed
            ? isEndpoint
              ? 'bg-amber-100 font-extrabold text-purple-950'
              : 'bg-amber-50 font-extrabold text-purple-950'
            : checked && isCorrect
              ? 'bg-emerald-100 text-emerald-900'
              : checked && game.values[index]
                ? 'bg-rose-100 text-rose-700'
                : 'bg-white text-purple-900';

          if (isEndpoint) {
            return (
              <div
                key={number}
                role="img"
                aria-label={`${number === 1 ? 'Start' : 'Slut'}, ${number}`}
                className={`relative aspect-square min-w-0 w-full flex items-center justify-center p-0 text-[clamp(0.65rem,3.8vw,1.1rem)] ${cellStateClass}`}
              >
                <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-[2%] h-[96%] w-[96%] fill-amber-200">
                  <polygon points="50,2 61,37 98,37 68,59 79,96 50,74 21,96 32,59 2,37 39,37" />
                </svg>
                <span className="relative z-10 text-[0.8em]">{number}</span>
              </div>
            );
          }

          return (
            <input
              key={number}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              aria-label={`Række ${Math.floor(index / game.size) + 1}, kolonne ${(index % game.size) + 1}${isFixed ? ', ledetråd' : ''}`}
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

      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="maze-win-title" className="w-full max-w-sm rounded-3xl border-4 border-yellow-300 bg-white p-6 text-center shadow-2xl">
            <div aria-hidden="true" className="mb-2 text-6xl">🎉⭐🧩</div>
            <h2 id="maze-win-title" className="mb-2 text-2xl font-bold text-pink-600">Super flot!</h2>
            <p className="mb-4 font-medium text-slate-600">Du fandt vejen gennem labyrinten!</p>
            <button
              type="button"
              onClick={() => startNewGame()}
              className="w-full rounded-2xl border-b-4 border-purple-800 bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-lg font-bold text-white shadow-lg transition active:border-b-0"
            >
              Prøv en ny labyrint! 🚀
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default SquareMaze;
