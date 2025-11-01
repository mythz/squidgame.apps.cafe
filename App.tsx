import React, { useState, useCallback } from 'react';
import { Game } from './types';
import Lobby from './components/Lobby';
import RedLightGreenLightGame from './components/RedLightGreenLightGame';
import DalgonaGame from './components/DalgonaGame';
import TugOfWarGame from './components/TugOfWarGame';
import HideAndSeekGame from './components/HideAndSeekGame';
import MingleGame from './components/MingleGame';
import GlassBridgeGame from './components/GlassBridgeGame';
import SkySquidGame from './components/SkySquidGame';
import Shop from './components/Shop';
import { useGameData } from './hooks/useGameData';
import FiveLeggedPantethalonGame from './components/FiveLeggedPantethalonGame';
import JumpRopeGame from './components/JumpRopeGame';
import MarblesGame from './components/MarblesGame';
import SquidGameGame from './components/SquidGameGame';

const ChallengeStatusOverlay: React.FC<{
  status: 'transition' | 'won' | 'lost';
  stage: number;
  nextGameName: string;
  onAdvance: () => void;
  onBackToLobby: () => void;
}> = ({ status, stage, nextGameName, onAdvance, onBackToLobby }) => {
    const messages = {
        transition: {
            title: `Stage ${stage + 1} Cleared!`,
            subtitle: `You earned 100 coins. Next up: ${nextGameName}.`,
            buttonText: 'Start Next Game',
            action: onAdvance,
        },
        won: {
            title: 'Challenge Complete!',
            subtitle: 'You survived all games and earned a 200 coin bonus!',
            buttonText: 'Back to Lobby',
            action: onBackToLobby,
        },
        lost: {
            title: 'Eliminated!',
            subtitle: 'You have been eliminated from the challenge.',
            buttonText: 'Back to Lobby',
            action: onBackToLobby,
        },
    };
    const currentMessage = messages[status];

    return (
        <div className="w-full h-full flex items-center justify-center min-h-[500px]">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-12 text-center shadow-2xl">
              <h2 className="text-5xl font-bold text-white mb-4">{currentMessage.title}</h2>
              <p className="text-gray-300 text-xl mb-8">{currentMessage.subtitle}</p>
              <button onClick={currentMessage.action} className="px-8 py-3 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold text-lg transition-transform hover:scale-105">
                  {currentMessage.buttonText}
              </button>
          </div>
        </div>
    );
};


