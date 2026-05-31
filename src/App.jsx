'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, RotateCcw, Trash2, Trophy, Minus, Sparkles } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

// SVG line coordinates for each winning combination (on a 3×3 grid)
const WIN_LINE_COORDS = {
  '0,1,2': { x1: '10%', y1: '16.6%', x2: '90%', y2: '16.6%' },
  '3,4,5': { x1: '10%', y1: '50%',   x2: '90%', y2: '50%'   },
  '6,7,8': { x1: '10%', y1: '83.3%', x2: '90%', y2: '83.3%' },
  '0,3,6': { x1: '16.6%', y1: '10%', x2: '16.6%', y2: '90%' },
  '1,4,7': { x1: '50%',   y1: '10%', x2: '50%',   y2: '90%' },
  '2,5,8': { x1: '83.3%', y1: '10%', x2: '83.3%', y2: '90%' },
  '0,4,8': { x1: '10%',   y1: '10%', x2: '90%',   y2: '90%' },
  '2,4,6': { x1: '90%',   y1: '10%', x2: '10%',   y2: '90%' },
};

const EMPTY_BOARD = Array(9).fill(null);

// ─── Helper ───────────────────────────────────────────────────────────────────

function checkWinner(board) {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return null;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function PlayerIcon({ type, size = 28, className = '' }) {
  if (type === 'X') {
    return <X size={size} strokeWidth={3} className={`text-cyan-glow ${className}`} />;
  }
  return <Circle size={size} strokeWidth={3} className={`text-rose-glow ${className}`} />;
}

function ScoreCard({ player, icon, score, isActive, isWinner, color }) {
  return (
    <motion.div
      layout
      animate={isWinner ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={isWinner ? { duration: 0.6, repeat: 2, repeatType: 'reverse' } : { duration: 0.3 }}
      className={`
        glass-card px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center gap-1.5 min-w-[100px] sm:min-w-[130px]
        transition-all duration-300
        ${isActive ? `ring-2 ${color === 'cyan' ? 'ring-cyan-glow/50' : 'ring-rose-glow/50'}` : 'ring-1 ring-slate-border'}
        ${isWinner ? (color === 'cyan' ? 'pulse-cyan' : 'pulse-rose') : ''}
      `}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className={`font-outfit font-semibold text-sm sm:text-base ${color === 'cyan' ? 'text-cyan-glow' : 'text-rose-glow'}`}>
          {player}
        </span>
      </div>
      <motion.span
        key={score}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`font-mono font-bold text-2xl sm:text-3xl ${color === 'cyan' ? 'text-cyan-glow glow-cyan' : 'text-rose-glow glow-rose'}`}
      >
        {score}
      </motion.span>
      <span className="text-slate-400 text-xs font-outfit tracking-wider uppercase">Wins</span>
    </motion.div>
  );
}

function DrawScore({ draws }) {
  return (
    <div className="glass-card px-4 py-3 sm:px-5 sm:py-4 flex flex-col items-center gap-1.5 min-w-[80px]">
      <div className="flex items-center gap-1.5">
        <Minus size={16} className="text-slate-400" />
        <span className="font-outfit font-medium text-sm text-slate-400">Draws</span>
      </div>
      <motion.span
        key={draws}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="font-mono font-bold text-2xl sm:text-3xl text-slate-300"
      >
        {draws}
      </motion.span>
    </div>
  );
}

function TurnIndicator({ currentPlayer, gameOver }) {
  return (
    <motion.div
      layout
      className="flex items-center justify-center gap-3 py-2"
    >
      <AnimatePresence mode="wait">
        {gameOver ? (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Sparkles size={20} className="text-gold-glow" />
            <span className="font-outfit font-semibold text-lg text-gold-glow glow-gold">
              Game Over
            </span>
          </motion.div>
        ) : (
          <motion.div
            key={currentPlayer}
            initial={{ opacity: 0, x: currentPlayer === 'X' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: currentPlayer === 'X' ? 20 : -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-2.5"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${currentPlayer === 'X' ? 'bg-cyan-glow shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-rose-glow shadow-[0_0_8px_rgba(251,113,133,0.6)]'}`} />
            <PlayerIcon type={currentPlayer} size={22} />
            <span className={`font-outfit font-medium text-base ${currentPlayer === 'X' ? 'text-cyan-glow' : 'text-rose-glow'}`}>
              {currentPlayer === 'X' ? 'Player 1' : 'Player 2'}&apos;s Turn
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Cell({ index, value, onClick, isWinCell, disabled }) {
  const isEmpty = !value;

  return (
    <motion.button
      id={`cell-${index}`}
      onClick={() => onClick(index)}
      disabled={disabled || !!value}
      whileHover={isEmpty && !disabled ? { scale: 1.05, borderColor: 'rgba(148,163,184,0.5)' } : {}}
      whileTap={isEmpty && !disabled ? { scale: 0.95 } : {}}
      className={`
        glass-cell aspect-square flex items-center justify-center cursor-pointer
        relative overflow-hidden
        ${isEmpty && !disabled ? 'hover:shadow-[0_0_20px_rgba(148,163,184,0.1)]' : ''}
        ${isWinCell ? 'bg-white/5' : ''}
        disabled:cursor-default
      `}
    >
      {/* Hover shimmer for empty cells */}
      {isEmpty && !disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-[inherit]"
        />
      )}

      <AnimatePresence mode="wait">
        {value && (
          <motion.div
            key={`${index}-${value}`}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {value === 'X' ? (
              <X
                size={40}
                strokeWidth={2.8}
                className="text-cyan-glow drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              />
            ) : (
              <Circle
                size={36}
                strokeWidth={2.8}
                className="text-rose-glow drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function WinLine({ combo }) {
  if (!combo) return null;
  const key = combo.join(',');
  const coords = WIN_LINE_COORDS[key];
  if (!coords) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      preserveAspectRatio="none"
    >
      <line
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke="rgba(251,191,36,0.85)"
        strokeWidth="4"
        strokeLinecap="round"
        className="win-line-animate"
      />
    </svg>
  );
}

function ActionButton({ onClick, icon, label, variant = 'default' }) {
  const baseClass =
    'flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-outfit font-medium text-sm transition-all duration-200 cursor-pointer';
  const variants = {
    default:
      'glass-card text-slate-300 hover:text-white hover:ring-1 hover:ring-slate-500/50 active:scale-95',
    danger:
      'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 active:scale-95',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${baseClass} ${variants[variant]}`}
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ─── Floating Particles (Background decoration) ──────────────────────────────

function FloatingParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1.5,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 12,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/10"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, 15, -15, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Win/Draw overlay ─────────────────────────────────────────────────────────

function GameOverOverlay({ result, onDismiss }) {
  if (!result) return null;

  const isDraw = result.type === 'draw';
  const winnerLabel = result.winner === 'X' ? 'Player 1' : 'Player 2';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl mb-4"
      onClick={onDismiss}
    >
      {/* Flash background */}
      <div
        className={`absolute inset-0 rounded-2xl ${
          isDraw
            ? 'bg-slate-400/10'
            : result.winner === 'X'
            ? 'bg-cyan-glow/5'
            : 'bg-rose-glow/5'
        }`}
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
        className="glass-card px-8 py-6 flex flex-col items-center gap-3 z-30 border-2 border-white/10"
      >
        {isDraw ? (
          <>
            <Minus size={36} className="text-slate-300" />
            <span className="font-outfit font-bold text-xl text-slate-200">It&apos;s a Draw!</span>
            <span className="font-outfit text-sm text-slate-400">No one wins this round</span>
          </>
        ) : (
          <>
            <Trophy size={36} className={result.winner === 'X' ? 'text-cyan-glow' : 'text-rose-glow'} />
            <span className={`font-outfit font-bold text-xl ${result.winner === 'X' ? 'text-cyan-glow glow-cyan' : 'text-rose-glow glow-rose'}`}>
              {winnerLabel} Wins!
            </span>
            <div className="flex items-center gap-2">
              <PlayerIcon type={result.winner} size={20} />
              <span className="font-outfit text-sm text-slate-400">takes the round</span>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicTacToe() {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [isXTurn, setIsXTurn] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameResult, setGameResult] = useState(null); // { type: 'win'|'draw', winner: 'X'|'O'|null, line: [] }
  const [showOverlay, setShowOverlay] = useState(false);

  const currentPlayer = isXTurn ? 'X' : 'O';
  const gameOver = !!gameResult;
  const winLine = gameResult?.line || null;
  const winCells = winLine ? new Set(winLine) : new Set();

  // Handle cell click
  const handleClick = useCallback(
    (index) => {
      if (board[index] || gameResult) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      // Check for winner
      const result = checkWinner(newBoard);
      if (result) {
        setGameResult({ type: 'win', winner: result.winner, line: result.line });
        setScores((prev) => ({ ...prev, [result.winner]: prev[result.winner] + 1 }));
        setTimeout(() => setShowOverlay(true), 500);
        return;
      }

      // Check for draw
      if (newBoard.every((cell) => cell !== null)) {
        setGameResult({ type: 'draw', winner: null, line: null });
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
        setTimeout(() => setShowOverlay(true), 400);
        return;
      }

      setIsXTurn((prev) => !prev);
    },
    [board, currentPlayer, gameResult]
  );

  // Reset round (keep scores)
  const resetRound = useCallback(() => {
    setBoard(EMPTY_BOARD);
    setGameResult(null);
    setShowOverlay(false);
    // Alternate who goes first each round
    setIsXTurn((prev) => !prev);
  }, []);

  // Reset everything
  const resetAll = useCallback(() => {
    setBoard(EMPTY_BOARD);
    setGameResult(null);
    setShowOverlay(false);
    setScores({ X: 0, O: 0, draws: 0 });
    setIsXTurn(true);
  }, []);

  // Keyboard shortcut: R to reset round, Shift+R to reset all
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'r' && !e.shiftKey) resetRound();
      if (e.key === 'R' && e.shiftKey) resetAll();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resetRound, resetAll]);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 sm:py-10 relative select-none">
      <FloatingParticles />

      {/* ── Title ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-6 sm:mb-8 relative z-10"
      >
        <h1 className="font-outfit font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
          Tic Tac Toe
        </h1>
        <p className="font-outfit text-sm text-slate-400 mt-1 tracking-wide">
          Premium 2-Player • Local Match
        </p>
      </motion.div>

      {/* ── Scoreboard ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex items-stretch justify-center gap-3 sm:gap-4 mb-5 relative z-10"
      >
        <ScoreCard
          player="Player 1"
          icon={<X size={18} strokeWidth={3} className="text-cyan-glow" />}
          score={scores.X}
          isActive={!gameOver && isXTurn}
          isWinner={gameResult?.winner === 'X'}
          color="cyan"
        />
        <DrawScore draws={scores.draws} />
        <ScoreCard
          player="Player 2"
          icon={<Circle size={18} strokeWidth={3} className="text-rose-glow" />}
          score={scores.O}
          isActive={!gameOver && !isXTurn}
          isWinner={gameResult?.winner === 'O'}
          color="rose"
        />
      </motion.div>

      {/* ── Turn Indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mb-4 relative z-10"
      >
        <TurnIndicator currentPlayer={currentPlayer} gameOver={gameOver} />
      </motion.div>

      {/* ── Game Grid ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
          gameResult?.type === 'draw'
            ? { opacity: 1, scale: 1, x: [0, -4, 4, -4, 4, 0] }
            : { opacity: 1, scale: 1 }
        }
        transition={
          gameResult?.type === 'draw'
            ? { x: { duration: 0.5, delay: 0.1 }, opacity: { duration: 0.4 }, scale: { duration: 0.4 } }
            : { duration: 0.5, delay: 0.3 }
        }
        className="relative z-10"
      >
        <div className="glass-card p-3 sm:p-4 relative">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 relative">
            {board.map((cell, i) => (
              <Cell
                key={i}
                index={i}
                value={cell}
                onClick={handleClick}
                isWinCell={winCells.has(i)}
                disabled={gameOver}
              />
            ))}
          </div>

          {/* Win Line SVG overlay */}
          {gameResult?.type === 'win' && (
            <div className="absolute inset-3 sm:inset-4 pointer-events-none">
              <WinLine combo={gameResult.line} />
            </div>
          )}

          {/* Game Over Overlay */}
          <AnimatePresence>
            {showOverlay && (
              <GameOverOverlay
                result={gameResult}
                onDismiss={resetRound}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex items-center justify-center gap-3 mt-8 sm:mt-10 relative z-10"
      >
        <ActionButton
          className="mb-4"
          onClick={resetRound}
          icon={<RotateCcw size={16} />}
          label="Reset Round"
        />
        <ActionButton
        className="mb-4"
          onClick={resetAll}
          icon={<Trash2 size={16} />}
          label="Reset All"
          variant="danger"  
        />
      </motion.div>

      {/* ── Keyboard hint ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-xs text-slate-600 mt-5 font-mono relative z-10"
      >
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 border border-slate-700/50 text-[10px]">R</kbd>
        {' '}Reset Round{' · '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 border border-slate-700/50 text-[10px]">⇧R</kbd>
        {' '}Reset All
      </motion.p>
    </div>
  );
}
