import { useState } from 'react';

const PIECE_COUNTS = [2, 3, 4];
const PIZZA_CENTER = 120;
const PIZZA_RADIUS = 105;
const PEPPERONI_DOT_DESIGNS = [
  [[0, -0.46], [0.44, -0.14], [0.27, 0.42], [-0.27, 0.42], [-0.44, -0.14]],
  [[0, -0.46], [0.4, -0.23], [0.4, 0.23], [0, 0.46], [-0.4, 0.23], [-0.4, -0.23]],
  [[-0.34, -0.34], [0.34, -0.34], [0.34, 0.34], [-0.34, 0.34]],
  [[0, -0.42], [0.42, 0], [0, 0.42], [-0.42, 0], [0, 0]],
];

function createOrder() {
  const denominator = PIECE_COUNTS[Math.floor(Math.random() * PIECE_COUNTS.length)];
  const numerator = Math.floor(Math.random() * denominator) + 1;
  return { numerator, denominator };
}

function getSectorPath(index, count) {
  const startAngle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const endAngle = startAngle + (2 * Math.PI) / count;
  const startX = PIZZA_CENTER + PIZZA_RADIUS * Math.cos(startAngle);
  const startY = PIZZA_CENTER + PIZZA_RADIUS * Math.sin(startAngle);
  const endX = PIZZA_CENTER + PIZZA_RADIUS * Math.cos(endAngle);
  const endY = PIZZA_CENTER + PIZZA_RADIUS * Math.sin(endAngle);
  return `M ${PIZZA_CENTER} ${PIZZA_CENTER} L ${startX} ${startY} A ${PIZZA_RADIUS} ${PIZZA_RADIUS} 0 0 1 ${endX} ${endY} Z`;
}

function getCutLinePath(index, count) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const endX = PIZZA_CENTER + 102 * Math.cos(angle);
  const endY = PIZZA_CENTER + 102 * Math.sin(angle);
  return `M ${PIZZA_CENTER} ${PIZZA_CENTER} L ${endX} ${endY}`;
}

function getCheeseEdgePath() {
  const pointCount = 120;
  const points = [];

  for (let index = 0; index < pointCount; index += 1) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / pointCount;
    const radius = 104 + Math.sin(angle * 9 + 0.4) * 2.2 + Math.cos(angle * 5) * 0.9;
    const x = PIZZA_CENTER + radius * Math.cos(angle);
    const y = PIZZA_CENTER + radius * Math.sin(angle);
    points.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return `${points.join(' ')} Z`;
}

function getSectorClipPath(index, count) {
  const startAngle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const angleStep = (2 * Math.PI) / count;
  const points = ['50% 50%'];
  const arcSteps = 16;

  for (let step = 0; step <= arcSteps; step += 1) {
    const angle = startAngle + (angleStep * step) / arcSteps;
    const x = ((PIZZA_CENTER + PIZZA_RADIUS * Math.cos(angle)) / (PIZZA_CENTER * 2)) * 100;
    const y = ((PIZZA_CENTER + PIZZA_RADIUS * Math.sin(angle)) / (PIZZA_CENTER * 2)) * 100;
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }

  return `polygon(${points.join(', ')})`;
}

function Fraction({ numerator, denominator }) {
  return (
    <span
      role="img"
      aria-label={`${numerator} over ${denominator}`}
      className="inline-flex flex-col items-center justify-center align-middle text-2xl font-bold leading-none text-rose-700"
    >
      <span>{numerator}</span>
      <span aria-hidden="true" className="my-0.5 h-0.5 w-7 bg-current" />
      <span>{denominator}</span>
    </span>
  );
}

