import React, { useState, useEffect } from 'react';

const LEVELS = [
  { 
    id: 1, difficulty: 'ALPHA', size: 5, 
    // Shifted: This was your Medium, now it's Round 1 with added barriers
    targets: [{v: 1, x:0, y:0}, {v: 2, x:2, y:2}, {v: 3, x:4, y:0}, {v: 4, x:4, y:4}, {v: 5, x:0, y:4}],
    barriers: [ {x:3,y:1},{x:1,y:4}] // New barriers to prevent easy shortcuts
  },
  { 
    id: 2, difficulty: 'BETA', size: 6, 
    // New Mid-Tier: Larger grid, more walking required
    targets: [{v: 1, x:0, y:0}, {v: 2, x:5, y:0}, {v: 3, x:0, y:5}, {v: 4, x:4, y:5}],
    barriers: [{x:2, y:2}, {x:3, y:3}, {x:2, y:3}, {x:3, y:2}] 
  },
  { 
    id: 3, difficulty: 'GAMMA', size: 7, 
    // Balanced Hard: 7x7 is better than 8x8 for mobile/solving speed
    targets: [{v: 1, x:0, y:0}, {v: 2, x:6, y:0}, {v: 3, x:3, y:3}, {v: 4, x:0, y:6}, {v: 5, x:6, y:6}],
    barriers: [{x:0, y:3}, {x:1, y:3}, {x:5, y:3}, {x:6, y:3}] // Side "gates"
  }
];

function App() {
  const [gameState, setGameState] = useState('start');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [grid, setGrid] = useState([]);
  const [path, setPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const level = LEVELS[currentLevelIdx];

  const initGrid = () => {
    const newGrid = Array(level.size).fill().map(() => Array(level.size).fill(0));
    level.targets.forEach(t => newGrid[t.y][t.x] = { type: 'target', val: t.v });
    level.barriers.forEach(b => newGrid[b.y][b.x] = { type: 'barrier' });
    setGrid(newGrid);
    setPath([]);
    setErrorMsg('');
  };

  useEffect(() => { if(gameState === 'playing') initGrid(); }, [currentLevelIdx, gameState]);

  useEffect(() => {
    let interval;
    if (gameState === 'playing') interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const handleInput = (y, x) => {
    const cell = grid[y][x];
    setErrorMsg('');

    if (!isDrawing) {
      if (cell.type === 'target' && cell.val === 1) {
        setIsDrawing(true);
        setPath([{x, y}]);
      }
      return;
    }

    const last = path[path.length - 1];
    if (last.x === x && last.y === y) return;

    const isAdjacent = (Math.abs(last.x - x) === 1 && last.y === y) || (Math.abs(last.y - y) === 1 && last.x === x);
    if (!isAdjacent) return;

    // Backtrack logic
    if (path.length > 1 && path[path.length - 2].x === x && path[path.length - 2].y === y) {
      setPath(path.slice(0, -1));
      return;
    }

    if (path.some(p => p.x === x && p.y === y) || cell.type === 'barrier') return;

    if (cell.type === 'target') {
      const targetsInPath = path.filter(p => grid[p.y][p.x].type === 'target').length;
      if (cell.val !== targetsInPath + 1) return;
    }

    setPath([...path, {x, y}]);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    const required = (level.size * level.size) - level.barriers.length;
    const lastTargetReached = path.some(p => grid[p.y][p.x].val === level.targets.length);

    if (path.length === required && lastTargetReached) {
      if (currentLevelIdx < LEVELS.length - 1) {
        setCurrentLevelIdx(prev => prev + 1);
      } else {
        setGameState('finished');
      }
    } else if (path.length > 0) {
      setErrorMsg('ERROR: UNFILLED SECTORS DETECTED');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 select-none touch-none font-mono">
      {gameState === 'start' ? (
        <div className="text-center border border-emerald-500/20 p-12 bg-emerald-950/5 rounded-2xl shadow-2xl">
          <h1 className="text-4xl font-black mb-4 italic text-emerald-500 tracking-tighter">ZIP-ENGINE</h1>
          <p className="text-[10px] tracking-[0.4em] mb-10 opacity-40 uppercase font-bold">CTRL + CHAOS: LEVEL 1</p>
          <button onClick={() => setGameState('playing')} className="px-10 py-4 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-black transition-all font-black uppercase tracking-widest">Connect</button>
        </div>
      ) : (
        <div className="w-full max-w-sm border-t-2 border-emerald-500 bg-[#0d0d0d] p-6 rounded-b-2xl shadow-2xl relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-emerald-500 font-black tracking-widest text-xs uppercase italic">{level.difficulty}</h2>
            <span className="text-white font-bold bg-white/5 px-3 py-1 rounded text-sm">{timer}s</span>
          </div>

          <div 
            className="grid gap-1 bg-black p-1 border border-white/5 rounded"
            style={{ gridTemplateColumns: `repeat(${level.size}, 1fr)` }}
            onMouseUp={handleEnd}
            onTouchEnd={handleEnd}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const el = document.elementFromPoint(touch.clientX, touch.clientY);
              const coords = el?.getAttribute('data-coords');
              if (coords) {
                const [y, x] = coords.split('-').map(Number);
                handleInput(y, x);
              }
            }}
          >
            {grid.map((row, y) => row.map((cell, x) => {
              const isInPath = path.some(p => p.x === x && p.y === y);
              return (
                <div
                  key={`${y}-${x}`}
                  data-coords={`${y}-${x}`}
                  onMouseDown={() => handleInput(y, x)}
                  onMouseEnter={() => handleInput(y, x)}
                  onTouchStart={() => handleInput(y, x)}
                  className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-sm transition-all duration-75
                    ${cell.type === 'barrier' ? 'bg-[#1a1a1a] opacity-20' : 'bg-[#151515]'}
                    ${isInPath ? 'bg-emerald-500 text-black font-black' : 'hover:bg-white/5'}
                  `}
                >
                  {cell.type === 'target' && <span className="text-sm">{cell.val}</span>}
                  {cell.type === 'barrier' && <span className="text-[6px]">#</span>}
                </div>
              );
            }))}
          </div>

          <div className="mt-8 flex gap-2">
            <button onClick={initGrid} className="flex-1 py-3 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest">Reset</button>
            <button onClick={() => setErrorMsg("HINT: SPIRAL AROUND THE EDGES")} className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Hint</button>
          </div>

          {errorMsg && <p className="mt-4 text-[9px] text-red-500 text-center uppercase tracking-widest animate-pulse font-bold">{errorMsg}</p>}

          {gameState === 'finished' && (
            <div className="absolute inset-0 bg-emerald-500 text-black flex flex-col items-center justify-center p-10 z-50 text-center rounded-2xl">
              <h2 className="text-3xl font-black italic mb-2 tracking-tighter uppercase leading-none">Access Granted</h2>
              <div className="bg-black text-white px-8 py-4 mt-6 rounded font-mono font-bold text-xl shadow-2xl">
                CODE: G7@kL!2xQ#9mP$zR&4t
              </div>
              <button onClick={() => window.location.reload()} className="mt-10 text-[9px] font-black uppercase underline tracking-[0.5em]">Close</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
