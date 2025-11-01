import React, { useState, useEffect, useRef, useCallback } from 'react';
import BloodSplatter from './BloodSplatter';
import { PowerupType } from '../types';
import Jumpscare from './Jumpscare';

// Props interface
interface GameDataProps {
  powerups: Record<PowerupType, number>;
  usePowerup: (type: PowerupType) => boolean;
  addCoins: (amount: number) => void;
  isChallengeMode: boolean;
  gameMode: 'normal' | 'challenge' | 'betting';
}

interface JumpRopeGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

// Game constants
const WIN_SCORE = 20;
const INITIAL_ROPE_SPEED = 1.5;
const SPEED_INCREASE_INTERVAL = 5; // Increase speed every 5 jumps
const SPEED_INCREASE_AMOUNT = 0.25;
const JUMP_WINDOW_START = 75;
const JUMP_WINDOW_END = 95;
const JUMP_DURATION = 300; // ms

type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';

const Player: React.FC<{ isJumping: boolean }> = ({ isJumping }) => (
    <div
        className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-12 h-20 z-20 transition-transform duration-150 ease-out"
        style={{ transform: `translateX(-50%) ${isJumping ? 'translateY(-40px)' : 'translateY(0px)'}` }}
    >
        {/* Shadow */}
        <div 
            className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full transition-transform duration-150 ease-out"
            style={{ transform: `translateX(-50%) ${isJumping ? 'scale(0.6)' : 'scale(1)'}` }}
        />
        {/* Body */}
        <div className="absolute w-full h-full" style={{ filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.3))' }}>
            <div className="w-full h-1/3 bg-teal-200 rounded-full"></div>
            <div className="w-full h-2/3 bg-teal-400 rounded-b-md"></div>
        </div>
    </div>
);

const Rope: React.FC<{ progress: number }> = ({ progress }) => {
    // progress is 0 to 100
    const scale = 0.2 + (progress / 100) * 1.5;
    const yPos = -50 + progress * 1.2;
    const zIndex = progress > 60 ? 30 : 10;
    const opacity = 0.5 + (progress / 100) * 0.5;

    return (
        <div
            className="absolute left-0 w-full h-4 bg-yellow-600 rounded-full"
            style={{
                top: `${yPos}%`,
                transform: `scaleX(${scale})`,
                zIndex,
                opacity,
                filter: `drop-shadow(0px ${5 + progress / 5}px 5px rgba(0,0,0,0.5))`,
            }}
        />
    );
};

const JumpRopeGame: React.FC<JumpRopeGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, gameMode }) => {
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [score, setScore] = useState(0);
    const [ropeProgress, setRopeProgress] = useState(0);
    const [isJumping, setIsJumping] = useState(false);
    const [showJumpscare, setShowJumpscare] = useState(false);

    const gameLoopRef = useRef<number | null>(null);
    const statusRef = useRef(status);
    const ropeSpeedRef = useRef(INITIAL_ROPE_SPEED);
    const jumpTimeoutRef = useRef<number | null>(null);
    const jumpedThisCycleRef = useRef(false);

    useEffect(() => { statusRef.current = status; }, [status]);

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
        setScore(0);
        setRopeProgress(0);
        setIsJumping(false);
        ropeSpeedRef.current = INITIAL_ROPE_SPEED;
        jumpedThisCycleRef.current = false;
        if(jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
    }, []);

    const startGame = useCallback(() => {
        resetGame();
        setStatus('playing');
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

    const handleJump = useCallback(() => {
        if (statusRef.current !== 'playing' || isJumping) return;

        setIsJumping(true);
        jumpedThisCycleRef.current = true;
        if(jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
        jumpTimeoutRef.current = window.setTimeout(() => setIsJumping(false), JUMP_DURATION);
    }, [isJumping]);
    
    const gameLoop = useCallback(() => {
        if (statusRef.current !== 'playing') return;

        setRopeProgress(prev => {
            const newProgress = prev + ropeSpeedRef.current;
            
            if (newProgress >= JUMP_WINDOW_START && newProgress <= JUMP_WINDOW_END) {
                // Rope is in the jump zone
                if (!jumpedThisCycleRef.current) {
                    // Player has not jumped yet in this window. They can still jump.
                }
            } else if (newProgress > JUMP_WINDOW_END && newProgress < JUMP_WINDOW_END + ropeSpeedRef.current) {
                // Rope just passed the jump zone
                if (!jumpedThisCycleRef.current) {
                    handleLose();
                } else {
                    // Successful jump
                    setScore(s => {
                        const newScore = s + 1;
                        if (newScore % SPEED_INCREASE_INTERVAL === 0) {
                            ropeSpeedRef.current += SPEED_INCREASE_AMOUNT;
                        }
                        if (newScore >= WIN_SCORE) {
                            handleWin();
                        }
                        return newScore;
                    });
                }
            }

            if (newProgress >= 100) {
                jumpedThisCycleRef.current = false;
                return 0; // Reset cycle
            }
            return newProgress;
        });

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [handleLose, handleWin]);

    useEffect(() => {
        if (status === 'playing') {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [status, gameLoop]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleJump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleJump]);
    
    return (
        <div className="w-full flex flex-col items-center p-4">
            {showJumpscare && <Jumpscare />}
            <h2 className="text-3xl font-bold mb-2 text-pink-400">Jump Rope</h2>
            <p className="mb-4 text-gray-300">Click or Press [SPACEBAR] to jump. Survive {WIN_SCORE} jumps!</p>

            <div 
                className="w-full h-[500px] bg-gray-800 border-4 border-gray-700 rounded-lg relative overflow-hidden flex flex-col items-center justify-center p-4 cursor-pointer"
                onMouseDown={handleJump}
                onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
            >
                <div className="absolute inset-0 bg-gray-900" style={{ perspective: '1000px' }}>
                    <div 
                        className="w-full h-full relative" 
                        style={{ transformStyle: 'preserve-3d', transform: 'translateY(50%) rotateX(60deg) scale(1.2)' }}
                    >
                        <div className="absolute inset-0 bg-gray-700" style={{
                            backgroundImage: 'radial-gradient(circle, #4b5563 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}></div>
                        
                        <Player isJumping={isJumping} />
                        <Rope progress={ropeProgress} />
                    </div>
                </div>

                <div className="absolute top-4 left-4 text-white text-3xl font-bold z-40" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
                    Jumps: {score} / {WIN_SCORE}
                </div>

                {status === 'lost' && <BloodSplatter />}
                {(status !== 'playing') && gameMode === 'normal' && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
                        <h3 className="text-5xl font-bold text-white">
                            {status === 'won' && `You Survived! (+50 Coins)`}
                            {status === 'lost' && 'Tripped!'}
                            {status === 'waiting' && 'Get Ready to Jump'}
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

export default JumpRopeGame;