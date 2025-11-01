import React, { useState, useEffect } from 'react';
import { PowerupType, Game } from '../types';
import CoinIcon from './icons/CoinIcon';
import ExtraLifeIcon from './icons/ExtraLifeIcon';
import DoubleCoinsIcon from './icons/DoubleCoinsIcon';
import InvisibilityIcon from './icons/InvisibilityIcon';
import SkipIcon from './icons/SkipIcon';
import SquidIcon from './icons/SquidIcon';
import PentagonIcon from './icons/PentagonIcon';
import JumpRopeIcon from './icons/JumpRopeIcon';
import StarIcon from './icons/StarIcon';
import MarbleIcon from './icons/MarbleIcon';
import SquidOutlineIcon from './icons/SquidOutlineIcon';

interface ShopProps {
  coins: number;
  powerups: Record<PowerupType, number>;
  spendCoins: (amount: number) => boolean;
  addCoins: (amount: number) => void;
  addPowerup: (type: PowerupType) => void;
  loseRandomPowerup: () => PowerupType | null;
  onBackToLobby: () => void;
  onStartBet: (game: Game, amount: number) => void;
}

const POWERUP_CATALOG = [
  {
    type: PowerupType.EXTRA_LIFE,
    name: 'Extra Life',
    description: 'Survive one elimination and get a second chance.',
    cost: 150,
    icon: <ExtraLifeIcon className="w-16 h-16 text-red-500" />,
  },
  {
    type: PowerupType.DOUBLE_COINS,
    name: 'Double Coins',
    description: 'Doubles the coin reward for the next game you win.',
    cost: 100,
    icon: <DoubleCoinsIcon className="w-16 h-16 text-yellow-400" />,
    disabled: false,
  },
  {
    type: PowerupType.INVISIBILITY,
    name: 'Invisibility',
    description: 'Briefly become invisible to the guard in Hide and Seek.',
    cost: 200,
    icon: <InvisibilityIcon className="w-16 h-16 text-blue-400" />,
    disabled: false,
  },
  {
    type: PowerupType.SKIP_GAME,
    name: 'Skip a Game',
    description: 'Allows you to skip any game, granting an instant win.',
    cost: 1000,
    icon: <SkipIcon className="w-16 h-16 text-green-500" />,
  },
];

const PERMANENT_POWERUPS_CATALOG = [
    {
      type: PowerupType.PERMANENT_EXTRA_LIFE,
      name: 'Permanent Extra Life',
      description: 'Grants you one extra life in every game, forever.',
      cost: 15000,
      icon: <ExtraLifeIcon className="w-16 h-16 text-red-500" />,
    },
    {
      type: PowerupType.PERMANENT_DOUBLE_COINS,
      name: 'Permanent Double Coins',
      description: 'Permanently doubles all coins you earn from winning games.',
      cost: 50000,
      icon: <DoubleCoinsIcon className="w-16 h-16 text-yellow-400" />,
    },
];

const SLOT_PRIZES = [
  { type: 'powerup', value: PowerupType.EXTRA_LIFE, label: 'Extra Life', weight: 10 },
  { type: 'powerup', value: PowerupType.DOUBLE_COINS, label: 'Double Coins', weight: 8 },
  { type: 'powerup', value: PowerupType.INVISIBILITY, label: 'Invisibility', weight: 8 },
  { type: 'coins', value: 200, label: '+200 Coins', weight: 25 },
  { type: 'coins', value: 1000, label: '+1000 Coins', weight: 2 },
  { type: 'loss_coins', value: 100, label: 'Lose 100 Coins', weight: 20 },
  { type: 'loss_coins', value: 200, label: 'Lose 200 Coins', weight: 10 },
  { type: 'loss_powerup', label: 'Lose a Power-up', weight: 17 },
];

const CARD_VALUES: {[key: number]: string} = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const CARD_SUITS: {[key: number]: {symbol: string, color: string}} = {
    0: { symbol: '♥', color: 'text-red-500' },
    1: { symbol: '♦', color: 'text-red-500' },
    2: { symbol: '♣', color: 'text-black' },
    3: { symbol: '♠', color: 'text-black' },
};

