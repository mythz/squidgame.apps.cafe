import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DalgonaShape, PowerupType } from '../types';
import { generateDalgonaShape } from '../services/geminiService';
import TriangleIcon from './icons/TriangleIcon';
import CircleIcon from './icons/CircleIcon';
import StarIcon from './icons/StarIcon';
import UmbrellaIcon from './icons/UmbrellaIcon';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import BloodSplatter from './BloodSplatter';
import Jumpscare from './Jumpscare';

interface GameDataProps {
  powerups: Record<PowerupType, number>;
  usePowerup: (type: PowerupType) => boolean;
  addCoins: (amount: number) => void;
  isChallengeMode: boolean;
  gameMode: 'normal' | 'challenge' | 'betting';
}

interface DalgonaGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

const TOLERANCE = 8; // Increased from 5
const CRACK_SPEED = 25; // Increased from 15

const DalgonaGame: React.FC<DalgonaGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, gameMode }) => {
  const [selectedShape, setSelectedShape] = useState<DalgonaShape | null>(null);
  const [svgPath, setSvgPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCracked, setIsCracked] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [crackPath, setCrackPath] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showJumpscare, setShowJumpscare] = useState(false);

  const pathRef = useRef<SVGPathElement>(null);
  const progressPathRef = useRef<SVGPathElement>(null);
  const isCarving = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const pathLength = useRef<number>(0);
  const carvedPoints = useRef<boolean[]>([]);
  const selectedShapeRef = useRef(selectedShape);

  useEffect(() => {
      selectedShapeRef.current = selectedShape;
  }, [selectedShape]);

  const resetGame = useCallback((keepShape = false) => {
    setIsCracked(false);
    setIsComplete(false);
    setProgress(0);
    setCrackPath('');
    isCarving.current = false;
    lastMousePos.current = null;
    setIsShaking(false);
    setFeedbackMessage('');
    if (pathRef.current) {
        pathLength.current = pathRef.current.getTotalLength();
        carvedPoints.current = new Array(Math.ceil(pathLength.current)).fill(false);
    }
    if (!keepShape) {
        setSelectedShape(null);
    }
  }, []);

  const handleShapeSelect = async (shape: DalgonaShape, isRetry: boolean = false) => {
    setSelectedShape(shape);
    setIsLoading(true);
    if (!isRetry) {
        resetGame(true);
    }
    setSvgPath('');
    const pathData = await generateDalgonaShape(shape);
    setSvgPath(pathData);
    setIsLoading(false);
  };
  
  const handleRandomShapeSelect = () => {
    const shapes = Object.values(DalgonaShape);
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    handleShapeSelect(randomShape);
  };

  useEffect(() => {
    if (svgPath && pathRef.current) {
        pathLength.current = pathRef.current.getTotalLength();
        carvedPoints.current = new Array(Math.ceil(pathLength.current)).fill(false);
        if(progressPathRef.current) {
            progressPathRef.current.style.strokeDasharray = `${pathLength.current} ${pathLength.current}`;
            progressPathRef.current.style.strokeDashoffset = `${pathLength.current}`;
        }
    }
  }, [svgPath]);

  const handleWin = useCallback(() => {
    if (isComplete) return;
    setIsComplete(true);
    isCarving.current = false;
    if (gameMode === 'challenge' || gameMode === 'betting') {
      onWin();
    } else {
      addCoins(50);
    }
  }, [gameMode, onWin, addCoins, isComplete]);
  
  const handleCrack = (x: number, y: number, reason: 'fast' | 'off-track') => {
    if (isCracked || isComplete || showJumpscare) return;
    
    setShowJumpscare(true);

    setTimeout(() => {
        setShowJumpscare(false);
        
        if (powerups[PowerupType.PERMANENT_EXTRA_LIFE] > 0) {
            alert("You used your Permanent Extra Life!");
            resetGame(true);
            handleShapeSelect(selectedShapeRef.current!, true);
            return;
        }

        if (powerups.extraLife > 0 && usePowerup(PowerupType.EXTRA_LIFE)) {
            alert("You used an Extra Life!");
            resetGame(true);
            handleShapeSelect(selectedShapeRef.current!, true);
            return;
        }

        setIsCracked(true);
        isCarving.current = false;
        if(gameMode === 'challenge' || gameMode === 'betting') onLose();

        const crackD = `M ${x} ${y} l ${Math.random()*20-10} ${Math.random()*20-10} l ${Math.random()*30-15} ${Math.random()*30-15} l ${Math.random()*40-20} ${Math.random()*40-20}`;
        setCrackPath(crackD);
        
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);

        setFeedbackMessage(reason === 'fast' ? 'TOO FAST!' : 'OFF TRACK!');
    }, 700);
  }

  const getMousePos = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const CTM = svg.getScreenCTM();
    if (CTM) {
      return {
        x: (e.clientX - CTM.e) / CTM.a,
        y: (e.clientY - CTM.f) / CTM.d
      };
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = () => {
    if (isCracked || isComplete) return;
    isCarving.current = true;
  };
  
  const handleMouseUp = () => {
    isCarving.current = false;
    lastMousePos.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isCarving.current || !pathRef.current || isCracked || isComplete) return;

    const mousePos = getMousePos(e);
    let minDistance = Infinity;
    let closestLength = 0;

    for (let i = 0; i < pathLength.current; i++) {
        const point = pathRef.current.getPointAtLength(i);
        const distance = Math.sqrt(Math.pow(point.x - mousePos.x, 2) + Math.pow(point.y - mousePos.y, 2));
        if (distance < minDistance) {
            minDistance = distance;
            closestLength = i;
        }
    }

    if (lastMousePos.current) {
        const speed = Math.sqrt(Math.pow(mousePos.x - lastMousePos.current.x, 2) + Math.pow(mousePos.y - lastMousePos.current.y, 2));
        if (speed > CRACK_SPEED) {
            handleCrack(mousePos.x, mousePos.y, 'fast');
            return;
        }
    }
    lastMousePos.current = mousePos;
    
    if (minDistance > TOLERANCE) {
        handleCrack(mousePos.x, mousePos.y, 'off-track');
    } else {
        carvedPoints.current[Math.floor(closestLength)] = true;
        const newProgress = carvedPoints.current.filter(Boolean).length;
        const progressPercentage = (newProgress / carvedPoints.current.length) * 100;
        setProgress(progressPercentage);

        if (progressPathRef.current) {
            const offset = pathLength.current - (pathLength.current * progressPercentage / 100);
            progressPathRef.current.style.strokeDashoffset = `${offset}`;
        }

        if (progressPercentage >= 99) {
            handleWin();
        }
    }
  };
  
  const renderContent = () => {
    if (!selectedShape) {
      return (
        <div className="flex flex-col items-center">
            <h3 className="text-2xl font-semibold mb-6">Choose your shape</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ShapeButton shape={DalgonaShape.Triangle} onClick={() => handleShapeSelect(DalgonaShape.Triangle)}><TriangleIcon className="w-16 h-16"/></ShapeButton>
                <ShapeButton shape={DalgonaShape.Circle} onClick={() => handleShapeSelect(DalgonaShape.Circle)}><CircleIcon className="w-16 h-16"/></ShapeButton>
                <ShapeButton shape={DalgonaShape.Star} onClick={() => handleShapeSelect(DalgonaShape.Star)}><StarIcon className="w-16 h-16"/></ShapeButton>
                <ShapeButton shape={DalgonaShape.Umbrella} onClick={() => handleShapeSelect(DalgonaShape.Umbrella)}><UmbrellaIcon className="w-16 h-16"/></ShapeButton>
                <button 
                  onClick={handleRandomShapeSelect} 
                  className="p-4 bg-gray-700 rounded-lg text-purple-400 hover:bg-gray-600 hover:text-pink-400 transition-all duration-200 transform hover:scale-110 col-span-2 md:col-span-1"
                  aria-label="Select a random shape"
                >
                    <QuestionMarkIcon className="w-16 h-16 mx-auto"/>
                </button>
            </div>
        </div>
      );
    }
    if (isLoading) {
      return <div className="text-2xl font-bold animate-pulse">Generating your Dalgona...</div>
    }

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-80 h-80" style={{ transform: 'rotateX(15deg) rotateY(-10deg)', transformStyle: 'preserve-3d', cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L12 22 M2 12 L22 12" /></svg>') 12 12, crosshair` }}>
            <svg viewBox="0 0 100 100" className="w-full h-full" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onMouseLeave={handleMouseUp}>
                <defs>
                  <radialGradient id="dalgonaGradient">
                    <stop offset="0%" stopColor="#f7b733" />
                    <stop offset="80%" stopColor="#d39e00" />
                    <stop offset="100%" stopColor="#a57c00" />
                  </radialGradient>
                  <filter id="noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
                  </filter>
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#dalgonaGradient)" stroke="#866400" strokeWidth="1" style={{ filter: 'drop-shadow(3px 5px 3px rgba(0,0,0,0.5))' }} />
                <rect x="0" y="0" width="100" height="100" fill="transparent" filter="url(#noise)" opacity="0.1" pointerEvents="none" />
                <path ref={pathRef} d={svgPath} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path ref={progressPathRef} d={svgPath} fill="none" stroke="#e63946" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                {isCracked && <path d={crackPath} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />}

            </svg>
            {isCracked && <BloodSplatter />}
             {feedbackMessage && !isComplete && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <p className="text-red-500 text-4xl font-black animate-pulse" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)', transform: 'rotateX(-15deg) rotateY(10deg)' }}>
                        {feedbackMessage}
                    </p>
                </div>
            )}
            {(isCracked || isComplete) && gameMode === 'normal' && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10 rounded-full" style={{ transform: 'rotateX(-15deg) rotateY(10deg)'}}>
                    <h3 className="text-5xl font-bold text-white mb-4">{isComplete ? `Success! (+50 Coins)` : 'Cracked!'}</h3>
                    <button onClick={() => resetGame()} className="px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold transition-transform hover:scale-105">
                        Play Again
                    </button>
                </div>
            )}
        </div>
        <div className="w-full mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-teal-400 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
            </div>
            <p className="text-center mt-2">{isCracked ? 'You broke it!' : isComplete ? 'Perfectly carved!' : 'Carefully trace the shape.'}</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`w-full flex flex-col items-center p-4 ${isShaking ? 'animate-shake' : ''}`}>
      {showJumpscare && <Jumpscare />}
      <h2 className="text-3xl font-bold mb-2 text-pink-400">Dalgona Challenge</h2>
      <p className="mb-4 text-gray-300">Click & drag to trace the shape. Go slow and stay on the line!</p>
      <div className="w-full min-h-[400px] bg-gray-800 border-4 border-gray-700 rounded-lg flex items-center justify-center p-8" style={{ perspective: '1200px' }}>
        {renderContent()}
      </div>
      <button onClick={onBackToLobby} className="mt-6 px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold transition-transform hover:scale-105">
        Back to Lobby
      </button>
      {powerups[PowerupType.SKIP_GAME] > 0 && selectedShape && !isComplete && !isCracked && (
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

const ShapeButton: React.FC<{shape: DalgonaShape; onClick: (shape:DalgonaShape) => void, children: React.ReactNode}> = ({shape, onClick, children}) => (
    <button onClick={() => onClick(shape)} className="p-4 bg-gray-700 rounded-lg text-yellow-400 hover:bg-gray-600 hover:text-pink-400 transition-all duration-200 transform hover:scale-110">
        {children}
    </button>
);


export default DalgonaGame;