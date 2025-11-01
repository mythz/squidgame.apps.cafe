import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface SkySquidGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const GRAVITY = 0.3;
const FLAP_STRENGTH = -6;
const OBSTACLE_WIDTH = 80;
const OBSTACLE_GAP = 150;
const OBSTACLE_INTERVAL = 200; // pixels between obstacles
const SQUID_WIDTH = 50;
const SQUID_HEIGHT = 30;
const WIN_SCORE = 10;
const HORIZONTAL_SPEED = 2.4;

type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';
type Obstacle = {
  x: number;
  gapY: number;
  // FIX: Added 'passed' property to Obstacle type to track if the player has cleared it.
  passed: boolean;
};

const SkySquidGame: React.FC<SkySquidGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, gameMode }) => {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [squidPosition, setSquidPosition] = useState({ y: GAME_HEIGHT / 2 });
  const [squidVelocity, setSquidVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [showJumpscare, setShowJumpscare] = useState(false);
  
  const gameLoopRef = useRef<number | null>(null);
  const gameStatusRef = useRef(status);

  useEffect(() => {
    gameStatusRef.current = status;
  }, [status]);

  const handleWin = useCallback(() => {
    if (gameStatusRef.current === 'won') return;
    setStatus('won');
    if (gameMode === 'challenge' || gameMode === 'betting') {
      onWin();
    } else {
      addCoins(50);
    }
  }, [gameMode, onWin, addCoins]);

  const resetGame = useCallback(() => {
    setStatus('waiting');
    setSquidPosition({ y: GAME_HEIGHT / 2 });
    setSquidVelocity(0);
    setObstacles([]);
    setScore(0);
  }, []);
  
  const startGame = useCallback(() => {
    resetGame();
    // FIX: Initialized obstacles with 'passed: false' to align with the updated Obstacle type.
    setObstacles([
      { x: GAME_WIDTH, gapY: Math.random() * (GAME_HEIGHT - OBSTACLE_GAP - 100) + 50, passed: false },
      { x: GAME_WIDTH + OBSTACLE_INTERVAL + OBSTACLE_WIDTH, gapY: Math.random() * (GAME_HEIGHT - OBSTACLE_GAP - 100) + 50, passed: false },
      { x: GAME_WIDTH + (OBSTACLE_INTERVAL + OBSTACLE_WIDTH) * 2, gapY: Math.random() * (GAME_HEIGHT - OBSTACLE_GAP - 100) + 50, passed: false },
    ]);
    setStatus('playing');
  }, [resetGame]);

  const handleLose = useCallback(() => {
    if (gameStatusRef.current === 'lost' || gameStatusRef.current === 'won' || showJumpscare) return;

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

  const flap = useCallback(() => {
    if (gameStatusRef.current === 'playing') {
      setSquidVelocity(FLAP_STRENGTH);
    }
  }, []);
  
  useEffect(() => {
    const handleAction = (e: MouseEvent | KeyboardEvent) => {
      e.preventDefault();
      if ((e instanceof KeyboardEvent && e.code === 'Space') || e instanceof MouseEvent) {
        if (gameStatusRef.current === 'playing') {
          flap();
        } else if (gameStatusRef.current === 'waiting') {
          startGame();
        }
      }
    };
    
    document.addEventListener('keydown', handleAction);
    document.addEventListener('mousedown', handleAction);
    return () => {
      document.removeEventListener('keydown', handleAction);
      document.removeEventListener('mousedown', handleAction);
    };
  }, [flap, startGame]);

  const gameLoop = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;

    setSquidVelocity(v => v + GRAVITY);
    let collision = false;
    setSquidPosition(pos => {
      const newY = pos.y + squidVelocity;
      if (newY <= 0 || newY >= GAME_HEIGHT - SQUID_HEIGHT) {
        collision = true;
      }
      return { y: newY };
    });

    // FIX: Corrected obstacle update logic to prevent multiple score increments for the same obstacle.
    setObstacles(prevObstacles => {
      const newObstacles = prevObstacles.map(obs => ({ ...obs, x: obs.x - HORIZONTAL_SPEED }));
      
      if (newObstacles.length > 0 && newObstacles[0].x < GAME_WIDTH * 0.2 - OBSTACLE_WIDTH) {
          if (!newObstacles[0].passed) {
              setScore(s => s + 1);
              newObstacles[0].passed = true;
          }
      }

      if (newObstacles.length > 0 && newObstacles[0].x < -OBSTACLE_WIDTH) {
          newObstacles.shift();
          const lastObstacle = newObstacles[newObstacles.length - 1];
          newObstacles.push({
              x: lastObstacle.x + OBSTACLE_INTERVAL + OBSTACLE_WIDTH,
              gapY: Math.random() * (GAME_HEIGHT - OBSTACLE_GAP - 100) + 50,
              passed: false,
          });
      }
      return newObstacles;
    });

    const squidX = GAME_WIDTH * 0.2;
    for (const obs of obstacles) {
      if (
        squidX + SQUID_WIDTH > obs.x &&
        squidX < obs.x + OBSTACLE_WIDTH &&
        (squidPosition.y < obs.gapY || squidPosition.y + SQUID_HEIGHT > obs.gapY + OBSTACLE_GAP)
      ) {
        collision = true;
        break;
      }
    }

    if (collision) {
      handleLose();
    } else {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [squidVelocity, squidPosition.y, obstacles, handleLose]);
  
  useEffect(() => {
      if (score >= WIN_SCORE) {
          handleWin();
      }
  }, [score, handleWin]);

  useEffect(() => {
    if (status === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [status, gameLoop]);
  

  return (
    <div className="w-full flex flex-col items-center p-4">
      {showJumpscare && <Jumpscare />}
      <h2 className="text-3xl font-bold mb-2 text-pink-400">Sky Squid</h2>
      <p className="mb-4 text-gray-300">Use [SPACE] or Click to flap. Survive {WIN_SCORE} obstacles!</p>
      
      <div className="w-full h-[500px] bg-gray-900 border-4 border-gray-700 rounded-lg relative overflow-hidden" style={{
        backgroundImage: 'linear-gradient(to bottom, #0c0a18, #302b63, #24243e)',
      }}>
        <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 70px)'
        }}></div>

        <div style={{ width: '100%', height: GAME_HEIGHT, position: 'relative', overflow: 'hidden' }} className="mx-auto">
          <div className="absolute w-[50px] h-[30px] bg-pink-500 rounded-t-full rounded-b-md" style={{
            left: `${GAME_WIDTH * 0.2}px`,
            top: `${squidPosition.y}px`,
            transition: 'transform 0.1s',
            transform: `rotate(${squidVelocity * 3}deg)`,
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
          }}>
            <div className="absolute top-2 left-3 w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute top-2 right-3 w-2 h-2 bg-white rounded-full"></div>
          </div>

          {obstacles.map((obs, i) => (
            <div key={i} className="absolute" style={{ left: `${obs.x}px`, top: 0, width: `${OBSTACLE_WIDTH}px`, height: '100%'}}>
              <div className="absolute top-0 w-full bg-green-700 border-2 border-green-900 rounded-b-lg" style={{ height: `${obs.gapY}px`, backgroundImage: 'linear-gradient(to right, #15803d, #16a34a)' }}></div>
              <div className="absolute bottom-0 w-full bg-green-700 border-2 border-green-900 rounded-t-lg" style={{ height: `${GAME_HEIGHT - obs.gapY - OBSTACLE_GAP}px`, backgroundImage: 'linear-gradient(to right, #15803d, #16a34a)' }}></div>
            </div>
          ))}
          
           <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-4xl font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
            {score} / {WIN_SCORE}
           </div>

        </div>

        {status === 'lost' && <BloodSplatter />}
        {(status !== 'playing') && gameMode === 'normal' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-30">
            <h3 className="text-5xl font-bold text-white">
                {status === 'won' && `You Survived! (+50 Coins)`}
                {status === 'lost' && 'Eliminated!'}
                {status === 'waiting' && 'Sky Squid'}
            </h3>
            <p className="text-lg text-gray-300 mt-2">
                {status === 'won' ? `You cleared all ${WIN_SCORE} obstacles!` : status === 'lost' ? `You cleared ${score} of ${WIN_SCORE} obstacles.` : 'Click or press Space to start'}
            </p>
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

export default SkySquidGame;