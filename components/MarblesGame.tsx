import React, { useState, useEffect, useCallback, useRef } from 'react';
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

interface MarblesGameProps extends GameDataProps {
  onBackToLobby: () => void;
  onWin: () => void;
  onLose: () => void;
}

// Types
type GameStatus = 'waiting' | 'player_betting' | 'player_guessing' | 'ai_thinking' | 'result' | 'won' | 'lost';
type Turn = 'player_guesses' | 'ai_guesses';

const STARTING_MARBLES = 10;

const MarblesGame: React.FC<MarblesGameProps> = ({ onBackToLobby, onWin, onLose, powerups, usePowerup, addCoins, gameMode }) => {
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [playerMarbles, setPlayerMarbles] = useState(STARTING_MARBLES);
    const [aiMarbles, setAiMarbles] = useState(STARTING_MARBLES);
    const [turn, setTurn] = useState<Turn>('player_guesses');
    const [playerBet, setPlayerBet] = useState(1);
    const [resultMessage, setResultMessage] = useState('');
    const [showJumpscare, setShowJumpscare] = useState(false);

    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const handleWin = useCallback(() => {
        if (statusRef.current === 'won' || statusRef.current === 'lost') return;
        setStatus('won');
        if (gameMode === 'challenge' || gameMode === 'betting') {
            onWin();
        } else {
            addCoins(100);
        }
    }, [gameMode, onWin, addCoins]);

    const handleLose = useCallback(() => {
        if (statusRef.current === 'lost' || statusRef.current === 'won' || showJumpscare) return;
        setShowJumpscare(true);
        setTimeout(() => {
            setShowJumpscare(false);
            if (powerups[PowerupType.PERMANENT_EXTRA_LIFE] > 0 && usePowerup(PowerupType.PERMANENT_EXTRA_LIFE)) {
                 alert("You used your Permanent Extra Life!");
                 setResultMessage('A second chance!');
                 setTimeout(() => {
                     setStatus(turn === 'player_guesses' ? 'player_guessing' : 'player_betting');
                 }, 1000)
                 return;
            }
            if (powerups.extraLife > 0 && usePowerup(PowerupType.EXTRA_LIFE)) {
                alert("You used an Extra Life!");
                setResultMessage('A second chance!');
                setTimeout(() => {
                    setStatus(turn === 'player_guesses' ? 'player_guessing' : 'player_betting');
                }, 1000)
                return;
            }
            setStatus('lost');
            if (gameMode === 'challenge' || gameMode === 'betting') {
                onLose();
            }
        }, 700);
    }, [gameMode, onLose, powerups, usePowerup, showJumpscare, turn]);

    const checkWinLoss = (pM: number, aM: number) => {
        if (pM <= 0) { handleLose(); return true; }
        if (aM <= 0) { handleWin(); return true; }
        return false;
    };

    const startGame = useCallback(() => {
        setPlayerMarbles(STARTING_MARBLES);
        setAiMarbles(STARTING_MARBLES);
        setTurn('player_guesses');
        setStatus('player_guessing');
        setResultMessage('');
        setPlayerBet(1);
    }, []);
    
    // When it's AI's turn to guess, player must first bet.
    const handlePlayerBetting = () => {
        if (playerBet <= 0 || playerBet > playerMarbles) {
            alert(`You must bet between 1 and ${playerMarbles} marbles.`);
            return;
        }
        setStatus('ai_thinking');
        setTimeout(() => {
            const aiGuessIsEven = Math.random() < 0.5;
            const playerBetIsEven = playerBet % 2 === 0;

            let newPlayerMarbles = playerMarbles;
            let newAiMarbles = aiMarbles;
            let message = '';
            
            if (aiGuessIsEven === playerBetIsEven) {
                message = `AI guessed ${aiGuessIsEven ? 'Even' : 'Odd'}. Correct! You lose ${playerBet} marbles.`;
                newPlayerMarbles -= playerBet;
                newAiMarbles += playerBet;
            } else {
                message = `AI guessed ${aiGuessIsEven ? 'Even' : 'Odd'}. Incorrect! You win ${playerBet} marbles.`;
                newPlayerMarbles += playerBet;
                newAiMarbles -= playerBet;
            }

            setResultMessage(message);
            setPlayerMarbles(newPlayerMarbles);
            setAiMarbles(newAiMarbles);
            setStatus('result');

            setTimeout(() => {
                if (!checkWinLoss(newPlayerMarbles, newAiMarbles)) {
                    setTurn('player_guesses');
                    setStatus('player_guessing');
                }
            }, 3000);
        }, 1500);
    };

    // When it's player's turn to guess, AI bets first.
    const handlePlayerGuessing = (guessIsEven: boolean) => {
        setStatus('ai_thinking');
        setTimeout(() => {
            const aiBet = Math.max(1, Math.floor(Math.random() * aiMarbles));
            const aiBetIsEven = aiBet % 2 === 0;

            let newPlayerMarbles = playerMarbles;
            let newAiMarbles = aiMarbles;
            let message = '';

            if (guessIsEven === aiBetIsEven) {
                message = `You guessed ${guessIsEven ? 'Even' : 'Odd'}. Correct! AI hid ${aiBet}. You win ${aiBet} marbles.`;
                newPlayerMarbles += aiBet;
                newAiMarbles -= aiBet;
            } else {
                message = `You guessed ${guessIsEven ? 'Even' : 'Odd'}. Incorrect! AI hid ${aiBet}. You lose ${aiBet} marbles.`;
                newPlayerMarbles -= aiBet;
                newAiMarbles += aiBet;
            }

            setResultMessage(message);
            setPlayerMarbles(newPlayerMarbles);
            setAiMarbles(newAiMarbles);
            setStatus('result');

            setTimeout(() => {
                if (!checkWinLoss(newPlayerMarbles, newAiMarbles)) {
                    setTurn('ai_guesses');
                    setPlayerBet(1);
                    setStatus('player_betting');
                }
            }, 3000);

        }, 1500);
    };

    const renderGameScreen = () => {
        switch (status) {
            case 'player_betting':
                return (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold mb-4">Your Turn to Hide</h3>
                        <p className="mb-4">Choose how many marbles to hide. The AI will guess if it's an Odd or Even number.</p>
                        <div className="flex items-center justify-center gap-4">
                            <input type="range" min="1" max={playerMarbles > 0 ? playerMarbles : 1} value={playerBet} onChange={(e) => setPlayerBet(parseInt(e.target.value))} className="w-64" />
                            <span className="text-2xl font-bold w-12">{playerBet}</span>
                            <button onClick={handlePlayerBetting} className="px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold">
                                Hide Marbles
                            </button>
                        </div>
                    </div>
                );
            case 'player_guessing':
                return (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold mb-4">Your Turn to Guess</h3>
                        <p className="mb-4">The AI has hidden some marbles. Guess if the amount is Odd or Even.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handlePlayerGuessing(false)} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-md text-white font-bold text-xl">
                                ODD
                            </button>
                            <button onClick={() => handlePlayerGuessing(true)} className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-md text-white font-bold text-xl">
                                EVEN
                            </button>
                        </div>
                    </div>
                );
            case 'ai_thinking':
                return <h3 className="text-3xl font-bold animate-pulse">Thinking...</h3>;
            case 'result':
                return <h3 className="text-2xl font-bold text-yellow-300 text-center">{resultMessage}</h3>;
            default: return null;
        }
    };

    return (
        <div className="w-full flex flex-col items-center p-4">
            {showJumpscare && <Jumpscare />}
            <h2 className="text-3xl font-bold mb-2 text-pink-400">Marbles</h2>
            <p className="mb-4 text-gray-300">Win all of your opponent's marbles to survive.</p>
            <div className="w-full h-[500px] bg-gray-800 border-4 border-gray-700 rounded-lg relative overflow-hidden flex flex-col p-4">
                {status === 'lost' && <BloodSplatter />}
                 <div className="flex justify-between w-full p-4 bg-gray-900/50 rounded-lg mb-4">
                    <div className="text-center w-1/2 border-r-2 border-gray-600">
                        <p className="text-lg font-bold text-teal-400">YOUR MARBLES</p>
                        <p className="text-4xl font-black">{playerMarbles}</p>
                    </div>
                    <div className="text-center w-1/2">
                        <p className="text-lg font-bold text-red-400">AI'S MARBLES</p>
                        <p className="text-4xl font-black">{aiMarbles}</p>
                    </div>
                </div>
                 <div className="flex-grow flex items-center justify-center p-4">
                    {renderGameScreen()}
                </div>
                {(status === 'waiting' || status === 'won' || status === 'lost') && (
                    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-30">
                        <h3 className="text-5xl font-bold text-white mb-4">
                            {status === 'won' && `You Survived! (+100 Coins)`}
                            {status === 'lost' && 'You Lost All Your Marbles!'}
                            {status === 'waiting' && 'Prepare to Play'}
                        </h3>
                        {(status === 'won' || status === 'lost') && gameMode === 'normal' && <p className="text-gray-300 mb-4">{resultMessage}</p>}
                        <button onClick={startGame} className="mt-4 px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold transition-transform hover:scale-105">
                            {status === 'waiting' ? 'Start Game' : 'Play Again'}
                        </button>
                    </div>
                )}
            </div>
            <button onClick={onBackToLobby} className="mt-6 px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold transition-transform hover:scale-105">
                Back to Lobby
            </button>
            {powerups[PowerupType.SKIP_GAME] > 0 && status !== 'waiting' && status !== 'won' && status !== 'lost' && (
                <button
                    onClick={() => { if (usePowerup(PowerupType.SKIP_GAME)) handleWin(); }}
                    className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white font-bold transition-transform hover:scale-105"
                >
                    Skip Game ({powerups[PowerupType.SKIP_GAME]} left)
                </button>
            )}
        </div>
    );
};

export default MarblesGame;
