import React from 'react';
import { Game } from '../types';
import CircleIcon from './icons/CircleIcon';
import StarIcon from './icons/StarIcon';
import TriangleIcon from './icons/TriangleIcon';
import UmbrellaIcon from './icons/UmbrellaIcon';
import EyeIcon from './icons/EyeIcon';
import UsersIcon from './icons/UsersIcon';
import GlassBridgeIcon from './icons/GlassBridgeIcon';
import TrophyIcon from './icons/TrophyIcon';
import SquidIcon from './icons/SquidIcon';
import CoinIcon from './icons/CoinIcon';
import PentagonIcon from './icons/PentagonIcon';
import JumpRopeIcon from './icons/JumpRopeIcon';
import MarbleIcon from './icons/MarbleIcon';
import SquidOutlineIcon from './icons/SquidOutlineIcon';

interface LobbyProps {
  onGameSelect: (game: Game) => void;
  coins: number;
}

const GuardIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);


const Lobby: React.FC<LobbyProps> = ({ onGameSelect, coins }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div>
          <GuardIcon />
          <div className="absolute top-2 right-2 flex items-center bg-gray-800 border-2 border-yellow-400 rounded-full px-4 py-1 shadow-lg">
              <CoinIcon className="w-6 h-6 text-yellow-400 mr-2" />
              <span className="text-xl font-bold text-white">{coins}</span>
          </div>
      </div>
      <h1 className="text-5xl md:text-7xl font-bold text-white tracking-wider mt-4" style={{fontFamily: `'Squid Game', sans-serif`}}>
        SQUID GAME
      </h1>
      <p className="text-gray-300 mt-4 mb-12 text-lg">Select a challenge to begin, or visit the shop.</p>
      
      <div className="flex flex-wrap justify-center gap-8 w-full max-w-5xl">
        <GameCard 
          title="Red Light, Green Light" 
          onClick={() => onGameSelect(Game.RED_LIGHT_GREEN_LIGHT)}
          icon={<div className="w-12 h-12 bg-green-500 rounded-full" />}
        />
        <GameCard 
          title="Dalgona Challenge" 
          onClick={() => onGameSelect(Game.DALGONA)}
          icon={<StarIcon className="w-12 h-12 text-yellow-400"/>}
        />
        <GameCard 
          title="Tug of War" 
          onClick={() => onGameSelect(Game.TUG_OF_WAR)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2v2m0-2h2m-2 0H8m4 12v2m0-2v-2m0 2h2m-2 0h-2m-6-4h.01M6 12h.01M6 16h.01M18 8h.01M18 12h.01M18 16h.01M6 8h.01M12 8h.01M12 16h.01" />
            </svg>
          }
        />
        <GameCard 
          title="Hide and Seek" 
          onClick={() => onGameSelect(Game.HIDE_AND_SEEK)}
          icon={<EyeIcon className="w-12 h-12 text-blue-400" />}
        />
        <GameCard 
          title="Mingle" 
          onClick={() => onGameSelect(Game.MINGLE)}
          icon={<UsersIcon className="w-12 h-12 text-purple-400" />}
        />
        <GameCard 
          title="Glass Bridge" 
          onClick={() => onGameSelect(Game.GLASS_BRIDGE)}
          icon={<GlassBridgeIcon className="w-12 h-12 text-cyan-400" />}
        />
        <GameCard 
          title="Sky Squid" 
          onClick={() => onGameSelect(Game.SKY_SQUID)}
          icon={<SquidIcon className="w-12 h-12 text-orange-400" />}
        />
        <GameCard 
          title="5 Legged Pantethalon" 
          onClick={() => onGameSelect(Game.FIVE_LEGGED_PANTETHALON)}
          icon={<PentagonIcon className="w-12 h-12 text-indigo-400" />}
        />
        <GameCard 
          title="Jump Rope" 
          onClick={() => onGameSelect(Game.JUMP_ROPE)}
          icon={<JumpRopeIcon className="w-12 h-12 text-green-400" />}
        />
        <GameCard 
          title="Marbles" 
          onClick={() => onGameSelect(Game.MARBLES)}
          icon={<MarbleIcon className="w-12 h-12" />}
        />
        <GameCard 
          title="Squid Game" 
          onClick={() => onGameSelect(Game.SQUID_GAME)}
          icon={<SquidOutlineIcon className="w-12 h-12 text-pink-400" />}
        />
      </div>
      
      <div className="mt-12 w-full max-w-lg flex flex-col sm:flex-row gap-4">
        <button 
            onClick={() => onGameSelect(Game.CHALLENGE_MODE)}
            className="flex-1 bg-gradient-to-r from-pink-500 to-yellow-500 p-4 rounded-lg border-2 border-transparent hover:border-white transition-all duration-300 ease-in-out transform hover:-translate-y-1 group focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
            <div className="flex items-center justify-center">
                <TrophyIcon className="w-10 h-10 text-white mr-3 transition-transform duration-300 group-hover:scale-110" />
                <div>
                    <h3 className="text-xl font-bold text-white text-left">Challenge Mode</h3>
                    <p className="text-white/80 text-left text-sm">Play all games in a row.</p>
                </div>
            </div>
        </button>
        <button 
            onClick={() => onGameSelect(Game.SHOP)}
            className="flex-1 bg-gray-700 p-4 rounded-lg border-2 border-gray-600 hover:border-cyan-400 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group focus:outline-none focus:ring-4 focus:ring-cyan-300"
        >
            <div className="flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-400 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                    <h3 className="text-xl font-bold text-white text-left">Visit Shop</h3>
                    <p className="text-white/80 text-left text-sm">Buy power-ups with coins.</p>
                </div>
            </div>
        </button>
      </div>
    </div>
  );
};

interface GameCardProps {
    title: string;
    onClick: () => void;
    icon: React.ReactNode;
}

const GameCard: React.FC<GameCardProps> = ({ title, onClick, icon }) => {
    return (
        <button 
            onClick={onClick}
            className="bg-gray-800 p-8 rounded-lg border-2 border-gray-700 hover:border-pink-500 transition-all duration-300 ease-in-out transform hover:-translate-y-2 group focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 w-full sm:w-64"
        >
            <div className="flex flex-col items-center justify-center h-full">
                <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                    {icon}
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
            </div>
        </button>
    );
}

export default Lobby;