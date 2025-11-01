import { useState, useCallback, useEffect } from 'react';
import { PowerupType } from '../types';

type PowerupInventory = Record<PowerupType, number>;
type TugOfWarStats = {
  wins: number;
  losses: number;
};

const initialCoins = 0;
const initialPowerups: PowerupInventory = {
  [PowerupType.EXTRA_LIFE]: 0,
  [PowerupType.DOUBLE_COINS]: 0,
  [PowerupType.INVISIBILITY]: 0,
  [PowerupType.PERMANENT_EXTRA_LIFE]: 0,
  [PowerupType.PERMANENT_DOUBLE_COINS]: 0,
  [PowerupType.SKIP_GAME]: 0,
};
const initialTugOfWarStats: TugOfWarStats = { wins: 0, losses: 0 };


export const useGameData = () => {
  const [coins, setCoins] = useState<number>(initialCoins);
  const [powerups, setPowerups] = useState<PowerupInventory>(initialPowerups);
  const [tugOfWarStats, setTugOfWarStats] = useState<TugOfWarStats>(initialTugOfWarStats);

  // Load data on initial mount
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem('squid_game_coins');
      const savedPowerups = localStorage.getItem('squid_game_powerups');
      const savedTugOfWarStats = localStorage.getItem('squid_game_tug_of_war_stats');
      
      if (savedCoins) {
        setCoins(JSON.parse(savedCoins));
      }
      if (savedPowerups) {
        const parsedPowerups = JSON.parse(savedPowerups);
        // Ensure new powerups are added to saved data
        setPowerups({ ...initialPowerups, ...parsedPowerups });
      }
      if (savedTugOfWarStats) {
        setTugOfWarStats(JSON.parse(savedTugOfWarStats));
      }
    } catch (error) {
      console.error("Failed to load game data from localStorage", error);
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('squid_game_coins', JSON.stringify(coins));
      localStorage.setItem('squid_game_powerups', JSON.stringify(powerups));
      localStorage.setItem('squid_game_tug_of_war_stats', JSON.stringify(tugOfWarStats));
    } catch (error) {
      console.error("Failed to save game data to localStorage", error);
    }
  }, [coins, powerups, tugOfWarStats]);


  const addCoins = useCallback((amount: number) => {
    const finalAmount = powerups[PowerupType.PERMANENT_DOUBLE_COINS] > 0 ? amount * 2 : amount;
    setCoins(prevCoins => prevCoins + finalAmount);
  }, [powerups]);

  const spendCoins = useCallback((amount: number) => {
    if (coins < amount) {
        return false;
    }
    setCoins(prevCoins => prevCoins - amount);
    return true;
  }, [coins]);

  const addPowerup = useCallback((type: PowerupType) => {
    setPowerups(prevPowerups => ({
      ...prevPowerups,
      [type]: prevPowerups[type] + 1,
    }));
  }, []);

  const usePowerup = useCallback((type: PowerupType) => {
    if (powerups[type] <= 0) {
        return false;
    }
    setPowerups(prevPowerups => ({
      ...prevPowerups,
      [type]: prevPowerups[type] - 1,
    }));
    return true;
  }, [powerups]);

  const loseRandomPowerup = useCallback(() => {
    let powerupLost: PowerupType | null = null;
    setPowerups(prevPowerups => {
      const singleUsePowerups = (Object.keys(prevPowerups) as PowerupType[])
        .filter(type => 
          prevPowerups[type] > 0 &&
          !type.startsWith('permanent')
        );

      if (singleUsePowerups.length > 0) {
        const powerupToLose = singleUsePowerups[Math.floor(Math.random() * singleUsePowerups.length)];
        powerupLost = powerupToLose;
        const newPowerups = { ...prevPowerups, [powerupToLose]: prevPowerups[powerupToLose] - 1 };
        return newPowerups;
      }
      return prevPowerups;
    });
    return powerupLost;
  }, []);
  
  const recordTugOfWarWin = useCallback(() => {
    setTugOfWarStats(prev => ({ ...prev, wins: prev.wins + 1 }));
  }, []);

  const recordTugOfWarLoss = useCallback(() => {
    setTugOfWarStats(prev => ({ ...prev, losses: prev.losses + 1 }));
  }, []);

  return { coins, powerups, addCoins, spendCoins, addPowerup, usePowerup, loseRandomPowerup, tugOfWarStats, recordTugOfWarWin, recordTugOfWarLoss };
};