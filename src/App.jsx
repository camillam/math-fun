import { useState } from 'react';

const COLOR_CYCLE = ['none', 'green', 'yellow', 'red'];
const ALL_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function generateUniqueDigits(count) {
  const digits = [...ALL_DIGITS];
  const result = [];
  for (let index = 0; index < count; index += 1) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    result.push(digits[randomIndex]);
    digits.splice(randomIndex, 1);
  }
  return result;
}

function evaluateGuess(code, guess) {
  let rightSpot = 0;
  let wrongSpot = 0;
  for (let index = 0; index < 3; index += 1) {
    if (guess[index] === code[index]) {
      rightSpot += 1;
    } else if (code.includes(guess[index])) {
      wrongSpot += 1;
    }
  }
  return { rightSpot, wrongSpot };
}

function getCorrectCount(code, guess) {
  return guess.filter((digit) => code.includes(digit)).length;
}

function shuffleArray(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function createGuessWithMatches(code, rightSpotTarget, wrongSpotTarget) {
  const otherDigits = ALL_DIGITS.filter((digit) => !code.includes(digit));

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const guess = [null, null, null];
    const usedCodeIndices = new Set();
    const availableSlots = [0, 1, 2];

    for (let index = 0; index < rightSpotTarget; index += 1) {
      if (availableSlots.length === 0) break;
      const slotIndex = Math.floor(Math.random() * availableSlots.length);
      const slot = availableSlots[slotIndex];
      availableSlots.splice(slotIndex, 1);

      let codeIndex = slot;
      if (usedCodeIndices.has(codeIndex)) {
        const unused = [0, 1, 2].filter((value) => !usedCodeIndices.has(value));
        if (unused.length === 0) break;
        codeIndex = unused[0];
      }
      usedCodeIndices.add(codeIndex);
      guess[slot] = code[codeIndex];
    }

    for (let index = 0; index < wrongSpotTarget; index += 1) {
      if (availableSlots.length === 0) break;
      const unusedCodeIndices = [0, 1, 2].filter((value) => !usedCodeIndices.has(value));
      if (unusedCodeIndices.length === 0) break;

      const codeIndex = unusedCodeIndices[Math.floor(Math.random() * unusedCodeIndices.length)];
      const validSlots = availableSlots.filter((slot) => slot !== codeIndex);
      if (validSlots.length === 0) break;

      const slot = validSlots[Math.floor(Math.random() * validSlots.length)];
      availableSlots.splice(availableSlots.indexOf(slot), 1);
      usedCodeIndices.add(codeIndex);
      guess[slot] = code[codeIndex];
    }

    const shuffledWrong = shuffleArray([...otherDigits]);
    for (let index = 0; index < guess.length; index += 1) {
      if (guess[index] === null) {
        if (shuffledWrong.length === 0) break;
        guess[index] = shuffledWrong.pop();
      }
    }

    if (guess.every((digit) => digit !== null) && new Set(guess).size === 3) {
      const stats = evaluateGuess(code, guess);
      if (stats.rightSpot === rightSpotTarget && stats.wrongSpot === wrongSpotTarget) {
        return guess;
      }
    }
  }
  return null;
}

function generateCluesForCode(code) {
  let clues = [];
  let attempts = 0;

  while (attempts < 100) {
    clues = [];
    attempts += 1;

    const clue1Guess = createGuessWithMatches(code, 1, 0);
    if (clue1Guess) clues.push({ guess: clue1Guess, text: 'ét tal er korrekt og placeret rigtigt.' });

    if (Math.random() > 0.5) {
      const clue2Guess = createGuessWithMatches(code, 0, 2);
      if (clue2Guess) clues.push({ guess: clue2Guess, text: 'to tal er korrekte, men begge placeret forkert.' });
    } else {
      const clue2Guess = createGuessWithMatches(code, 1, 1);
      if (clue2Guess) clues.push({ guess: clue2Guess, text: 'to tal er korrekte, men kun ét er placeret korrekt.' });
    }

    const clue3Guess = createGuessWithMatches(code, 0, 3) || createGuessWithMatches(code, 0, 2);
    if (clue3Guess) {
      if (getCorrectCount(code, clue3Guess) === 3) {
        clues.push({ guess: clue3Guess, text: 'tre tal er korrekte, men ingen er placeret rigtigt.' });
      } else {
        clues.push({ guess: clue3Guess, text: 'to tal er korrekte, men ingen er placeret rigtigt.' });
      }
    }

    const wrongDigits = ALL_DIGITS.filter((digit) => !code.includes(digit));
    const clue4Guess = shuffleArray(wrongDigits).slice(0, 3);
    if (clue4Guess.length === 3) clues.push({ guess: clue4Guess, text: 'ingen tal er korrekte.' });

    if (clues.length >= 4) break;
  }

  return clues;
}

