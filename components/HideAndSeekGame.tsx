import React, { useState, useEffect, useRef, useCallback } from 'react';
import PatrollingGuard from './PatrollingGuard';
import BloodSplatter from './BloodSplatter';
import { PowerupType } from '../types';
import Jumpscare from './Jumpscare';

interface GameDataProps {
  powerups: Record<PowerupType, number>;
  usePowerup: (type: PowerupType) => boolean;
  addCoins: (amount: number) => void;
  isChallengeMode: boolean;
}

interface HideAndSeekGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';
const GAME_DURATION = 40; // seconds
const PLAYER_SPEED = 1.2;

const SCENERY_CONFIG = [
    { id: 'boxes', position: { bottom: '20%', left: '15%', transform: 'translate(-50%, 0) translateZ(1px)' }, bounds: { x1: 5, x2: 25, z1: 18, z2: 30 } },
    { id: 'wardrobe', position: { bottom: '5%', left: '50%', transform: 'translate(-50%, 0) translateZ(1px)' }, bounds: { x1: 40, x2: 60, z1: 3, z2: 15 } },
    { id: 'plant', position: { bottom: '15%', right: '10%', transform: 'translate(0, 0) translateZ(1px)' }, bounds: { x1: 75, x2: 95, z1: 13, z2: 25 } },
];

// Patrolling Guard Config
const PATROL_SPEED = 0.25;
const FOV_RANGE_Z = 35; // How far the guard can "see" - Reduced from 45
const FOV_ANGLE = Math.PI / 5; // 36 degrees - Reduced from 45

