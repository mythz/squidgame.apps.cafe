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
  tugOfWarStats: { wins: number; losses: number };
  recordTugOfWarWin: () => void;
  recordTugOfWarLoss: () => void;
}

interface TugOfWarGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';
const PULL_STRENGTH = 2; 

// Base AI Behavior Constants
const BASE_AI_PULL_STRENGTH_MIN = 3; 
const BASE_AI_PULL_STRENGTH_MAX = 4.5; 
const BASE_AI_PULL_DELAY_MIN = 70;
const BASE_AI_PULL_DELAY_MAX = 250;
const BASE_AI_FATIGUE_CHANCE = 0.05; 
const AI_FATIGUE_DELAY = 500; 

const Character: React.FC<{ team: 'player' | 'opponent'; isPulling: boolean }> = ({ team, isPulling }) => {
    const teamColor = team === 'player' ? 'bg-teal-400' : 'bg-red-500';
    const pullClass = isPulling ? 'scale-105 -translate-y-1' : 'scale-100 translate-y-0';
    
    return (
        <div className="flex flex-col items-center w-20" style={{ filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.4))' }}>
            <div className={`w-12 h-20 relative transition-transform duration-100 ease-in-out ${pullClass}`} >
                {/* Body */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 ${teamColor} rounded-md`}></div>
                {/* Head */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 ${team === 'player' ? 'bg-teal-200' : 'bg-red-200'} rounded-full`}>
                    {/* Eyes */}
                    <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-black rounded-full"></div>
                    <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-black rounded-full"></div>
                    {/* Mouth */}
                    <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 rounded-full border-2 border-black ${isPulling ? 'h-3 rounded-md' : ''}`}></div>
                </div>
                {/* Arms */}
                <div className={`absolute top-10 w-8 h-4 ${teamColor} border-2 border-gray-900 ${team === 'player' ? 'left-8 rotate-[-30deg]' : 'right-8 rotate-[30deg]'} transition-transform duration-100 ${isPulling ? (team === 'player' ? 'rotate-[-45deg]' : 'rotate-[45deg]') : ''}`}></div>
            </div>
            <div className={`font-bold mt-2 ${team === 'player' ? 'text-teal-400' : 'text-red-500'}`}>
                {team === 'player' ? 'YOU' : 'AI BOT'}
            </div>
        </div>
    );
};


const TugOfWarGame: React.FC<TugOfWarGameProps> = ({ onBackToLobby, powerups, usePowerup, addCoins, gameMode, onWin, onLose, tugOfWarStats, recordTugOfWarWin, recordTugOfWarLoss }) => {
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [ropePosition, setRopePosition] = useState(0); 
  const [isPlayerPulling, setIsPlayerPulling] = useState(false);
  const [isAiPulling, setIsAiPulling] = useState(false);
  const [shake, setShake] = useState(false);
  const [showJumpscare, setShowJumpscare] = useState(false);
  
  const aiTimeoutRef = useRef<number | null>(null);
  const playerPullTimeoutRef = useRef<number | null>(null);
  const statusRef = useRef(status);

  // --- Dynamic AI Difficulty ---
  const { wins = 0, losses = 0 } = tugOfWarStats || { wins: 0, losses: 0 };
  const winDifference = Math.max(-5, Math.min(10, wins - losses)); // Clamp difference

  const strengthModifier = winDifference * 0.1;
  const AI_PULL_STRENGTH_MIN = BASE_AI_PULL_STRENGTH_MIN + strengthModifier;
  const AI_PULL_STRENGTH_MAX = BASE_AI_PULL_STRENGTH_MAX + strengthModifier;

  const delayModifier = winDifference * 8;
  const AI_PULL_DELAY_MIN = Math.max(40, BASE_AI_PULL_DELAY_MIN - delayModifier);
  const AI_PULL_DELAY_MAX = Math.max(150, BASE_AI_PULL_DELAY_MAX - delayModifier);

  const fatigueModifier = winDifference * 0.004;
  const AI_FATIGUE_CHANCE = Math.max(0.01, BASE_AI_FATIGUE_CHANCE - fatigueModifier);
  // --- End Dynamic AI Difficulty ---

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  
  const handleWin = useCallback(() => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return;
    recordTugOfWarWin();
    setStatus('won');
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (gameMode === 'challenge' || gameMode === 'betting') {
      onWin();
    } else {
      addCoins(50);
    }
  }, [gameMode, onWin, addCoins, recordTugOfWarWin]);

  const resetGame = useCallback(() => {
    setStatus('waiting');
    setRopePosition(0);
    setIsPlayerPulling(false);
    setIsAiPulling(false);
    if(aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if(playerPullTimeoutRef.current) clearTimeout(playerPullTimeoutRef.current);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setStatus('playing');

    const aiPullLoop = () => {
        if (statusRef.current !== 'playing') return;

        setIsAiPulling(true);
        setTimeout(() => setIsAiPulling(false), 100);

        const currentPullStrength = AI_PULL_STRENGTH_MIN + Math.random() * (AI_PULL_STRENGTH_MAX - AI_PULL_STRENGTH_MIN);
        setRopePosition(prev => Math.max(-50, prev - currentPullStrength));
        
        let nextPullDelay = AI_PULL_DELAY_MIN + Math.random() * (AI_PULL_DELAY_MAX - AI_PULL_DELAY_MIN);

        if (Math.random() < AI_FATIGUE_CHANCE) {
            nextPullDelay += AI_FATIGUE_DELAY;
        }

        aiTimeoutRef.current = setTimeout(aiPullLoop, nextPullDelay);
    };
    
    aiTimeoutRef.current = setTimeout(aiPullLoop, AI_PULL_DELAY_MIN + Math.random() * (AI_PULL_DELAY_MAX - AI_PULL_DELAY_MIN));
  }, [resetGame, AI_PULL_STRENGTH_MIN, AI_PULL_STRENGTH_MAX, AI_PULL_DELAY_MIN, AI_PULL_DELAY_MAX, AI_FATIGUE_CHANCE]);

  const handleLose = useCallback(() => {
    if (statusRef.current === 'lost' || statusRef.current === 'won' || showJumpscare) return;
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

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
        recordTugOfWarLoss();
        setStatus('lost');
        if (gameMode === 'challenge' || gameMode === 'betting') {
          onLose();
        }
    }, 700);
  }, [powerups, usePowerup, gameMode, onLose, startGame, showJumpscare, recordTugOfWarLoss]);
  
  useEffect(() => {
    if (ropePosition <= -50 && statusRef.current === 'playing') {
      handleLose();
    }
  }, [ropePosition, handleLose]);

  const handlePlayerPull = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    setIsPlayerPulling(true);
    if (playerPullTimeoutRef.current) clearTimeout(playerPullTimeoutRef.current);
    playerPullTimeoutRef.current = window.setTimeout(() => setIsPlayerPulling(false), 100);

    setShake(true);
    setTimeout(() => setShake(false), 100);

    setRopePosition(prev => {
        const newPos = prev + PULL_STRENGTH;
        if(newPos >= 50) {
            handleWin();
            return 50;
        }
        return newPos;
    });
  }, [handleWin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        if (e.code === 'Space') {
            e.preventDefault();
            handlePlayerPull();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if(aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        if(playerPullTimeoutRef.current) clearTimeout(playerPullTimeoutRef.current);
    }
  }, [handlePlayerPull]);


  return (
    <div className="w-full flex flex-col items-center p-4">
      {showJumpscare && <Jumpscare />}
      <h2 className="text-3xl font-bold mb-2 text-pink-400">Tug of War</h2>
      <p className="mb-4 text-gray-300">Mash [SPACE] or the button to PULL!</p>
      
      <div className={`w-full h-80 bg-gray-800 border-4 border-gray-700 rounded-lg relative overflow-hidden flex flex-col justify-center items-center p-4 transition-transform duration-100 ${shake ? 'translate-x-1 -translate-y-1' : ''}`} style={{ perspective: '1000px' }}>
        
        <div className="w-full h-full flex flex-col justify-center items-center gap-4" style={{ transform: 'rotateX(30deg) scale(0.9)', transformStyle: 'preserve-3d' }}>
            {/* Ground Lines */}
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-600"></div>
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-24 bg-teal-500"></div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-24 bg-red-500"></div>


            {/* Teams Area */}
            <div className="w-[90%] flex justify-between items-end z-10">
               <Character team="player" isPulling={isPlayerPulling} />
               <Character team="opponent" isPulling={isAiPulling} />
            </div>

            {/* Rope */}
            <div className="w-full h-4 rounded-full flex items-center relative" style={{ 
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                backgroundImage: 'repeating-linear-gradient(45deg, #eab308, #eab308 10px, #ca8a04 10px, #ca8a04 20px)'
             }}>
              <div className="absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500" style={{left: '50%'}}></div>
              <div className="w-8 h-8 bg-pink-500 rounded-full absolute top-1/2 -translate-y-1/2" style={{
                  left: `calc(50% + ${ropePosition}%)`, 
                  transform: 'translate(-50%, -50%)', 
                  transition: 'left 0.1s linear',
                  filter: 'drop-shadow(0px 5px 4px rgba(0,0,0,0.5))'
              }}></div>
            </div>
            
            <div className="w-full flex justify-between items-center text-xs text-gray-400 px-2">
                <span>YOU WIN</span>
                <span className="text-center">CENTER</span>
                <span>AI WINS</span>
            </div>
        </div>

        {status === 'lost' && <BloodSplatter />}
        {(status === 'won' || status === 'lost' || status === 'waiting') && gameMode === 'normal' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
            <h3 className="text-5xl font-bold text-white">
                {status === 'won' && 'Victory! (+50 Coins)'}
                {status === 'lost' && 'Overpowered!'}
                {status === 'waiting' && 'Prepare to Pull!'}
            </h3>
            <button onClick={startGame} className="mt-4 px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold transition-transform hover:scale-105">
              {status === 'waiting' ? 'Start Game' : 'Play Again'}
            </button>
          </div>
        )}
      </div>

       <button onClick={handlePlayerPull} disabled={status !== 'playing'} className="mt-6 w-full max-w-sm px-6 py-4 bg-teal-500 hover:bg-teal-600 rounded-md text-white font-bold text-2xl transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed">
            PULL!
       </button>
       <button onClick={onBackToLobby} className="mt-4 px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold transition-transform hover:scale-105">
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

export default TugOfWarGame;