function Pizza({ pieceCount, selectedPieces, onTogglePiece = () => {}, disabled = false }) {
  const pepperoni = [
    [120, 46, 6], [172, 68, 6], [194, 120, 6], [172, 172, 6],
    [120, 194, 6], [68, 172, 6], [46, 120, 6], [68, 68, 6],
    [130, 96, 5], [110, 144, 5],
  ];
  const basilLeaves = [
    [105, 72, -35], [157, 96, 28], [83, 158, -22],
    [132, 130, 58], [155, 180, -48], [99, 127, 36],
  ];

  return (
    <div
      role={pieceCount ? undefined : 'img'}
      aria-label={pieceCount ? undefined : 'Hel pizza'}
      className="relative aspect-square w-full max-w-[17rem] touch-manipulation"
    >
      <svg aria-hidden="true" viewBox="0 0 240 240" className="absolute inset-0 h-full w-full drop-shadow-lg">
        <defs>
          <linearGradient id="pizza-crust-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4d28a" />
            <stop offset="55%" stopColor="#d99549" />
            <stop offset="100%" stopColor="#b96836" />
          </linearGradient>
          <radialGradient id="pizza-cheese-gradient" cx="42%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#ffe47c" />
            <stop offset="100%" stopColor="#edb936" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="116" fill="url(#pizza-crust-gradient)" stroke="#17120e" strokeWidth="4" />
        <path d={getCheeseEdgePath()} fill="url(#pizza-cheese-gradient)" />
        {pieceCount && Array.from({ length: pieceCount }, (_, index) => (
          <path
            key={index}
            d={getSectorPath(index, pieceCount)}
            fill={selectedPieces.includes(index) ? '#ed8662' : 'url(#pizza-cheese-gradient)'}
            style={{ transition: 'fill 180ms ease' }}
          />
        ))}
        {pepperoni.map(([x, y, size], index) => {
          const radius = size * 4;
          const lightDots = PEPPERONI_DOT_DESIGNS[index % PEPPERONI_DOT_DESIGNS.length];

          return (
            <g key={index}>
              <circle cx={x} cy={y} r={radius + 1} fill="#17120e" />
              <circle cx={x} cy={y} r={radius - 1} fill="#c9343d" />
              {lightDots.map(([offsetX, offsetY], dotIndex) => (
                <ellipse
                  key={dotIndex}
                  cx={x + radius * offsetX}
                  cy={y + radius * offsetY}
                  rx={radius * 0.12}
                  ry={radius * 0.2}
                  fill="#81242a"
                  transform={`rotate(${(dotIndex % 2) * 45 - 22.5} ${x + radius * offsetX} ${y + radius * offsetY})`}
                />
              ))}
            </g>
          );
        })}
        {basilLeaves.map(([x, y, angle], index) => (
          <g
            key={index}
            transform={`translate(${120 + (x - 120) * 1.15} ${120 + (y - 120) * 1.15}) rotate(${angle}) scale(2)`}
          >
            <path d="M 0 -8 C 7 -5 8 3 0 8 C -7 3 -7 -5 0 -8 Z" fill="#64864b" />
            <path d="M 0 -5 L 0 5" stroke="#c9d69b" strokeWidth="0.6" />
          </g>
        ))}
        {pieceCount && Array.from({ length: pieceCount }, (_, index) => (
          <path
            key={index}
            d={getCutLinePath(index, pieceCount)}
            fill="none"
            stroke="#fff1b2"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
        <path d={getCheeseEdgePath()} fill="none" stroke="#17120e" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="120" cy="120" r="116" fill="none" stroke="#17120e" strokeWidth="4" />
      </svg>
      {pieceCount && Array.from({ length: pieceCount }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Stykke ${index + 1} af ${pieceCount}`}
          aria-pressed={selectedPieces.includes(index)}
          disabled={disabled}
          onClick={() => onTogglePiece(index)}
          className="pizza-slice-button absolute inset-0 h-full w-full rounded-full bg-transparent p-0 focus-visible:z-10"
          style={{ clipPath: getSectorClipPath(index, pieceCount) }}
        >
          <span className="sr-only">{selectedPieces.includes(index) ? 'Valgt til bakken' : 'Vælg til bakken'}</span>
        </button>
      ))}
    </div>
  );
}

function PizzaGame() {
  const [order, setOrder] = useState(createOrder);
  const [stage, setStage] = useState('cutting');
  const [selectedPieces, setSelectedPieces] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [ordersCompleted, setOrdersCompleted] = useState(0);

  function cutPizza(pieceCount) {
    if (pieceCount !== order.denominator) {
      setFeedback({
        type: 'error',
        text: `Kunden ønsker ${order.denominator} lige store stykker. Prøv igen.`,
      });
      return;
    }

    setSelectedPieces([]);
    setStage('serving');
    setFeedback({ type: 'success', text: 'Flot skåret! Vælg stykker til bakken.' });
  }

  function togglePiece(index) {
    setSelectedPieces((current) => (
      current.includes(index)
        ? current.filter((piece) => piece !== index)
        : [...current, index]
    ));
    setFeedback(null);
  }

  function serveOrder() {
    if (selectedPieces.length !== order.numerator) {
      const selectedWord = selectedPieces.length === 1 ? 'stykke' : 'stykker';
      const message = selectedPieces.length < order.numerator
        ? `Du har valgt ${selectedPieces.length} ${selectedWord}. Kunden bad om ${order.numerator}.`
        : `Du har valgt ${selectedPieces.length} ${selectedWord}. Kunden bad kun om ${order.numerator}.`;
      setFeedback({ type: 'error', text: message });
      return;
    }

    setStage('served');
    setFeedback({ type: 'success', text: `Lige som bestilt: ${order.numerator} ud af ${order.denominator} stykker.` });
  }

  function nextOrder() {
    setOrder(createOrder());
    setStage('cutting');
    setSelectedPieces([]);
    setFeedback(null);
    setOrdersCompleted((count) => count + 1);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 pb-10 pt-5">
      <header className="w-full text-center">
        <p className="mb-1 text-xs font-bold uppercase text-rose-700">Bestilling nr. {ordersCompleted + 1}</p>
        <h1 className="text-2xl font-bold text-rose-700 sm:text-3xl">Brøk-Pizzaen</h1>
      </header>

      <section aria-label="Kundens bestilling" className="flex w-full flex-wrap items-center justify-center gap-3 rounded-2xl border-2 border-rose-200 bg-white/90 px-4 py-3 text-center shadow-sm">
        <span className="text-base font-semibold text-slate-700">Jeg vil gerne have</span>
        <Fraction numerator={order.numerator} denominator={order.denominator} />
        <span className="text-base font-semibold text-slate-700">pizza.</span>
      </section>

      {stage === 'cutting' && (
        <section className="w-full text-center" aria-labelledby="cut-heading">
          <div className="mb-4 flex justify-center">
            <Pizza pieceCount={null} selectedPieces={[]} disabled />
          </div>
          <h2 id="cut-heading" className="mb-3 text-base font-bold text-slate-800">Hvor mange lige store stykker skal du skære?</h2>
          <div role="group" aria-label="Vælg antal stykker" className="grid grid-cols-3 gap-2">
            {PIECE_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => cutPizza(count)}
                className="min-h-12 rounded-xl border-2 border-amber-300 bg-amber-100 px-2 py-2 font-bold text-amber-950 shadow-sm transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                {count} lige stykker
              </button>
            ))}
          </div>
        </section>
      )}

      {stage !== 'cutting' && (
        <section className="flex w-full flex-col items-center gap-3" aria-label="Pizza og bakke">
          {stage === 'serving' ? (
            <h2 className="text-center text-base font-bold text-slate-800">
              Vælg {order.numerator} {order.numerator === 1 ? 'stykke' : 'stykker'} til bakken
            </h2>
          ) : (
            <h2 className="text-center text-base font-bold text-emerald-800">Bestillingen er serveret!</h2>
          )}
          <Pizza
            pieceCount={order.denominator}
            selectedPieces={selectedPieces}
            onTogglePiece={stage === 'serving' ? togglePiece : () => {}}
            disabled={stage === 'served'}
          />

          <div className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center" aria-live="polite">
            <p className="font-bold text-emerald-900">Bakken</p>
            <p className="text-sm text-emerald-800">
              {stage === 'served' ? order.numerator : selectedPieces.length} af {order.denominator} stykker
            </p>
            <div aria-hidden="true" className="mt-2 flex min-h-5 justify-center gap-1.5">
              {Array.from({ length: order.denominator }, (_, index) => (
                <span
                  key={index}
                  className={`h-4 w-4 rounded-full border border-emerald-700 ${index < selectedPieces.length || stage === 'served' ? 'bg-emerald-500' : 'bg-white'}`}
                />
              ))}
            </div>
          </div>

          {stage === 'serving' ? (
            <button
              type="button"
              onClick={serveOrder}
              className="min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-md transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Læg på bakken
            </button>
          ) : (
            <button
              type="button"
              onClick={nextOrder}
              className="min-h-12 w-full rounded-xl bg-rose-600 px-4 py-3 font-bold text-white shadow-md transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-800"
            >
              Næste kunde
            </button>
          )}
        </section>
      )}

      {feedback && (
        <p
          role="status"
          className={`w-full text-center text-sm font-semibold ${feedback.type === 'error' ? 'text-rose-700' : 'text-emerald-800'}`}
        >
          {feedback.text}
        </p>
      )}
    </main>
  );
}

export default PizzaGame;