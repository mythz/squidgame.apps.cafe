import React, { useState, useEffect, useRef, useCallback } from 'react';
import BloodSplatter from './BloodSplatter';
import { PowerupType } from '../types';
import Jumpscare from './Jumpscare';

interface GameDataProps {
  powerups: Record<PowerupType, number>;
  usePowerup: (type: PowerupType) => boolean;
  addCoins: (amount: number) => void;
  isChallengeMode: boolean;
}

interface RedLightGreenLightGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

type GameStatus = 'waiting' | 'green' | 'red' | 'won' | 'lost';

const FINISH_LINE = 95;

const Doll: React.FC<{ isRedLight: boolean }> = ({ isRedLight }) => (
    <div className={`absolute top-1/2 -translate-y-1/2 right-4 w-8 h-16 md:w-12 md:h-24 bg-yellow-300 rounded-t-full rounded-b-lg border-4 border-black transition-transform duration-500`}
        style={{ 
            transform: `translateY(-50%) rotateY(${isRedLight ? '0deg' : '180deg'})`,
            filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.4))',
            transformStyle: 'preserve-3d' 
        }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-2 bg-pink-500 rounded-full"></div>
    </div>
);

const Player: React.FC<{ position: number }> = ({ position }) => (
    <div className="absolute bottom-4 w-6 h-10 md:w-8 md:h-12"
        style={{ 
            left: `${position}%`, 
            transition: 'left 0.1s linear',
            filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.4))',
            transform: 'translateZ(0)'
        }}>
        <div className="w-full h-1/3 bg-teal-200 rounded-full"></div>
        <div className="w-full h-2/3 bg-teal-400 rounded-b-md"></div>
    </div>
);

const RedLightGreenLightGame: React.FC<RedLightGreenLightGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, isChallengeMode }) => {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [position, setPosition] = useState(0);
  const [eliminationReason, setEliminationReason] = useState('');
  const [showJumpscare, setShowJumpscare] = useState(false);
  const movingRef = useRef(false);
  const gameIntervalRef = useRef<number | null>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleWin = useCallback(() => {
    setStatus('won');
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (isChallengeMode) {
      onWin();
    } else {
      addCoins(50);
    }
  }, [isChallengeMode, onWin, addCoins]);

  const resetGame = useCallback(() => {
    setStatus('waiting');
    setPosition(0);
    movingRef.current = false;
    setEliminationReason('');
    if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
    }
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setStatus('green');
    gameIntervalRef.current = window.setInterval(() => {
        setStatus(prev => {
            if (prev === 'green') {
                return 'red';
            } else {
                return 'green';
            }
        });
    }, Math.random() * 2000 + 2000);
  }, [resetGame]);

  const handleLose = useCallback((reason: string) => {
    if (statusRef.current === 'lost' || statusRef.current === 'won' || showJumpscare) return;

    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
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
        setEliminationReason(reason);
        if (isChallengeMode) {
          onLose();
        }
    }, 700);
  }, [isChallengeMode, onLose, powerups, usePowerup, startGame, showJumpscare]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        movingRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        movingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      if (statusRef.current === 'won' || statusRef.current === 'lost') {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      if (movingRef.current) {
          if (statusRef.current === 'green') {
              setPosition(p => {
                  const newPos = p + 0.5;
                  if (newPos >= FINISH_LINE) {
                      handleWin();
                      return FINISH_LINE;
                  }
                  return newPos;
              });
          } else if (statusRef.current === 'red') {
              handleLose('Moved on Red Light!');
          } else if (statusRef.current === 'waiting') {
              handleLose('Moved before start!');
          }
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [handleWin, handleLose]);


  return (
    <div className="w-full flex flex-col items-center p-4">
      {showJumpscare && <Jumpscare />}
      <h2 className="text-3xl font-bold mb-2 text-pink-400">Red Light, Green Light</h2>
      <p className="mb-4 text-gray-300 text-center">Press and hold the RUN button or [SPACE] / [→] to move. Freeze on RED LIGHT!</p>
      
      <div className="w-full h-80 bg-gray-800 border-4 border-gray-700 rounded-lg relative overflow-hidden" style={{ perspective: '600px' }}>
        <div className="absolute inset-0" style={{ 
            transform: 'rotateX(75deg) scale(1.5)', 
            transformOrigin: 'bottom',
            background: 'radial-gradient(circle at 50% 0, rgba(245, 222, 179, 0.2), transparent 70%), #4a3f35',
            backgroundImage: `
              radial-gradient(circle at 50% -200%, rgba(255, 255, 255, 0.3) 0%, transparent 40%),
              linear-gradient(90deg, #3a322a 50%, #4a3f35 50%)
            `,
            backgroundSize: '100% 100%, 8px 8px',
        }}>
            <div className="absolute -top-px w-full h-4 bg-red-500 font-bold text-center text-white text-xs leading-4 flex items-center justify-center">FINISH</div>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{boxShadow: 'inset 0px 0px 40px 20px rgba(0,0,0,0.5)'}}></div>


        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-white font-bold text-2xl transition-colors duration-300 ${status === 'green' ? 'bg-green-500' : 'bg-red-500'}`}>
            {status === 'green' ? 'GREEN LIGHT' : 'RED LIGHT'}
        </div>
        
        <Doll isRedLight={status === 'red'} />
        <Player position={position} />
        {status === 'lost' && <BloodSplatter />}

        {(status === 'won' || status === 'lost' || status === 'waiting') && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
            <h3 className="text-5xl font-bold text-white">
                {status === 'won' && `You Survived! (+50 Coins)`}
                {status === 'lost' && 'Eliminated!'}
                {status === 'waiting' && 'Get Ready'}
            </h3>
            {status === 'lost' && <p className="text-red-400 mt-2">{eliminationReason}</p>}
            <button onClick={startGame} className="mt-4 px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold transition-transform hover:scale-105 animate-pulse-button">
              {status === 'waiting' ? 'Start Game' : 'Play Again'}
            </button>
          </div>
        )}
      </div>
      <button 
        onMouseDown={() => { if (status === 'green' || status === 'red') movingRef.current = true; }}
        onMouseUp={() => movingRef.current = false}
        onMouseLeave={() => movingRef.current = false}
        onTouchStart={(e) => { e.preventDefault(); if (status === 'green' || status === 'red') movingRef.current = true; }}
        onTouchEnd={(e) => { e.preventDefault(); movingRef.current = false; }}
        disabled={status !== 'green' && status !== 'red'}
        className="mt-6 w-full max-w-sm px-6 py-4 bg-teal-500 hover:bg-teal-600 rounded-md text-white font-bold text-2xl transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed select-none"
      >
          RUN
      </button>

       <button onClick={onBackToLobby} className="mt-4 px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold transition-transform hover:scale-105">
        Back to Lobby
      </button>
       {powerups[PowerupType.SKIP_GAME] > 0 && (status === 'green' || status === 'red') && (
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

export default RedLightGreenLightGame;