function createGame() {
  const secretCode = generateUniqueDigits(3);
  return { secretCode, clues: generateCluesForCode(secretCode) };
}

function App() {
  const [game, setGame] = useState(createGame);
  const [currentInputs, setCurrentInputs] = useState(['', '', '']);
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const [digitColorStates, setDigitColorStates] = useState({});
  const [feedback, setFeedback] = useState({ text: '', className: 'mt-3 text-center font-bold text-sm min-h-[24px]' });
  const [lockOpen, setLockOpen] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  function startNewGame() {
    setGame(createGame());
    setDigitColorStates({});
    setCurrentInputs(['', '', '']);
    setActiveInputIndex(0);
    setLockOpen(false);
    setFeedback({ text: '', className: 'mt-3 text-center font-bold text-sm min-h-[24px]' });
    setShowWinModal(false);
  }

  function cycleDigitColor(clueIndex, digitIndex) {
    const key = `${clueIndex}-${digitIndex}`;
    setDigitColorStates((current) => {
      const color = current[key] || 'none';
      const nextIndex = (COLOR_CYCLE.indexOf(color) + 1) % COLOR_CYCLE.length;
      return { ...current, [key]: COLOR_CYCLE[nextIndex] };
    });
  }

  function pressKey(digit) {
    if (activeInputIndex < 3) {
      setCurrentInputs((current) => current.map((value, index) => index === activeInputIndex ? digit : value));
      if (activeInputIndex < 2) setActiveInputIndex(activeInputIndex + 1);
    }
  }

  function backspace() {
    if (currentInputs[activeInputIndex] !== '') {
      setCurrentInputs((current) => current.map((value, index) => index === activeInputIndex ? '' : value));
    } else if (activeInputIndex > 0) {
      const previousIndex = activeInputIndex - 1;
      setActiveInputIndex(previousIndex);
      setCurrentInputs((current) => current.map((value, index) => index === previousIndex ? '' : value));
    }
  }

  function checkCode() {
    if (currentInputs.join('').length < 3) {
      setFeedback({ text: '⚠️ Indtast alle 3 tal!', className: 'mt-3 text-center font-bold text-sm text-amber-600' });
      return;
    }

    const isCorrect = currentInputs.every((value, index) => Number.parseInt(value, 10) === game.secretCode[index]);
    if (isCorrect) {
      setLockOpen(true);
      setFeedback({ text: '🎉 Rigtigt svar!', className: 'mt-3 text-center font-bold text-sm text-green-600' });
      window.confetti?.({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      window.setTimeout(() => setShowWinModal(true), 500);
    } else {
      setFeedback({ text: '❌ Forkert kode, prøv igen!', className: 'mt-3 text-center font-bold text-sm text-red-500' });
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 500);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 flex flex-col items-center">
      <header className="text-center mb-4 w-full">
        <div className="inline-block bg-white/80 backdrop-blur px-5 py-2 rounded-full shadow-md border-2 border-pink-300 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-pink-600 flex items-center justify-center gap-2">
            <span>🔐</span> Bryd Koden! <span>✨</span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-purple-700 font-medium">Brug din logik til at åbne den hemmelige lås</p>
      </header>

      <div className="w-full bg-white/90 backdrop-blur rounded-2xl p-3 shadow-lg border-2 border-purple-200 mb-4">
        <div className="text-xs font-semibold text-purple-800 mb-2 text-center flex items-center justify-center gap-1">
          💡 <span>Klik på tallene i sporet for at skifte farve:</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <div className="flex items-center justify-center gap-1 bg-green-100 border border-green-400 text-green-800 py-1.5 px-2 rounded-xl"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /><span>Rigtig plads</span></div>
          <div className="flex items-center justify-center gap-1 bg-yellow-100 border border-yellow-400 text-yellow-800 py-1.5 px-2 rounded-xl"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /><span>Forkert plads</span></div>
          <div className="flex items-center justify-center gap-1 bg-red-100 border border-red-400 text-red-800 py-1.5 px-2 rounded-xl relative overflow-hidden"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /><span>Ikke med</span></div>
        </div>
      </div>

      <div className="w-full space-y-3 mb-6">
        {game.clues.map((clue, clueIndex) => (
          <div key={clueIndex} className="flex items-center bg-white/90 backdrop-blur rounded-2xl p-2.5 shadow-md border-2 border-purple-100 gap-3">
            <div className="flex gap-1.5 shrink-0">
              {clue.guess.map((digit, digitIndex) => {
                const color = digitColorStates[`${clueIndex}-${digitIndex}`] || 'none';
                return (
                  <button
                    key={digitIndex}
                    type="button"
                    aria-label={`Tal ${digit}, ${clue.text} Skift markering`}
                    onClick={() => cycleDigitColor(clueIndex, digitIndex)}
                    className={`digit-box w-9 h-11 sm:w-10 sm:h-12 text-xl font-bold rounded-xl border-2 flex items-center justify-center cursor-pointer font-mono text-slate-800 digit-color-${color}`}
                  >
                    {digit}
                  </button>
                );
              })}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-700 leading-tight flex-1">{clue.text}</div>
          </div>
        ))}
      </div>

      <div className="w-full bg-white rounded-3xl p-5 shadow-xl border-4 border-purple-300 flex flex-col items-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-4xl pulse-lock">{lockOpen ? '🔓' : '🔒'}</span>
          <span className="text-lg font-bold text-purple-900">Hvad er koden?</span>
        </div>

        <div className={`flex gap-3 mb-5${isShaking ? ' animate-shake' : ''}`}>
          {currentInputs.map((value, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveInputIndex(index)}
              aria-label={`Kodeciffer ${index + 1}${value ? `: ${value}` : ''}`}
              className={`w-14 h-16 sm:w-16 sm:h-20 text-3xl font-bold rounded-2xl ${index === 0 ? 'border-4' : 'border-2'} flex items-center justify-center text-purple-900 shadow-inner focus:outline-none transition transform active:scale-95 ${index === activeInputIndex ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300' : 'bg-purple-50 border-purple-200'}`}
            >
              {value || '_'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 w-full max-w-xs mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
            <button key={digit} type="button" onClick={() => pressKey(digit)} className="h-11 bg-pink-100 hover:bg-pink-200 active:bg-pink-300 text-pink-900 font-bold text-xl rounded-xl border-b-4 border-pink-300 shadow active:border-b-0 transition">{digit}</button>
          ))}
        </div>

        <div className="flex gap-3 w-full max-w-xs">
          <button type="button" onClick={backspace} aria-label="Slet sidste tal" className="w-1/3 py-3 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 font-bold rounded-2xl shadow border-b-4 border-slate-400 active:border-b-0 transition flex items-center justify-center text-lg">⌫</button>
          <button type="button" onClick={checkCode} className="w-2/3 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg border-b-4 border-emerald-700 active:border-b-0 transition flex items-center justify-center gap-2"><span>Lås op!</span> 🔑</button>
        </div>

        <div className={feedback.className}>{feedback.text}</div>
      </div>

      <div className="flex justify-between w-full max-w-md px-2">
        <button type="button" onClick={() => setDigitColorStates({})} className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-xs rounded-xl shadow transition border border-purple-300 flex items-center gap-1">🧹 Nulstil farver</button>
        <button type="button" onClick={startNewGame} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1 border-b-2 border-pink-700"><span>✨ Næste opgave</span> ➔</button>
      </div>

      {showWinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div role="dialog" aria-modal="true" aria-labelledby="win-title" className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-4 border-yellow-300 transform transition-all scale-100">
            <div className="text-6xl mb-2">🎉🔓⭐</div>
            <h2 id="win-title" className="text-2xl font-bold text-pink-600 mb-2">Super Flot!</h2>
            <p className="text-slate-600 font-medium mb-4">Du knækkede koden og låste op!</p>
            <div className="inline-block bg-purple-100 border-2 border-purple-300 text-purple-900 font-bold text-2xl px-6 py-2 rounded-2xl mb-6">Koden var: {game.secretCode.join('')}</div>
            <button type="button" onClick={startNewGame} className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg border-b-4 border-purple-800 active:border-b-0 transition">Prøv en ny kode! 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
