import React, { useState, useEffect, useRef, useCallback } from 'react';
import BloodSplatter from './BloodSplatter';
import { PowerupType } from '../types';
import Jumpscare from './Jumpscare';

// Props
interface GameDataProps {
  powerups: Record<PowerupType, number>;
  usePowerup: (type: PowerupType) => boolean;
  addCoins: (amount: number) => void;
  isChallengeMode: boolean;
  gameMode: 'normal' | 'challenge' | 'betting';
}

interface SquidGameGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

// Game Constants
const PLAYER_SPEED = 0.65; // Slower player
const GUARD_SPEED = 0.5; // Slower waist guard
const GUARD_PATROL_Y = 48; // "Waist" of the squid
const GUARD_PATROL_MIN_X = 38;
const GUARD_PATROL_MAX_X = 62;

const GUARD2_SPEED = 0.4; // Speed of the new vertical guard
const GUARD2_PATROL_X = 50;
const GUARD2_PATROL_MIN_Y = 55;
const GUARD2_PATROL_MAX_Y = 75;

const WIN_ZONE = { x: 50, y: 18, radius: 14 };

// Court boundaries (simplified for collision)
const BOUNDARIES = [
    { type: 'trapezoid', y1: 32, y2: 50, x1_top: 50, w_top: 0, x1_bottom: 38, w_bottom: 24 }, // Neck
    { type: 'rect', y: 50, h: 30, x: 38, w: 24 }, // Body
    { type: 'trapezoid', y1: 80, y2: 95, x1_top: 38, w_top: 24, x1_bottom: 25, w_bottom: 50 }, // Legs
];

// Helper function to check if a point is within the boundaries
const isPlayerInBounds = (pos: { x: number, y: number }) => {
    // Win zone is a valid place to be
    if (Math.hypot(pos.x - WIN_ZONE.x, pos.y - WIN_ZONE.y) <= WIN_ZONE.radius) return true;

    // Head circle
    if (pos.y < 32) {
        return Math.hypot(pos.x - 50, pos.y - 18) <= 14;
    }

    // Check main body polygons
    for (const bound of BOUNDARIES) {
        if (bound.type === 'rect' && pos.y >= bound.y && pos.y <= bound.y + bound.h) {
            if (pos.x >= bound.x && pos.x <= bound.x + bound.w) return true;
        }
        if (bound.type === 'trapezoid' && pos.y >= bound.y1 && pos.y <= bound.y2) {
            const progress = (pos.y - bound.y1) / (bound.y2 - bound.y1);
            const current_x1 = bound.x1_top + (bound.x1_bottom - bound.x1_top) * progress;
            const current_w = bound.w_top + (bound.w_bottom - bound.w_top) * progress;
            if (pos.x >= current_x1 && pos.x <= current_x1 + current_w) return true;
        }
    }

    return false; // Not in any valid zone
}

const Player: React.FC<{ pos: { x: number, y: number } }> = ({ pos }) => (
    <div className="absolute w-8 h-12" style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.5))'
    }}>
        <div className="w-full h-1/3 bg-teal-200 rounded-full"></div>
        <div className="w-full h-2/3 bg-teal-400 rounded-b-md"></div>
    </div>
);

const Guard: React.FC<{ pos: { x: number, y: number } }> = ({ pos }) => (
    <div className="absolute w-8 h-12" style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 40,
        filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.5))'
    }}>
        <div className="w-full h-1/3 bg-pink-300 rounded-full"></div>
        <div className="w-full h-2/3 bg-pink-600 rounded-b-md"></div>
    </div>
);