const Player: React.FC<{ position: {x: number, z: number} }> = ({ position }) => {
    const scale = 0.5 + (position.z / 100) * 0.5;
    return (
        <div className="absolute bottom-0 w-8 h-12 transition-transform duration-100"
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

// Point in triangle check for FOV
function isPointInTriangle(px: number, pz: number, ax: number, az: number, bx: number, bz: number, cx: number, cz: number) {
    const as_x = px - ax;
    const as_z = pz - az;
    const s_ab = (bx - ax) * as_z - (bz - az) * as_x > 0;
    if ((cx - ax) * as_z - (cz - az) * as_x > 0 === s_ab) return false;
    if ((cx - bx) * (pz - bz) - (cz - bz) * (px - bx) > 0 !== s_ab) return false;
    return true;
}

const VisionCone: React.FC<{
  guardPosition: { x: number; z: number };
  guardDirection: { x: number; z: number };
  fovRange: number;
  fovAngle: number;
}> = ({ guardPosition, guardDirection, fovRange, fovAngle }) => {
  const { x: gx, z: gz } = guardPosition;
  const { x: dx, z: dz } = guardDirection;

  if (dx === 0 && dz === 0) return null;

  const apex = { x: gx, z: gz };
  const centerFar = { x: gx + dx * fovRange, z: gz + dz * fovRange };
  const perp_dx = -dz;
  const perp_dz = dx;
  const halfWidth = fovRange * Math.tan(fovAngle / 2);
  const v2 = { x: centerFar.x + perp_dx * halfWidth, z: centerFar.z + perp_dz * halfWidth };
  const v3 = { x: centerFar.x - perp_dx * halfWidth, z: centerFar.z - perp_dz * halfWidth };

  const clipPathValue = `polygon(${apex.x}% ${apex.z}%, ${v2.x}% ${v2.z}%, ${v3.x}% ${v3.z}%)`;

  return (
    <div
      className="absolute inset-0 bg-yellow-400"
      style={{
        clipPath: clipPathValue,
        opacity: 0.3,
        zIndex: 10,
      }}
    />
  );
};


const HideAndSeekGame: React.FC<HideAndSeekGameProps> = ({ onBackToLobby, powerups, usePowerup, addCoins, isChallengeMode, onWin, onLose }) => {
  const WAYPOINTS = useRef([
    { x: 15, z: 30 },
    { x: 85, z: 30 },
    { x: 85, z: 70 },
    { x: 50, z: 50 },
    { x: 15, z: 70 },
  ]).current;

  const [status, setStatus] = useState<GameStatus>('waiting');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [playerPosition, setPlayerPosition] = useState({ x: 50, z: 80 });
  const [patrollingGuard, setPatrollingGuard] = useState({ x: WAYPOINTS[0].x, z: WAYPOINTS[0].z, direction: { x: 1, z: 0 }, targetWaypointIndex: 1 });
  const [eliminationReason, setEliminationReason] = useState('');
  const [showJumpscare, setShowJumpscare] = useState(false);
  const [gracePeriodCountdown, setGracePeriodCountdown] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const gameStatusRef = useRef(status);

  useEffect(() => {
    gameStatusRef.current = status;
  }, [status]);
  
  const handleWin = useCallback(() => {
    if (gameStatusRef.current !== 'playing') return;
    setStatus('won');
    if (timerRef.current) clearInterval(timerRef.current);
    if (isChallengeMode) {
      onWin();
    } else {
      addCoins(50);
    }
  }, [addCoins, isChallengeMode, onWin]);
  
  const resetGame = useCallback(() => {
    setStatus('waiting');
    setTimeLeft(GAME_DURATION);
    setPlayerPosition({ x: 50, z: 80 });
    setPatrollingGuard({ x: WAYPOINTS[0].x, z: WAYPOINTS[0].z, direction: { x: 1, z: 0 }, targetWaypointIndex: 1 });
    setEliminationReason('');
    if (timerRef.current) clearInterval(timerRef.current);
    setGracePeriodCountdown(null);
  }, [WAYPOINTS]);

  const startGame = useCallback(() => {
    resetGame();
    setGracePeriodCountdown(3);
    setStatus('playing');
  }, [resetGame]);

  const handleLose = useCallback((reason: 'caught') => {
    if (gameStatusRef.current === 'lost' || gameStatusRef.current === 'won' || showJumpscare) return;

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
        setEliminationReason('You Were Seen!');
        if (isChallengeMode) {
          onLose();
        }
    }, 700);
  }, [powerups, usePowerup, startGame, isChallengeMode, onLose, showJumpscare]);

  useEffect(() => {
    if (gracePeriodCountdown !== null && gracePeriodCountdown > 0 && status === 'playing') {
      const countdownTimer = setTimeout(() => {
        setGracePeriodCountdown(gracePeriodCountdown - 1);
      }, 1000);
      return () => clearTimeout(countdownTimer);
    }
  }, [gracePeriodCountdown, status]);
  
  useEffect(() => {
    if (status === 'playing' && gracePeriodCountdown === 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleWin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
        if(timerRef.current) clearInterval(timerRef.current);
    }
  }, [status, handleWin, gracePeriodCountdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current[e.key.toLowerCase()] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current[e.key.toLowerCase()] = false;
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = () => {
        if (gameStatusRef.current === 'playing') {
            // Player Movement
            setPlayerPosition(prevPos => {
                let { x, z } = prevPos;
                if (keysPressed.current['w'] || keysPressed.current['arrowup']) z -= PLAYER_SPEED;
                if (keysPressed.current['s'] || keysPressed.current['arrowdown']) z += PLAYER_SPEED;
                if (keysPressed.current['a'] || keysPressed.current['arrowleft']) x -= PLAYER_SPEED;
                if (keysPressed.current['d'] || keysPressed.current['arrowright']) x += PLAYER_SPEED;
                
                x = Math.max(5, Math.min(95, x));
                z = Math.max(10, Math.min(95, z));
                
                // Scenery collision
                for (const scenery of SCENERY_CONFIG) {
                    if (x > scenery.bounds.x1 && x < scenery.bounds.x2 && z > scenery.bounds.z1 && z < scenery.bounds.z2) {
                        return prevPos; // Revert movement
                    }
                }
                return { x, z };
            });

            // Patrolling Guard Movement (only after grace period)
            if (gracePeriodCountdown === 0) {
              setPatrollingGuard(prev => {
                  const target = WAYPOINTS[prev.targetWaypointIndex];
                  const distX = target.x - prev.x;
                  const distZ = target.z - prev.z;
                  const distance = Math.hypot(distX, distZ);

                  if (distance < PATROL_SPEED) {
                      const newIndex = (prev.targetWaypointIndex + 1) % WAYPOINTS.length;
                      return { ...prev, x: target.x, z: target.z, targetWaypointIndex: newIndex };
                  } else {
                      const newDirection = { x: distX / distance, z: distZ / distance };
                      const newX = prev.x + newDirection.x * PATROL_SPEED;
                      const newZ = prev.z + newDirection.z * PATROL_SPEED;
                      return { ...prev, x: newX, z: newZ, direction: newDirection };
                  }
              });
            }
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        cancelAnimationFrame(animationFrameId);
    }
  }, [status, gracePeriodCountdown, WAYPOINTS]);
  
  // Game logic checks (win/lose) that depend on updated state
   useEffect(() => {
    if (status !== 'playing' || gracePeriodCountdown !== 0) return;

    // Guard Vision Check
    const { x: gx, z: gz, direction } = patrollingGuard;
    const { x: dx, z: dz } = direction;

    if (dx === 0 && dz === 0) return;

    // Vision Cone Vertices Calculation
    const apex = { x: gx, z: gz };
    const centerFar = { x: gx + dx * FOV_RANGE_Z, z: gz + dz * FOV_RANGE_Z };
    const perp_dx = -dz;
    const perp_dz = dx;
    const halfWidth = FOV_RANGE_Z * Math.tan(FOV_ANGLE / 2);
    const v2 = { x: centerFar.x + perp_dx * halfWidth, z: centerFar.z + perp_dz * halfWidth };
    const v3 = { x: centerFar.x - perp_dx * halfWidth, z: centerFar.z - perp_dz * halfWidth };

    let isPlayerHidden = false;
    for (const scenery of SCENERY_CONFIG) {
        const sceneryZ = (scenery.bounds.z1 + scenery.bounds.z2) / 2;
        // Check if scenery is between player and guard on the Z axis
        if ((playerPosition.z - sceneryZ) * (gz - sceneryZ) < 0) {
            // Calculate intersection with the line at sceneryZ
            const t = (sceneryZ - gz) / (playerPosition.z - gz);
            if (t > 0 && t < 1) { // Ensure intersection is on the segment between guard and player
                const intersectionX = gx + t * (playerPosition.x - gx);
                if (intersectionX > scenery.bounds.x1 && intersectionX < scenery.bounds.x2) {
                    isPlayerHidden = true;
                    break;
                }
            }
        }
    }

    if (!isPlayerHidden) {
        if (isPointInTriangle(playerPosition.x, playerPosition.z, apex.x, apex.z, v2.x, v2.z, v3.x, v3.z)) {
            handleLose('caught');
        }
    }

  }, [playerPosition, patrollingGuard, status, handleLose, gracePeriodCountdown]);


  return (
    <div className="w-full flex flex-col items-center p-4">
      {showJumpscare && <Jumpscare />}
      <h2 className="text-3xl font-bold mb-2 text-pink-400">Hide and Seek</h2>
      <p className="mb-4 text-gray-300">Use [WASD] or [ARROWS] to move. Stay hidden until the timer runs out!</p>

      <div className="w-full h-[500px] bg-gray-900 border-4 border-gray-700 rounded-lg relative overflow-hidden">
        {status === 'lost' && <BloodSplatter />}
        <div className="w-full h-full" style={{ perspective: '1200px' }}>
          <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: 'translateY(15%) rotateX(55deg) scale(0.9)' }}>
            {/* Floor and Wall */}
            <div className="absolute inset-0 bg-green-800" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '25px 25px' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-yellow-800" style={{ transform: 'translateZ(-20px) rotateX(-90deg)', transformOrigin: 'top center', height: '200px' }}></div>
            <div className="absolute inset-0 pointer-events-none" style={{boxShadow: 'inset 0px 0px 80px 40px rgba(0,0,0,0.7)'}}></div>

            {/* Scenery */}
            <div className="absolute w-24 h-16 bg-yellow-700" style={SCENERY_CONFIG[0].position}> {/* Boxes */}
                <div className="absolute w-full h-full border-2 border-yellow-900"></div>
                <div className="absolute top-1/2 w-full h-1 bg-yellow-900"></div>
            </div>
            <div className="absolute w-32 h-48 bg-amber-800" style={SCENERY_CONFIG[1].position}> {/* Wardrobe */}
                 <div className="absolute w-full h-full border-2 border-amber-900"></div>
                 <div className="absolute left-1/2 top-2 w-4 h-4 rounded-full bg-amber-900"></div>
            </div>
            <div className="absolute w-20 h-28" style={SCENERY_CONFIG[2].position}> {/* Plant */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-900 rounded-t-lg"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-16 bg-green-800 rounded-full rotate-[-20deg]"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-12 bg-green-700 rounded-full rotate-[20deg]"></div>
            </div>
            
            {status === 'playing' && gracePeriodCountdown === 0 && (
              <VisionCone
                guardPosition={{ x: patrollingGuard.x, z: patrollingGuard.z }}
                guardDirection={patrollingGuard.direction}
                fovRange={FOV_RANGE_Z}
                fovAngle={FOV_ANGLE}
              />
            )}
            <PatrollingGuard position={{ x: patrollingGuard.x, z: patrollingGuard.z }} />
            <Player position={playerPosition} />
          </div>
        </div>

        {status === 'playing' && gracePeriodCountdown === 0 && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white font-bold text-2xl z-20">
            Time: {timeLeft}
          </div>
        )}

        {(status === 'playing' && gracePeriodCountdown !== null && gracePeriodCountdown > 0) && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <span className="text-8xl font-black text-white" style={{textShadow: '0 0 20px black'}}>{gracePeriodCountdown}</span>
          </div>
        )}

        {(status !== 'playing') && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
            <h3 className="text-5xl font-bold text-white">
                {status === 'won' && 'You Survived! (+50 Coins)'}
                {status === 'lost' && eliminationReason}
                {status === 'waiting' && 'Survive the Countdown'}
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

export default HideAndSeekGame;