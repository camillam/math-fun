const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

function SquareMaze({ onNavigate }) {
  return (
    <a
      href={`${BASE_PATH}/`}
      onClick={(event) => onNavigate(event, `${BASE_PATH}/`)}
      className="mx-auto block max-w-md px-4 pt-4 font-semibold text-purple-800 hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
    >
      <span aria-hidden="true" className="mr-2">←</span> Alle spil
    </a>
  );
}

export default SquareMaze;