const SquidGameGame: React.FC<SquidGameGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, gameMode }) => {
    const [status, setStatus] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
    const [playerPosition, setPlayerPosition] = useState({ x: 50, y: 90 });
    const [guardPosition, setGuardPosition] = useState({ x: GUARD_PATROL_MIN_X, y: GUARD_PATROL_Y, dir: 1 });
    const [guard2Position, setGuard2Position] = useState({ x: GUARD2_PATROL_X, y: GUARD2_PATROL_MAX_Y, dir: -1 });
    const [showJumpscare, setShowJumpscare] = useState(false);
    const [eliminationReason, setEliminationReason] = useState('');

    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const gameLoopRef = useRef<number | null>(null);
    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const handleWin = useCallback(() => {
        if (statusRef.current === 'won' || statusRef.current === 'lost') return;
        setStatus('won');
        if (gameMode === 'challenge' || gameMode === 'betting') {
            onWin();
        } else {
            addCoins(150); // Final game, more coins
        }
    }, [gameMode, onWin, addCoins]);
    
    const resetGame = useCallback(() => {
        setPlayerPosition({ x: 50, y: 90 });
        setGuardPosition({ x: GUARD_PATROL_MIN_X, y: GUARD_PATROL_Y, dir: 1 });
        setGuard2Position({ x: GUARD2_PATROL_X, y: GUARD2_PATROL_MAX_Y, dir: -1 });
        setStatus('waiting');
    }, []);

    const startGame = useCallback(() => {
        resetGame();
        setStatus('playing');
    }, [resetGame]);

    const handleLose = useCallback((reason: 'caught' | 'bounds') => {
        if (statusRef.current === 'lost' || statusRef.current === 'won' || showJumpscare) return;
        setEliminationReason(reason === 'caught' ? 'You were caught by the guard!' : 'You went off the court!');
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
    }, [gameMode, onLose, powerups, usePowerup, showJumpscare, startGame]);


    const gameLoop = useCallback(() => {
        if (statusRef.current !== 'playing') return;

        // Player movement
        setPlayerPosition(prev => {
            let { x, y } = prev;
            if (keysPressed.current['w'] || keysPressed.current['arrowup']) y -= PLAYER_SPEED;
            if (keysPressed.current['s'] || keysPressed.current['arrowdown']) y += PLAYER_SPEED;
            if (keysPressed.current['a'] || keysPressed.current['arrowleft']) x -= PLAYER_SPEED;
            if (keysPressed.current['d'] || keysPressed.current['arrowright']) x += PLAYER_SPEED;
            
            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));

            return { x, y };
        });

        // Guard 1 movement
        setGuardPosition(prev => {
            let newX = prev.x + (GUARD_SPEED * prev.dir);
            let newDir = prev.dir;
            if (newX > GUARD_PATROL_MAX_X) { newX = GUARD_PATROL_MAX_X; newDir = -1; }
            if (newX < GUARD_PATROL_MIN_X) { newX = GUARD_PATROL_MIN_X; newDir = 1; }
            return { ...prev, x: newX, dir: newDir };
        });

        // Guard 2 movement (vertical)
        setGuard2Position(prev => {
            let newY = prev.y + (GUARD2_SPEED * prev.dir);
            let newDir = prev.dir;
            if (newY > GUARD2_PATROL_MAX_Y) { newY = GUARD2_PATROL_MAX_Y; newDir = -1; }
            if (newY < GUARD2_PATROL_MIN_Y) { newY = GUARD2_PATROL_MIN_Y; newDir = 1; }
            return { ...prev, y: newY, dir: newDir };
        });

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, []);

    // Logic checks (win/lose)
    useEffect(() => {
        if (status !== 'playing') return;

        // Win condition
        const distToWin = Math.hypot(playerPosition.x - WIN_ZONE.x, playerPosition.y - WIN_ZONE.y);
        if (distToWin <= WIN_ZONE.radius / 2) { // smaller radius for win trigger
            handleWin();
            return;
        }

        // Lose condition: out of bounds
        if (!isPlayerInBounds(playerPosition)) {
            handleLose('bounds');
            return;
        }

        // Lose condition: caught by guards
        const guardHitbox = { w: 4, h: 6 }; // % units
        if (
            (Math.abs(playerPosition.x - guardPosition.x) < guardHitbox.w &&
            Math.abs(playerPosition.y - guardPosition.y) < guardHitbox.h) ||
            (Math.abs(playerPosition.x - guard2Position.x) < guardHitbox.w &&
            Math.abs(playerPosition.y - guard2Position.y) < guardHitbox.h)
        ) {
            handleLose('caught');
            return;
        }
    }, [playerPosition, guardPosition, guard2Position, status, handleWin, handleLose]);

    useEffect(() => {
        if (status === 'playing') {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [status, gameLoop]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div className="w-full flex flex-col items-center p-4">
            {showJumpscare && <Jumpscare />}
            <h2 className="text-3xl font-bold mb-2 text-pink-400">Squid Game</h2>
            <p className="mb-4 text-gray-300">Use [WASD] or [ARROWS]. Reach the squid's head without being caught or going off the court.</p>

            <div className="w-full h-[600px] bg-gray-800 border-4 border-gray-700 rounded-lg relative overflow-hidden flex flex-col items-center justify-center p-4">
                 <div className="w-full h-full relative" style={{ transform: 'scale(0.8)' }}>
                    {/* Court SVG */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        <path d="M50 32 L38 50 L62 50 Z" stroke="#A78BFA" strokeWidth="1" fill="#1F2937" />
                        <rect x="38" y="50" width="24" height="30" stroke="#A78BFA" strokeWidth="1" fill="#1F2937" />
                        <path d="M38 80 L25 95 L50 80 L75 95 L62 80" stroke="#A78BFA" strokeWidth="1" fill="#1F2937" />
                        <circle cx="50" cy="18" r="14" stroke="#A78BFA" strokeWidth="1" fill="#1F2937" />
                        <circle cx="50" cy="18" r="4" fill="#34D399" />
                    </svg>
                    
                    <Player pos={playerPosition} />
                    <Guard pos={guardPosition} />
                    <Guard pos={guard2Position} />
                 </div>
                 
                {status === 'lost' && <BloodSplatter />}
                {(status !== 'playing') && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
                        <h3 className="text-5xl font-bold text-white">
                            {status === 'won' && 'You Are The Winner! (+150 Coins)'}
                            {status === 'lost' && 'Eliminated!'}
                            {status === 'waiting' && 'The Final Game'}
                        </h3>
                        {status === 'lost' && <p className="text-red-400 mt-2">{eliminationReason}</p>}
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
                <button onClick={() => { if (usePowerup(PowerupType.SKIP_GAME)) { handleWin(); } }}
                    className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white font-bold transition-transform hover:scale-105">
                    Skip Game ({powerups[PowerupType.SKIP_GAME]} left)
                </button>
            )}
        </div>
    );
};

export default SquidGameGame;