import React, { useState, useEffect, useCallback, useRef } from 'react';
import BloodSplatter from './BloodSplatter';
import { PowerupType } from '../types';
import Jumpscare from './Jumpscare';

interface GameDataProps {
  powerups: Record<PowerupType, number>;
  usePowerup: (type: PowerupType) => boolean;
  addCoins: (amount: number) => void;
  isChallengeMode: boolean;
}

interface GlassBridgeGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';
type PanelChoice = 'left' | 'right';
type PanelState = {
  choice: PanelChoice;
  status: 'pending' | 'safe' | 'broken';
};

const BRIDGE_LENGTH = 8;
const GAME_DURATION = 30; // seconds

const GlassBridgeGame: React.FC<GlassBridgeGameProps> = ({ onBackToLobby, powerups, usePowerup, addCoins, isChallengeMode, onWin, onLose }) => {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [safePath, setSafePath] = useState<PanelChoice[]>([]);
  const [playerChoices, setPlayerChoices] = useState<PanelState[]>([]);
  const [playerRow, setPlayerRow] = useState(-1);
  const [showJumpscare, setShowJumpscare] = useState(false);

  const timerRef = useRef<number | null>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  
  const handleWin = useCallback(() => {
    if (statusRef.current === 'won') return;
    setStatus('won');
    if (timerRef.current) clearInterval(timerRef.current);
    if (isChallengeMode) {
        onWin();
    } else {
        addCoins(50);
    }
  }, [addCoins, isChallengeMode, onWin]);

  const generateSafePath = () => {
    return Array.from({ length: BRIDGE_LENGTH }, () => (Math.random() < 0.5 ? 'left' : 'right'));
  };
  
  const resetGame = useCallback(() => {
    setTimeLeft(GAME_DURATION);
    setPlayerChoices([]);
    setPlayerRow(-1);
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('waiting');
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setSafePath(generateSafePath());
    setPlayerRow(0);
    setStatus('playing');
  }, [resetGame]);

  const handleLose = useCallback(() => {
    if (statusRef.current === 'lost' || statusRef.current === 'won' || showJumpscare) return;

    if (timerRef.current) clearInterval(timerRef.current);
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
        if (isChallengeMode) {
            onLose();
        }
    }, 700);
  }, [powerups, usePowerup, startGame, isChallengeMode, onLose, showJumpscare]);

  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleLose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, handleLose]);

  const handlePanelClick = useCallback((choice: PanelChoice) => {
    if (statusRef.current !== 'playing' || playerRow >= BRIDGE_LENGTH) return;
    
    // Prevent clicking on non-current rows
    if (playerChoices.length !== playerRow) return;

    const isSafe = safePath[playerRow] === choice;
    const newChoices = [...playerChoices];
    newChoices[playerRow] = { choice, status: isSafe ? 'safe' : 'broken' };
    setPlayerChoices(newChoices);

    if (isSafe) {
      if (playerRow === BRIDGE_LENGTH - 1) {
        handleWin();
      } else {
        setPlayerRow(prev => prev + 1);
      }
    } else {
      handleLose();
    }
  }, [playerRow, safePath, playerChoices, handleWin, handleLose]);


  return (
    <div className="w-full flex flex-col items-center p-4">
      {showJumpscare && <Jumpscare />}
      <h2 className="text-3xl font-bold mb-2 text-pink-400">Glass Bridge</h2>
      <p className="mb-4 text-gray-300">Click a glowing panel to jump. Choose the safe path!</p>

      <div className="w-full h-[500px] bg-gray-900 border-4 border-gray-700 rounded-lg relative overflow-hidden flex flex-col items-center justify-end p-4">
        {status === 'lost' && <BloodSplatter />}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>

        <div className="w-full h-full" style={{ perspective: '800px' }}>
          <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: 'translateY(10%) rotateX(60deg) scale(0.8)' }}>
            {/* Bridge Structure */}
            <div className="absolute top-0 left-1/4 -translate-x-1/2 w-4 h-full bg-gray-600 rounded-full" style={{transform: 'translateZ(-5px)'}}></div>
            <div className="absolute top-0 right-1/4 translate-x-1/2 w-4 h-full bg-gray-600 rounded-full" style={{transform: 'translateZ(-5px)'}}></div>
            
            {Array.from({ length: BRIDGE_LENGTH }).map((_, rowIndex) => {
              const rowChoice = playerChoices[rowIndex];
              const isCurrentRow = rowIndex === playerRow;
              const isGlow = status === 'playing' && isCurrentRow;

              return (
                <div
                  key={rowIndex}
                  className="absolute w-full flex justify-center"
                  style={{
                    top: `${(BRIDGE_LENGTH - 1 - rowIndex) * 12.5}%`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Left Panel */}
                  <button
                    onClick={() => handlePanelClick('left')}
                    disabled={!isCurrentRow || status !== 'playing'}
                    className={`w-1/3 h-24 rounded-lg border-2 border-transparent ${
                      rowChoice?.choice === 'left' && rowChoice.status === 'broken'
                        ? 'bg-red-500/50 animate-shatter'
                        : `transition-all duration-300 ${
                            rowChoice?.choice === 'left' && rowChoice.status === 'safe'
                              ? 'bg-green-500/50 opacity-100'
                              : `bg-white/10 ${
                                  isGlow
                                    ? 'cursor-pointer hover:bg-cyan-300/30 animate-pulse-glow'
                                    : 'cursor-not-allowed'
                                }`
                          }`
                    }`}
                    style={{
                        marginRight: '2%',
                        boxShadow: 'inset 0px 2px 10px rgba(255, 255, 255, 0.2)'
                    }}
                  ></button>
                  {/* Right Panel */}
                  <button
                    onClick={() => handlePanelClick('right')}
                    disabled={!isCurrentRow || status !== 'playing'}
                    className={`w-1/3 h-24 rounded-lg border-2 border-transparent ${
                      rowChoice?.choice === 'right' && rowChoice.status === 'broken'
                        ? 'bg-red-500/50 animate-shatter'
                        : `transition-all duration-300 ${
                            rowChoice?.choice === 'right' && rowChoice.status === 'safe'
                              ? 'bg-green-500/50 opacity-100'
                              : `bg-white/10 ${
                                  isGlow
                                    ? 'cursor-pointer hover:bg-cyan-300/30 animate-pulse-glow'
                                    : 'cursor-not-allowed'
                                }`
                          }`
                    }`}
                     style={{
                        marginLeft: '2%',
                        boxShadow: 'inset 0px 2px 10px rgba(255, 255, 255, 0.2)'
                    }}
                  ></button>
                </div>
              );
            })}
             {/* Player Character */}
            {(status !== 'lost' && playerRow >= 0 && playerRow < BRIDGE_LENGTH) &&
                <div className="absolute w-8 h-12 transition-all duration-300"
                    style={{
                        left: '50%',
                        top: `${(BRIDGE_LENGTH - 1 - playerRow) * 12.5 + 4}%`,
                        transform: 'translateX(-50%)',
                        zIndex: 50
                    }}>
                    <div className="w-full h-1/3 bg-teal-200 rounded-full"></div>
                    <div className="w-full h-2/3 bg-teal-400 rounded-b-md"></div>
                </div>
            }
          </div>
        </div>

        {status === 'playing' && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white font-bold text-2xl z-20">
                Time: {timeLeft}
            </div>
        )}

        {(status === 'waiting' || status === 'lost' || status === 'won') && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-30">
            <h3 className="text-5xl font-bold text-white">
                {status === 'won' && 'You Made It Across! (+50 Coins)'}
                {status === 'lost' && (timeLeft === 0 ? "Time's Up!" : "Eliminated!")}
                {status === 'waiting' && 'The Glass Bridge'}
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
      {powerups[PowerupType.SKIP_GAME] > 0 && status === 'playing' && (
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

export default GlassBridgeGame;