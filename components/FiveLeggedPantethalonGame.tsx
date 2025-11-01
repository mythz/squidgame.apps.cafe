import React, { useState, useEffect, useCallback, useRef } from 'react';
import BloodSplatter from './BloodSplatter';
import { PowerupType } from '../types';
import Jumpscare from './Jumpscare';

interface GameDataProps {
  powerups: Record<PowerupType, number>;
  usePowerup: (type: PowerupType) => boolean;
  addCoins: (amount: number) => void;
  isChallengeMode: boolean;
  gameMode: 'normal' | 'challenge' | 'betting';
}

interface FiveLeggedPantethalonGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

type GameStatus = 'waiting' | 'showing' | 'playing' | 'won' | 'lost';
const WIN_SEQUENCE_LENGTH = 5;
const PAD_COLORS = ['#34D399', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA'];

const FiveLeggedPantethalonGame: React.FC<FiveLeggedPantethalonGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, gameMode }) => {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [showJumpscare, setShowJumpscare] = useState(false);
  
  const statusRef = useRef(status);
  const sequenceRef = useRef(sequence);
  const playerInputRef = useRef(playerInput);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { playerInputRef.current = playerInput; }, [playerInput]);

  const handleWin = useCallback(() => {
    if (statusRef.current === 'won') return;
    setStatus('won');
    if (gameMode === 'challenge' || gameMode === 'betting') {
      onWin();
    } else {
      addCoins(50);
    }
  }, [gameMode, onWin, addCoins]);

  const resetGame = useCallback(() => {
    setStatus('waiting');
    setSequence([]);
    setPlayerInput([]);
    setActivePad(null);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setStatus('showing');
    setSequence([Math.floor(Math.random() * 5)]);
  }, [resetGame]);

  const handleLose = useCallback(() => {
    if (statusRef.current === 'lost' || statusRef.current === 'won' || showJumpscare) return;

    setShowJumpscare(true);
    setTimeout(() => {
      setShowJumpscare(false);

      if (powerups[PowerupType.PERMANENT_EXTRA_LIFE] > 0) {
        alert("You used your Permanent Extra Life!");
        startGame();
        return;
      }
      if (powerups.extraLife > 0 && usePowerup(PowerupType.EXTRA_LIFE)) {
        alert("You used an Extra Life!");
        startGame();
        return;
      }
      setStatus('lost');
      if (gameMode === 'challenge' || gameMode === 'betting') {
        onLose();
      }
    }, 700);
  }, [gameMode, onLose, powerups, usePowerup, startGame, showJumpscare]);

  useEffect(() => {
    if (status === 'showing' && sequence.length > 0) {
      let i = 0;
      const interval = setInterval(() => {
        setActivePad(sequence[i]);
        setTimeout(() => setActivePad(null), 400);
        i++;
        if (i >= sequence.length) {
          clearInterval(interval);
          setStatus('playing');
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [status, sequence]);

  const handlePlayerKeyPress = useCallback((padIndex: number) => {
    if (statusRef.current !== 'playing') return;

    setActivePad(padIndex);
    setTimeout(() => setActivePad(null), 200);

    const newPlayerInput = [...playerInputRef.current, padIndex];
    
    if (sequenceRef.current[newPlayerInput.length - 1] !== padIndex) {
      handleLose();
      return;
    }

    setPlayerInput(newPlayerInput);

    if (newPlayerInput.length === sequenceRef.current.length) {
      if (sequenceRef.current.length >= WIN_SEQUENCE_LENGTH) {
        handleWin();
      } else {
        setTimeout(() => {
          setStatus('showing');
          setPlayerInput([]);
          setSequence(prev => [...prev, Math.floor(Math.random() * 5)]);
        }, 1000);
      }
    }
  }, [handleLose, handleWin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = parseInt(e.key, 10);
      if (key >= 1 && key <= 5) {
        handlePlayerKeyPress(key - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayerKeyPress]);

  const getPadPosition = (index: number) => {
    const angle = (index / 5) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radius = 120;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return {
      top: `calc(50% + ${y}px)`,
      left: `calc(50% + ${x}px)`,
    };
  };

  return (
    <div className="w-full flex flex-col items-center p-4">
      {showJumpscare && <Jumpscare />}
      <h2 className="text-3xl font-bold mb-2 text-pink-400">5 Legged Pantethalon</h2>
      <p className="mb-4 text-gray-300">Memorize the sequence and repeat it. Use keys [1]-[5] or click the pads.</p>

      <div className="w-full h-[500px] bg-gray-800 border-4 border-gray-700 rounded-lg relative overflow-hidden flex flex-col items-center justify-center">
        {status === 'lost' && <BloodSplatter />}
        
        <div className="absolute top-4 left-4 text-white text-2xl font-bold">
            Round: {sequence.length || 1} / {WIN_SEQUENCE_LENGTH}
        </div>
        
        <div className="relative w-[300px] h-[300px]" style={{ perspective: '1000px' }}>
            <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg)' }}>
                {Array.from({ length: 5 }).map((_, i) => {
                    const isActive = activePad === i;
                    const position = getPadPosition(i);
                    return (
                        <button
                            key={i}
                            onClick={() => handlePlayerKeyPress(i)}
                            disabled={status !== 'playing'}
                            className="absolute w-24 h-24 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer disabled:cursor-not-allowed"
                            style={{
                                ...position,
                                backgroundColor: PAD_COLORS[i],
                                opacity: isActive ? 1 : 0.5,
                                transform: `translate(-50%, -50%) ${isActive ? 'scale(1.1) translateZ(10px)' : 'scale(1)'}`,
                                transition: 'all 0.2s ease-in-out',
                                boxShadow: isActive ? `0 0 40px 10px ${PAD_COLORS[i]}` : '0 10px 15px rgba(0,0,0,0.5)',
                            }}
                        >
                            <span className="text-4xl font-bold text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>{i + 1}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        {(status !== 'playing' && status !== 'showing') && gameMode === 'normal' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-30">
            <h3 className="text-5xl font-bold text-white">
                {status === 'won' && 'Excellent Memory! (+50 Coins)'}
                {status === 'lost' && 'Sequence Failed!'}
                {status === 'waiting' && 'Get Ready'}
            </h3>
            <button onClick={startGame} className="mt-4 px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold transition-transform hover:scale-105">
              {status === 'waiting' ? 'Start Game' : 'Play Again'}
            </button>
          </div>
        )}
      </div>
      <button onClick={onBackToLobby} className="mt-6 px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold transition-transform hover:scale-105">
        Back to Lobby
      </button>
      {powerups[PowerupType.SKIP_GAME] > 0 && (status === 'playing' || status === 'showing') && (
        <button
          onClick={() => {
            if (usePowerup(PowerupType.SKIP_GAME)) {
              handleWin();
            }
          }}
          className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white font-bold transition-transform hover:scale-105"
        >
          Skip Game ({powerups[PowerupType.SKIP_GAME]} left)
        </button>
      )}
    </div>
  );
};

export default FiveLeggedPantethalonGame;