const drawCard = (exclude: number | null = null): { value: number, suit: number } => {
    let newValue, newSuit;
    do {
        newValue = Math.floor(Math.random() * 13) + 2;
        newSuit = Math.floor(Math.random() * 4);
    } while (newValue === exclude);
    return { value: newValue, suit: newSuit };
};

const BETTABLE_GAMES = [
    { type: Game.SKY_SQUID, name: 'Sky Squid', icon: <SquidIcon className="w-16 h-16 text-orange-400" /> },
    { type: Game.TUG_OF_WAR, name: 'Tug of War', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2v2m0-2h2m-2 0H8m4 12v2m0-2v-2m0 2h2m-2 0h-2m-6-4h.01M6 12h.01M6 16h.01M18 8h.01M18 12h.01M18 16h.01M6 8h.01M12 8h.01M12 16h.01" />
      </svg>
    )},
    { type: Game.FIVE_LEGGED_PANTETHALON, name: '5 Legged Pantethalon', icon: <PentagonIcon className="w-16 h-16 text-indigo-400" /> },
    { type: Game.JUMP_ROPE, name: 'Jump Rope', icon: <JumpRopeIcon className="w-16 h-16 text-green-400" /> },
    { type: Game.DALGONA, name: 'Dalgona Challenge', icon: <StarIcon className="w-16 h-16 text-yellow-400"/> },
    { type: Game.MARBLES, name: 'Marbles', icon: <MarbleIcon className="w-16 h-16" /> },
    { type: Game.SQUID_GAME, name: 'Squid Game', icon: <SquidOutlineIcon className="w-16 h-16 text-pink-400" /> }
];

interface BetGameCardProps {
    game: Game;
    title: string;
    icon: React.ReactNode;
    onStartBet: (game: Game, amount: number) => void;
    coins: number;
}

const BetGameCard: React.FC<BetGameCardProps> = ({ game, title, icon, onStartBet, coins }) => {
    const [betAmount, setBetAmount] = useState(50);

    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amount = parseInt(e.target.value, 10);
        setBetAmount(isNaN(amount) ? 0 : amount);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 flex flex-col items-center text-center">
            <div className="mb-4">{icon}</div>
            <h4 className="text-xl font-bold text-white my-2">{title}</h4>
            <div className="flex items-center w-full my-4">
                <input type="number" value={betAmount} onChange={handleBetChange} className="w-full p-2 bg-gray-700 rounded-l-md text-white text-center" />
                <span className="p-2 bg-gray-600 rounded-r-md"><CoinIcon className="w-5 h-5 text-yellow-400" /></span>
            </div>
            <button
                onClick={() => onStartBet(game, betAmount)}
                disabled={coins < betAmount || betAmount <= 0}
                className="w-full px-6 py-3 bg-green-600 rounded-md text-white font-bold text-lg transition-all hover:bg-green-700 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Place Bet & Play
            </button>
        </div>
    );
};

