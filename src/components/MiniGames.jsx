import React, { useState, useEffect, useCallback } from 'react';
import { X, Gamepad2, RefreshCw, Trophy, ArrowLeft, Brain, Puzzle, FastForward } from 'lucide-react';

const MiniGames = ({ onClose }) => {
  const [activeGame, setActiveView] = useState('menu'); 

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-[30px] border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[600px] text-white relative">
        
        {/* Arcade Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {activeGame !== 'menu' && (
              <button onClick={() => setActiveView('menu')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition shadow-sm">
                <ArrowLeft size={20} className="text-blue-400" />
              </button>
            )}
            <Gamepad2 size={24} className="text-indigo-500" />
            <h2 className="font-black text-xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              {activeGame === 'menu' ? 'Arcade Zone' : activeGame.toUpperCase()}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition">
            <X size={24} />
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
          {activeGame === 'menu' && <GameMenu onSelect={setActiveView} />}
          {activeGame === 'tictactoe' && <TicTacToe />}
          {activeGame === 'memory' && <MemoryMatch />}
          {activeGame === 'scramble' && <WordScramble />}
        </div>

      </div>
    </div>
  );
};

/* =========================================
   🎮 1. GAME MENU (Dashboard)
========================================= */
const GameMenu = ({ onSelect }) => {
  const games = [
    { id: 'tictactoe', name: 'Tic-Tac-Toe', desc: 'Classic 2-Player strategy game.', icon: Gamepad2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
    { id: 'memory', name: 'Memory Match', desc: 'Test your brain with travel emojis.', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
    { id: 'scramble', name: 'Word Scramble', desc: 'Unscramble travel & holiday words.', icon: Puzzle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]' }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <h3 className="text-slate-400 mb-8 font-medium text-center">Play offline while you travel. No internet required!</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl px-4">
        {games.map(game => (
          <button 
            key={game.id} 
            onClick={() => onSelect(game.id)}
            className={`p-6 rounded-3xl border flex flex-col items-center gap-4 text-center transition-all duration-300 hover:-translate-y-2 ${game.bg} hover:bg-opacity-20`}
          >
            <div className={`p-4 rounded-2xl bg-slate-800 shadow-inner ${game.color}`}><game.icon size={36} /></div>
            <div>
              <h4 className="font-bold text-lg text-white mb-1">{game.name}</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{game.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* =========================================
   🎮 2. TIC-TAC-TOE
========================================= */
const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  
  const checkWinner = (squares) => {
    const lines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  };

  const winner = checkWinner(board);
  const isDraw = !winner && board.every(s => s !== null);

  const handleClick = (i) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
      <div className="mb-8 text-center bg-slate-800/50 px-8 py-3 rounded-full border border-slate-700">
        {winner ? <h3 className="text-2xl font-black text-green-400 flex items-center justify-center gap-2"><Trophy size={24}/> Player {winner} Wins!</h3> :
         isDraw ? <h3 className="text-xl font-bold text-yellow-400">It's a Draw!</h3> :
         <h3 className="text-lg font-bold text-slate-300">Next Player: <span className={`font-black text-xl ${isXNext ? 'text-blue-400' : 'text-red-400'}`}>{isXNext ? 'X' : 'O'}</span></h3>}
      </div>

      <div className="grid grid-cols-3 gap-3 bg-slate-800 p-4 rounded-[30px] border border-slate-700 shadow-xl">
        {board.map((val, i) => (
          <button key={i} onClick={() => handleClick(i)} className={`w-24 h-24 bg-slate-900 rounded-2xl shadow-inner text-6xl font-black flex items-center justify-center transition hover:bg-slate-700 ${val === 'X' ? 'text-blue-400' : 'text-red-400'}`}>
            {val}
          </button>
        ))}
      </div>

      <button onClick={reset} className="mt-10 flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-xl font-bold transition shadow-lg hover:shadow-xl">
        <RefreshCw size={18} /> Restart Game
      </button>
    </div>
  );
};

/* =========================================
   🎮 3. MEMORY MATCH
========================================= */
const travelEmojis = ['🌍', '✈️', '🏕️', '🏖️', '🎒', '🚙'];

const getShuffledCards = () => {
  return [...travelEmojis, ...travelEmojis]
    .sort(() => Math.random() - 0.5)
    .map((emoji, index) => ({ id: index, emoji }));
};

const MemoryMatch = () => {
  const [cards, setCards] = useState(getShuffledCards());
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);

  const handleRestart = () => {
    setCards(getShuffledCards());
    setFlipped([]);
    setSolved([]);
    setDisabled(false);
  };

  const handleCardClick = (index) => {
    if (disabled || flipped.includes(index) || solved.includes(index)) return;
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setSolved([...solved, ...newFlipped]);
        setFlipped([]);
        setDisabled(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in w-full max-w-md mx-auto">
      <div className="mb-6 flex justify-between w-full items-center bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-700">
        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Matches: {solved.length / 2} / 6</h3>
        {solved.length === 12 ? <span className="text-green-400 font-black animate-pulse flex items-center gap-2"><Trophy size={18}/> WON!</span> : <span className="text-slate-500 font-bold text-sm">Find pairs</span>}
      </div>

      <div className="grid grid-cols-4 gap-3 w-full">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || solved.includes(index);
          return (
            <div key={card.id} onClick={() => handleCardClick(index)} className={`aspect-square cursor-pointer perspective-1000`}>
              <div className={`w-full h-full transition-all duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                <div className={`absolute inset-0 bg-slate-800 rounded-2xl border border-slate-600 shadow-md flex items-center justify-center hover:bg-slate-700 ${isFlipped ? 'hidden' : 'block'}`}>
                  <Brain className="text-slate-500 opacity-40" size={28} />
                </div>
                <div className={`absolute inset-0 bg-slate-700 rounded-2xl border-2 border-purple-500 flex items-center justify-center text-4xl shadow-inner ${isFlipped ? 'block' : 'hidden'}`}>
                  {card.emoji}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={handleRestart} className="mt-8 flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-xl font-bold transition shadow-lg">
        <RefreshCw size={18} /> Restart
      </button>
    </div>
  );
};

/* =========================================
   🎮 4. WORD SCRAMBLE (Naya Game!)
========================================= */
const TRAVEL_WORDS = [
  'PASSPORT', 'SUITCASE', 'AIRPLANE', 'MOUNTAIN', 'VACATION', 
  'COMPASS', 'BACKPACK', 'JOURNEY', 'TOURIST', 'TICKET', 
  'CAMERA', 'BEACH', 'HOTEL', 'SAFARI', 'ISLAND'
];

const WordScramble = () => {
  const [word, setWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const initGame = useCallback(() => {
    const randomWord = TRAVEL_WORDS[Math.floor(Math.random() * TRAVEL_WORDS.length)];
    setWord(randomWord);
    
    // Scramble logic: make sure it doesn't match original
    let scrambledWord = randomWord.split('').sort(() => Math.random() - 0.5).join('');
    while (scrambledWord === randomWord) {
      scrambledWord = randomWord.split('').sort(() => Math.random() - 0.5).join('');
    }
    
    setScrambled(scrambledWord);
    setGuess('');
    setMessage('');
    setIsSuccess(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess) return;

    if (guess.toUpperCase() === word) {
      setScore(s => s + 10);
      setMessage('Brilliant! +10 Points 🎉');
      setIsSuccess(true);
      setTimeout(() => {
        initGame();
      }, 1500);
    } else {
      setMessage('Oops! Try again. ❌');
      setIsSuccess(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in w-full max-w-lg mx-auto">
      
      {/* Score Header */}
      <div className="flex justify-between items-center w-full mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm">Travel Puzzle</h3>
        <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1.5 rounded-lg font-black border border-green-500/30">
          <Trophy size={16} /> SCORE: {score}
        </div>
      </div>

      {/* Scrambled Word Display (Letter Tiles) */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {scrambled.split('').map((letter, i) => (
          <div key={i} className="w-12 h-14 bg-slate-800 border-2 border-slate-600 rounded-xl flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-black/50">
            {letter}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleGuess} className="w-full flex flex-col gap-4">
        <input 
          type="text" 
          value={guess}
          onChange={(e) => setGuess(e.target.value.toUpperCase())}
          placeholder="Type the correct word..."
          className={`w-full bg-slate-900 border-2 rounded-2xl p-4 text-center text-2xl font-black tracking-widest outline-none transition-colors ${isSuccess ? 'border-green-500 text-green-400' : 'border-slate-600 text-white focus:border-blue-500'}`}
          disabled={isSuccess}
          autoFocus
          autoComplete="off"
        />
        
        {message && (
          <p className={`text-center font-bold text-sm ${isSuccess ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <button type="submit" disabled={isSuccess} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl transition shadow-lg">
            SUBMIT
          </button>
          <button type="button" onClick={initGame} disabled={isSuccess} className="px-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-4 rounded-xl transition flex items-center justify-center">
            <FastForward size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MiniGames;