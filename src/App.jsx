import { useEffect, useState } from 'react';
import CodeGame from './games/CodeGame.jsx';
import PizzaGame from './games/PizzaGame.jsx';

const GAME_CATALOG = [
  {
    slug: 'code',
    title: 'Bryd koden',
    description: 'Knæk den hemmelige kode.',
    icon: '🔐',
    component: CodeGame,
  },
  {
    slug: 'pizza',
    title: 'Brøk-Pizzaen',
    description: 'Skær pizzaen i lige store stykker.',
    icon: '🍕',
    component: PizzaGame,
  },
];

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

function GameHome({ onNavigate }) {
  return (
    <main className="min-h-[calc(100svh-3rem)] flex flex-col items-center px-5 pt-12 pb-12">
      <header className="text-center mb-8">
        <p className="text-sm font-bold uppercase text-purple-700 mb-2">Math Fun</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-pink-600">Vælg et spil</h1>
      </header>

      <nav aria-label="Spil" className="grid w-full max-w-xs grid-cols-1 gap-3">
        {GAME_CATALOG.map((game) => (
          <a
            key={game.slug}
            href={`${BASE_PATH}/${game.slug}`}
            onClick={(event) => onNavigate(event, `${BASE_PATH}/${game.slug}`)}
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-purple-200 bg-white/90 p-4 shadow-lg transition hover:-translate-y-1 hover:border-pink-300 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-500"
          >
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-3xl shadow-inner">
              {game.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-purple-900">{game.title}</span>
              <span className="block text-sm text-slate-600">{game.description}</span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-xl font-bold text-pink-500">→</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname.replace(/\/$/, '') || '/');
  const activeGame = GAME_CATALOG.find((game) => currentPath === `${BASE_PATH}/${game.slug}`);

  useEffect(() => {
    const syncPath = () => setCurrentPath(window.location.pathname.replace(/\/$/, '') || '/');
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  function navigate(event, path) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', path);
    setCurrentPath(path.replace(/\/$/, '') || '/');
  }

  if (!activeGame) return <GameHome onNavigate={navigate} />;

  const Game = activeGame.component;
  return (
    <>
      <div className="mx-auto max-w-md px-4 pt-4">
        <a href={`${BASE_PATH}/`} onClick={(event) => navigate(event, `${BASE_PATH}/`)} className="inline-flex min-h-10 items-center font-semibold text-purple-800 hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500">
          <span aria-hidden="true" className="mr-2">←</span> Alle spil
        </a>
      </div>
      <Game />
    </>
  );
}

export default App;
