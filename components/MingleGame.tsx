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

interface MingleGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}
type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';
type AIParticipant = {
  id: number;
  pos: { x: number; z: number };
  status: 'unpaired' | 'paired';
  speed: number;
};
const GAME_DURATION = 15;
const PLAYER_SPEED = 0.6;
const NUM_AI = 10; 

const generateAIParticipants = (): AIParticipant[] => {
    const participants: AIParticipant[] = [];
    for (let i = 0; i < NUM_AI; i++) {
        participants.push({
            id: i,
            pos: { x: Math.random() * 80 + 10, z: Math.random() * 80 + 10 },
            status: 'unpaired',
            speed: 0.1 + Math.random() * 0.1,
        });
    }
    return participants;
};

const Player: React.FC<{ position: {x: number, z: number} }> = ({ position }) => {
    const scale = 0.5 + (position.z / 100) * 0.5;
    return (
        <div className="absolute bottom-0 w-8 h-12"
            style={{ 
                left: `${position.x}%`,
                transform: `translateX(-50%) translateZ(${position.z}px) scale(${scale})`,
                filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.4))',
                zIndex: 50,
            }}>
            <div className="w-full h-1/3 bg-teal-200 rounded-full"></div>
            <div className="w-full h-2/3 bg-teal-400 rounded-b-md"></div>
        </div>
    );
}

const AIParticipantComp: React.FC<{ participant: AIParticipant }> = ({ participant }) => {
    const { pos, status } = participant;
    const scale = 0.5 + (pos.z / 100) * 0.5;
    const color = status === 'unpaired' ? 'bg-gray-400' : 'bg-pink-500';
    const headColor = status === 'unpaired' ? 'bg-gray-200' : 'bg-pink-300';
    const zIndex = 40 - Math.floor(pos.z / 10);
    return (
        <div className="absolute bottom-0 w-8 h-12 transition-colors duration-500"
            style={{ 
                left: `${pos.x}%`,
                transform: `translateX(-50%) translateZ(${pos.z}px) scale(${scale})`,
                zIndex: zIndex
            }}>
            <div className={`w-full h-1/3 ${headColor} rounded-full`}></div>
            <div className={`w-full h-2/3 ${color} rounded-b-md`}></div>
        </div>
    );
};