const Shop: React.FC<ShopProps> = ({ coins, powerups, spendCoins, addCoins, addPowerup, loseRandomPowerup, onBackToLobby, onStartBet }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  // Coin Flip State
  const [flipBet, setFlipBet] = useState(50);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<'Heads' | 'Tails' | null>(null);
  const [flipMessage, setFlipMessage] = useState<string>('Choose Heads or Tails');

  // High-Low State
  const [highLowBet, setHighLowBet] = useState(50);
  const [currentCard, setCurrentCard] = useState<{value: number, suit: number} | null>(null);
  const [nextCard, setNextCard] = useState<{value: number, suit: number} | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [highLowMessage, setHighLowMessage] = useState<string>("Will the next card be higher or lower?");

  useEffect(() => {
    setCurrentCard(drawCard());
  }, []);

  const handlePurchase = (type: PowerupType, cost: number) => {
    if (coins >= cost) {
      if (spendCoins(cost)) {
        addPowerup(type);
      }
    } else {
      alert("Not enough coins!");
    }
  };

  const handleSpin = () => {
    if (coins < 100 || isSpinning) return;
    if (!spendCoins(100)) return;

    setIsSpinning(true);
    setSpinResult(null);

    setTimeout(() => {
      const totalWeight = SLOT_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
      let random = Math.random() * totalWeight;
      let chosenPrize;
      for (const prize of SLOT_PRIZES) {
        if (random < prize.weight) {
          chosenPrize = prize;
          break;
        }
        random -= prize.weight;
      }

      if (chosenPrize) {
        switch (chosenPrize.type) {
          case 'powerup':
            addPowerup(chosenPrize.value as PowerupType);
            setSpinResult(`You won: ${chosenPrize.label}!`);
            break;
          case 'coins':
            addCoins(chosenPrize.value as number);
            setSpinResult(`You won: ${chosenPrize.value} Coins!`);
            break;
          case 'loss_coins':
            spendCoins(chosenPrize.value as number);
            setSpinResult(`You lost ${chosenPrize.value} Coins...`);
            break;
          case 'loss_powerup':
            const lostPowerupType = loseRandomPowerup();
            if (lostPowerupType) {
              const powerupName = POWERUP_CATALOG.find(p => p.type === lostPowerupType)?.name || 'a power-up';
              setSpinResult(`You lost: ${powerupName}...`);
            } else {
              setSpinResult("Tried to take a power-up, but you had none! Lucky!");
            }
            break;
        }
      }
      setIsSpinning(false);
    }, 2000);
  };
  
  const handleCoinFlip = (choice: 'Heads' | 'Tails') => {
      if (coins < flipBet || isFlipping || flipBet <= 0) return;
      if (!spendCoins(flipBet)) return;

      setIsFlipping(true);
      setFlipResult(null);
      setFlipMessage('Flipping...');

      setTimeout(() => {
          const result: 'Heads' | 'Tails' = Math.random() < 0.5 ? 'Heads' : 'Tails';
          setFlipResult(result);
          if(result === choice) {
              addCoins(flipBet * 2);
              setFlipMessage(`It's ${result}! You win ${flipBet * 2} coins!`);
          } else {
              setFlipMessage(`It's ${result}. You lost ${flipBet} coins.`);
          }
          setIsFlipping(false);
      }, 1500);
  };

  const handleHighLow = (choice: 'higher' | 'lower') => {
      if (!currentCard || coins < highLowBet || isDealing || highLowBet <= 0) return;
      if (!spendCoins(highLowBet)) return;

      setIsDealing(true);
      setNextCard(null);
      setHighLowMessage('Drawing...');

      setTimeout(() => {
          const newCard = drawCard(currentCard.value);
          setNextCard(newCard);

          const isWin = (choice === 'higher' && newCard.value > currentCard.value) || (choice === 'lower' && newCard.value < currentCard.value);
          
          if (isWin) {
              addCoins(highLowBet * 2);
              setHighLowMessage(`It's a ${CARD_VALUES[newCard.value]}! You win ${highLowBet * 2} coins!`);
          } else {
              setHighLowMessage(`It's a ${CARD_VALUES[newCard.value]}. You lose.`);
          }

          setCurrentCard(newCard);
          setIsDealing(false);

      }, 1500);
  };

  return (
    <div className="w-full flex flex-col items-center p-4">
      <h2 className="text-5xl font-bold mb-4 text-pink-400">Shop</h2>
      <div className="flex items-center bg-gray-800 border-2 border-yellow-400 rounded-full px-6 py-2 shadow-lg mb-8">
        <CoinIcon className="w-8 h-8 text-yellow-400 mr-3" />
        <span className="text-3xl font-bold text-white">{coins}</span>
      </div>

      <div className="w-full border-b-2 border-gray-700 pb-8 mb-8">
        <h3 className="text-3xl font-bold mb-6 text-cyan-400 text-center">Gambling Area</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Slot Machine */}
            <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 flex flex-col items-center text-center lg:col-span-1">
                <h4 className="text-2xl font-bold text-white mb-2">Squid Slots</h4>
                <p className="text-gray-400 mb-4 h-12">Spin for a chance to win prizes or lose it all!</p>
                <div className="w-full h-24 bg-gray-900/50 rounded-lg flex items-center justify-center mb-4 border border-gray-600">
                    {isSpinning ? (
                        <span className="text-2xl font-bold text-white animate-pulse">Spinning...</span>
                    ) : spinResult ? (
                        <span className="text-xl font-bold text-yellow-300 px-2">{spinResult}</span>
                    ) : (
                        <span className="text-xl text-gray-500">Press Spin to Start</span>
                    )}
                </div>
                <button
                    onClick={handleSpin}
                    disabled={coins < 100 || isSpinning}
                    className="w-full px-6 py-3 bg-pink-600 rounded-md text-white font-bold text-lg transition-all hover:bg-pink-700 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Spin for 100 <CoinIcon className="w-5 h-5 inline-block ml-1 mb-1"/>
                </button>
            </div>
            {/* Coin Flip */}
            <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 flex flex-col items-center text-center lg:col-span-1">
                <h4 className="text-2xl font-bold text-white mb-2">Coin Flip</h4>
                <p className="text-gray-400 mb-4 h-12">Double your bet or lose it. A 50/50 chance!</p>
                <div className="w-full h-24 flex items-center justify-center mb-4">
                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-transform duration-1000 ${isFlipping ? 'animate-spin' : ''}`} style={{transformStyle: 'preserve-3d'}}>
                        {flipResult ? <span className={`text-2xl font-bold ${flipResult === 'Heads' ? 'text-cyan-400' : 'text-yellow-400'}`}>{flipResult}</span> : <span className="text-4xl font-bold text-white">?</span>}
                    </div>
                </div>
                <p className="text-lg text-yellow-300 font-semibold mb-2 h-8">{flipMessage}</p>
                 <div className="flex items-center w-full mb-4">
                    <input type="number" value={flipBet} onChange={e => setFlipBet(Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-2 bg-gray-700 rounded-l-md text-white text-center" />
                    <span className="p-2 bg-gray-600 rounded-r-md"><CoinIcon className="w-5 h-5 text-yellow-400" /></span>
                </div>
                <div className="flex gap-4 w-full">
                    <button onClick={() => handleCoinFlip('Heads')} disabled={isFlipping || coins < flipBet || flipBet <= 0} className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 rounded-md disabled:bg-gray-600">Heads</button>
                    <button onClick={() => handleCoinFlip('Tails')} disabled={isFlipping || coins < flipBet || flipBet <= 0} className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 rounded-md disabled:bg-gray-600">Tails</button>
                </div>
            </div>
             {/* High/Low */}
            <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 flex flex-col items-center text-center lg:col-span-1">
                <h4 className="text-2xl font-bold text-white mb-2">High / Low</h4>
                 <p className="text-gray-400 mb-4 h-12">Guess if the next card is higher or lower. (Aces high, tie is a loss).</p>
                <div className="w-full h-24 flex items-center justify-center gap-4 mb-4">
                    {currentCard && <div className="w-16 h-24 bg-white rounded-md flex flex-col justify-between p-1 text-2xl font-bold">
                        <span className={CARD_SUITS[currentCard.suit].color}>{CARD_VALUES[currentCard.value]}</span>
                        <span className={`self-center ${CARD_SUITS[currentCard.suit].color}`}>{CARD_SUITS[currentCard.suit].symbol}</span>
                    </div>}
                    <div className={`w-16 h-24 rounded-md flex flex-col justify-between p-1 text-2xl font-bold ${isDealing ? 'bg-gray-500 animate-pulse' : 'bg-white'}`}>
                        {nextCard ? <>
                            <span className={CARD_SUITS[nextCard.suit].color}>{CARD_VALUES[nextCard.value]}</span>
                            <span className={`self-center ${CARD_SUITS[nextCard.suit].color}`}>{CARD_SUITS[nextCard.suit].symbol}</span>
                        </> : <span className="m-auto text-4xl text-gray-700">?</span>}
                    </div>
                </div>
                <p className="text-lg text-yellow-300 font-semibold mb-2 h-8">{highLowMessage}</p>
                <div className="flex items-center w-full mb-4">
                    <input type="number" value={highLowBet} onChange={e => setHighLowBet(Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-2 bg-gray-700 rounded-l-md text-white text-center" />
                    <span className="p-2 bg-gray-600 rounded-r-md"><CoinIcon className="w-5 h-5 text-yellow-400" /></span>
                </div>
                <div className="flex gap-4 w-full">
                    <button onClick={() => handleHighLow('higher')} disabled={isDealing || coins < highLowBet || highLowBet <= 0} className="w-full py-2 bg-green-500 hover:bg-green-600 rounded-md disabled:bg-gray-600">Higher</button>
                    <button onClick={() => handleHighLow('lower')} disabled={isDealing || coins < highLowBet || highLowBet <= 0} className="w-full py-2 bg-red-500 hover:bg-red-600 rounded-md disabled:bg-gray-600">Lower</button>
                </div>
            </div>
        </div>
      </div>
      
      <div className="w-full border-b-2 border-gray-700 pb-8 mb-8">
        <h3 className="text-3xl font-bold text-center mb-6 text-cyan-400">High-Stakes Challenges</h3>
        <p className="text-gray-300 text-center mb-8">Bet coins on a game. Win and you double your bet, lose and it's gone.</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BETTABLE_GAMES.map(game => (
                <BetGameCard
                    key={game.type}
                    game={game.type}
                    title={game.name}
                    icon={game.icon}
                    onStartBet={onStartBet}
                    coins={coins}
                />
            ))}
        </div>
      </div>

      <h3 className="text-3xl font-bold mb-6 text-cyan-400">Consumables</h3>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {POWERUP_CATALOG.map((item) => (
          <div key={item.type} className={`bg-gray-800 p-6 rounded-lg border-2 border-gray-700 flex flex-col items-center text-center ${item.disabled ? 'opacity-50' : ''}`}>
            <div className="mb-4">{item.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
            <p className="text-gray-400 mb-4 h-16">{item.description}</p>
            <div className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
              <CoinIcon className="w-5 h-5 mr-1" /> {item.cost}
            </div>
            <div className="text-lg text-white mb-4">Owned: <span className="font-bold">{powerups[item.type]}</span></div>
            <button
              onClick={() => handlePurchase(item.type, item.cost)}
              disabled={coins < item.cost || item.disabled}
              className="w-full mt-auto px-6 py-3 bg-cyan-500 rounded-md text-white font-bold text-lg transition-all hover:bg-cyan-600 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-600"
            >
              {item.disabled ? 'Unavailable' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      <h3 className="text-3xl font-bold mt-12 mb-6 text-cyan-400">Permanent Upgrades</h3>
       <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {PERMANENT_POWERUPS_CATALOG.map((item) => {
            const isOwned = powerups[item.type] > 0;
            return (
              <div key={item.type} className={`bg-gray-800 p-6 rounded-lg border-2 border-cyan-700 flex flex-col items-center text-center ${isOwned ? 'opacity-70' : ''}`}>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                <p className="text-gray-400 mb-4 h-16">{item.description}</p>
                <div className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                  <CoinIcon className="w-5 h-5 mr-1" /> {item.cost}
                </div>
                <button
                  onClick={() => handlePurchase(item.type, item.cost)}
                  disabled={coins < item.cost || isOwned}
                  className="w-full mt-auto px-6 py-3 bg-pink-600 rounded-md text-white font-bold text-lg transition-all hover:bg-pink-700 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-600"
                >
                  {isOwned ? 'Owned' : 'Buy'}
                </button>
              </div>
            )}
        )}
      </div>

      <button onClick={onBackToLobby} className="mt-8 px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold transition-transform hover:scale-105">
        Back to Lobby
      </button>
    </div>
  );
};

export default Shop;