const App: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<Game>(Game.LOBBY);
  const [gameMode, setGameMode] = useState<'normal' | 'challenge' | 'betting'>('normal');
  const [challengeStage, setChallengeStage] = useState(0);
  const [challengeStatus, setChallengeStatus] = useState<'playing' | 'transition' | 'won' | 'lost'>('playing');
  const [bet, setBet] = useState<{ amount: number } | null>(null);
  
  const gameData = useGameData();

  const CHALLENGE_SEQUENCE = [Game.RED_LIGHT_GREEN_LIGHT, Game.DALGONA, Game.FIVE_LEGGED_PANTETHALON, Game.JUMP_ROPE, Game.TUG_OF_WAR, Game.MARBLES, Game.MINGLE, Game.SKY_SQUID, Game.SQUID_GAME];

  const handleBackToLobby = useCallback(() => {
    setCurrentGame(Game.LOBBY);
    setGameMode('normal');
    setChallengeStage(0);
    setBet(null);
    setChallengeStatus('playing');
  }, []);

  const handleGameSelect = useCallback((game: Game) => {
    if (game === Game.CHALLENGE_MODE) {
      setGameMode('challenge');
      setChallengeStage(0);
      setChallengeStatus('playing');
      setCurrentGame(CHALLENGE_SEQUENCE[0]);
    } else {
      setGameMode('normal');
      setCurrentGame(game);
    }
  }, [CHALLENGE_SEQUENCE]);
  
  const handleStartBet = useCallback((game: Game, amount: number) => {
    if (gameData.spendCoins(amount)) {
      setGameMode('betting');
      setBet({ amount });
      setCurrentGame(game);
      setChallengeStatus('playing');
    } else {
      alert("Not enough coins to place that bet!");
    }
  }, [gameData]);

  const handleWinGame = useCallback(() => {
    if (gameMode === 'betting' && bet) {
      const winnings = bet.amount * 2;
      gameData.addCoins(winnings);
      setChallengeStatus('won');
    } else if (gameMode === 'challenge') {
      gameData.addCoins(100); // Stage clear reward
      if (challengeStage >= CHALLENGE_SEQUENCE.length - 1) {
        gameData.addCoins(200); // Final bonus reward
        setChallengeStatus('won');
      } else {
        setChallengeStatus('transition');
      }
    }
  }, [gameMode, challengeStage, CHALLENGE_SEQUENCE.length, gameData, bet]);

  const handleLoseGame = useCallback(() => {
    if (gameMode === 'challenge' || gameMode === 'betting') {
      setChallengeStatus('lost');
    }
  }, [gameMode]);
  
  const advanceChallenge = useCallback(() => {
    const nextStage = challengeStage + 1;
    if (nextStage < CHALLENGE_SEQUENCE.length) {
      setChallengeStage(nextStage);
      setCurrentGame(CHALLENGE_SEQUENCE[nextStage]);
      setChallengeStatus('playing');
    }
  }, [challengeStage, CHALLENGE_SEQUENCE]);

  const getGameName = (game: Game) => {
    switch(game) {
        case Game.RED_LIGHT_GREEN_LIGHT: return "Red Light, Green Light";
        case Game.DALGONA: return "Dalgona Challenge";
        case Game.TUG_OF_WAR: return "Tug of War";
        case Game.MINGLE: return "Mingle";
        case Game.SKY_SQUID: return "Sky Squid";
        case Game.FIVE_LEGGED_PANTETHALON: return "5 Legged Pantethalon";
        case Game.JUMP_ROPE: return "Jump Rope";
        case Game.MARBLES: return "Marbles";
        case Game.SQUID_GAME: return "Squid Game";
        default: return "";
    }
  }

  const renderGame = () => {
    const isChallengeMode = gameMode === 'challenge';
    const gameProps = {
      ...gameData,
      isChallengeMode,
      gameMode,
      onBackToLobby: handleBackToLobby,
      onWin: handleWinGame,
      onLose: handleLoseGame,
    };

    if (currentGame === Game.LOBBY) {
        return <Lobby onGameSelect={handleGameSelect} coins={gameData.coins} />;
    }

    if (isChallengeMode && challengeStatus !== 'playing') {
        const nextGame = CHALLENGE_SEQUENCE[challengeStage + 1];
        return <ChallengeStatusOverlay 
            status={challengeStatus}
            stage={challengeStage}
            nextGameName={nextGame ? getGameName(nextGame) : ""}
            onAdvance={advanceChallenge}
            onBackToLobby={handleBackToLobby}
        />;
    }

    if (gameMode === 'betting' && bet && (challengeStatus === 'won' || challengeStatus === 'lost')) {
        const wonMessage = {
            title: 'You Won the Bet!',
            subtitle: `You earned ${bet.amount * 2} coins!`,
            buttonText: 'Back to Lobby',
            action: handleBackToLobby,
        };
        const lostMessage = {
            title: 'You Lost the Bet!',
            subtitle: `You lost your ${bet.amount} coin bet.`,
            buttonText: 'Back to Lobby',
            action: handleBackToLobby,
        };
        const currentMessage = challengeStatus === 'won' ? wonMessage : lostMessage;

        return (
            <div className="w-full h-full flex items-center justify-center min-h-[500px]">
              <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-12 text-center shadow-2xl">
                  <h2 className="text-5xl font-bold text-white mb-4">{currentMessage.title}</h2>
                  <p className="text-gray-300 text-xl mb-8">{currentMessage.subtitle}</p>
                  <button onClick={currentMessage.action} className="px-8 py-3 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-bold text-lg transition-transform hover:scale-105">
                      {currentMessage.buttonText}
                  </button>
              </div>
            </div>
        );
    }
    
    switch (currentGame) {
      case Game.RED_LIGHT_GREEN_LIGHT:
        return <RedLightGreenLightGame {...gameProps} />;
      case Game.DALGONA:
        return <DalgonaGame {...gameProps} />;
      case Game.TUG_OF_WAR:
        return <TugOfWarGame {...gameProps} />;
      case Game.HIDE_AND_SEEK:
        return <HideAndSeekGame {...gameProps} />;
      case Game.MINGLE:
        return <MingleGame {...gameProps} />;
      case Game.GLASS_BRIDGE:
        return <GlassBridgeGame {...gameProps} />;
      case Game.SKY_SQUID:
        return <SkySquidGame {...gameProps} />;
      case Game.FIVE_LEGGED_PANTETHALON:
        return <FiveLeggedPantethalonGame {...gameProps} />;
      case Game.JUMP_ROPE:
        return <JumpRopeGame {...gameProps} />;
      case Game.MARBLES:
        return <MarblesGame {...gameProps} />;
      case Game.SQUID_GAME:
        return <SquidGameGame {...gameProps} />;
      case Game.SHOP:
        return <Shop {...gameProps} loseRandomPowerup={gameData.loseRandomPowerup} onStartBet={handleStartBet} />;
      default:
        return <Lobby onGameSelect={handleGameSelect} coins={gameData.coins} />;
    }
  };

  return (
    <main className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        {renderGame()}
      </div>
    </main>
  );
};

export default App;