const MingleGame: React.FC<MingleGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, isChallengeMode }) => {
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [playerPosition, setPlayerPosition] = useState({ x: 50, z: 80 });
    const [aiParticipants, setAiParticipants] = useState<AIParticipant[]>([]);
    const [interactableAI, setInteractableAI] = useState<number | null>(null);
    const [showJumpscare, setShowJumpscare] = useState(false);

    const timerRef = useRef<number | null>(null);
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const aiParticipantsRef = useRef(aiParticipants);
    const statusRef = useRef(status);

    useEffect(() => {
        aiParticipantsRef.current = aiParticipants;
    }, [aiParticipants]);

     useEffect(() => {
        statusRef.current = status;
    }, [status]);
    
    const handleLose = useCallback(() => {
        if (statusRef.current === 'lost' || statusRef.current === 'won' || showJumpscare) return;
        
        if (timerRef.current) clearInterval(timerRef.current);
        setShowJumpscare(true);

        setTimeout(() => {
            setShowJumpscare(false);

            if (powerups[PowerupType.PERMANENT_EXTRA_LIFE] > 0) {
                alert("You used your Permanent Extra Life! Timer reset.");
                setTimeLeft(GAME_DURATION);
                return;
            }

            if (powerups.extraLife > 0 && usePowerup(PowerupType.EXTRA_LIFE)) {
                alert("You used an Extra Life! Timer reset.");
                setTimeLeft(GAME_DURATION);
                return;
            }
            setStatus('lost');
            if (isChallengeMode) onLose();
        }, 700);
    }, [isChallengeMode, onLose, powerups, usePowerup, showJumpscare]);
    
    const handleWin = useCallback(() => {
        if (statusRef.current === 'won') return;
        setStatus('won');
        if (timerRef.current) clearInterval(timerRef.current);
        if (isChallengeMode) {
            onWin();
        } else {
            addCoins(50);
        }
    }, [isChallengeMode, onWin, addCoins]);


    const resetGame = useCallback(() => {
        setStatus('waiting');
        setTimeLeft(GAME_DURATION);
        setPlayerPosition({ x: 50, z: 80 });
        setInteractableAI(null);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);
    
    const startGame = useCallback(() => {
        resetGame();
        setAiParticipants(generateAIParticipants());
        setStatus('playing');
    }, [resetGame]);
    
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
        }
    }, [status, handleLose]);
    
    const handlePairUp = (aiId: number) => {
        if (status !== 'playing') return;
        
        const ai = aiParticipantsRef.current.find(p => p.id === aiId);
        if (ai && ai.status === 'unpaired') {
            setAiParticipants(prev => prev.map(p => p.id === aiId ? {...p, status: 'paired'} : p));
            handleWin();
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'e' && interactableAI !== null) {
                handlePairUp(interactableAI);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        let animationFrameId: number;
        
        const gameLoop = () => {
            if (statusRef.current !== 'playing') {
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            };

            setPlayerPosition(prev => {
                let { x, z } = prev;
                if (keysPressed.current['w'] || keysPressed.current['arrowup']) z -= PLAYER_SPEED;
                if (keysPressed.current['s'] || keysPressed.current['arrowdown']) z += PLAYER_SPEED;
                if (keysPressed.current['a'] || keysPressed.current['arrowleft']) x -= PLAYER_SPEED;
                if (keysPressed.current['d'] || keysPressed.current['arrowright']) x += PLAYER_SPEED;
                return { x: Math.max(5, Math.min(95, x)), z: Math.max(5, Math.min(95, z)) };
            });
            
            setAiParticipants(prevAIs => {
                const nextAIs = prevAIs.map(p => ({ ...p, pos: { ...p.pos } }));
                const unpairedIds = new Set(nextAIs.filter(p => p.status === 'unpaired').map(p => p.id));
        
                while (unpairedIds.size > 1) {
                    const currentId = unpairedIds.values().next().value;
                    unpairedIds.delete(currentId);
                    
                    const currentAI = nextAIs.find(p => p.id === currentId)!;
                    let closestTarget: AIParticipant | null = null;
                    let minDistance = Infinity;
        
                    for (const targetId of unpairedIds) {
                        const targetAI = nextAIs.find(p => p.id === targetId)!;
                        const dist = Math.hypot(targetAI.pos.x - currentAI.pos.x, targetAI.pos.z - currentAI.pos.z);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestTarget = targetAI;
                        }
                    }
                    
                    if (closestTarget) {
                        if (minDistance < 5) {
                            currentAI.status = 'paired';
                            closestTarget.status = 'paired';
                            unpairedIds.delete(closestTarget.id);
                        } else {
                            currentAI.pos.x += (closestTarget.pos.x - currentAI.pos.x) / minDistance * currentAI.speed;
                            currentAI.pos.z += (closestTarget.pos.z - currentAI.pos.z) / minDistance * currentAI.speed;
                        }
                    }
                }
                return nextAIs;
            });
            
            let foundInteractable = false;
            for (const ai of aiParticipantsRef.current) {
                if (ai.status === 'unpaired') {
                    const dist = Math.hypot(ai.pos.x - playerPosition.x, ai.pos.z - playerPosition.z);
                    if (dist < 10) {
                        setInteractableAI(ai.id);
                        foundInteractable = true;
                        break;
                    }
                }
            }
            if (!foundInteractable) {
                setInteractableAI(null);
            }
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId);
        }
    }, [status, playerPosition.x, playerPosition.z, handleWin]);
    
    return (
        <div className="w-full flex flex-col items-center p-4">
            {showJumpscare && <Jumpscare />}
            <h2 className="text-3xl font-bold mb-2 text-pink-400">Mingle</h2>
            <p className="mb-4 text-gray-300">Use [WASD] or [ARROWS] to move. Press [E] near an unpaired person to partner up!</p>

            <div className="w-full h-[500px] bg-gray-900 border-4 border-gray-700 rounded-lg relative overflow-hidden">
                {status === 'lost' && <BloodSplatter />}
                <div className="w-full h-full" style={{ perspective: '1500px' }}>
                    <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: 'translateY(20%) rotateX(55deg)' }}>
                        <div className="absolute inset-0 bg-gray-700" style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                            backgroundSize: '50px 50px',
                        }}></div>

                        <Player position={playerPosition} />
                        {aiParticipants.map(ai => <AIParticipantComp key={ai.id} participant={ai} />)}
                    </div>
                </div>

                {interactableAI !== null && status === 'playing' && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black bg-opacity-75 rounded-lg text-white font-bold text-xl z-20 animate-pulse">
                        Press [E] to pair up
                    </div>
                )}
                
                {status === 'playing' && (
                    <div className="absolute top-4 right-4 px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white font-bold text-2xl z-20">
                        Time: {timeLeft}
                    </div>
                )}
                
                {(status !== 'playing') && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-30">
                    <h3 className="text-5xl font-bold text-white">
                        {status === 'won' && 'You Found a Partner! (+50 Coins)'}
                        {status === 'lost' && "Left Out!"}
                        {status === 'waiting' && 'Get Ready to Mingle'}
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

export default MingleGame;