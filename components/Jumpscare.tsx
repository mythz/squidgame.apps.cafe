import React, { useEffect } from 'react';
import JumpscareGuardIcon from './icons/JumpscareGuardIcon';

const playJumpscareSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const now = audioContext.currentTime;
    const duration = 0.7;

    // 1. Bass Drop
    const bassOsc = audioContext.createOscillator();
    const bassGain = audioContext.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(120, now);
    bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    bassGain.gain.setValueAtTime(0.8, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    bassOsc.connect(bassGain).connect(audioContext.destination);
    bassOsc.start(now);
    bassOsc.stop(now + duration);

    // 2. High-pitched Screech
    const screechOsc = audioContext.createOscillator();
    const screechGain = audioContext.createGain();
    screechOsc.type = 'sawtooth';
    screechOsc.frequency.setValueAtTime(800, now);
    screechOsc.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
    screechOsc.frequency.exponentialRampToValueAtTime(600, now + duration);
    screechGain.gain.setValueAtTime(0, now);
    screechGain.gain.linearRampToValueAtTime(0.5, now + 0.02);
    screechGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    screechOsc.connect(screechGain).connect(audioContext.destination);
    screechOsc.start(now);
    screechOsc.stop(now + duration);

    // 3. White Noise Static
    const noiseBufferSize = audioContext.sampleRate * 0.5;
    const noiseBuffer = audioContext.createBuffer(1, noiseBufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.1);
    noiseSource.connect(noiseGain).connect(audioContext.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
};


const Jumpscare: React.FC = () => {

    useEffect(() => {
        playJumpscareSound();
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden animate-screen-flash">
            <div className="animate-jumpscare">
                <JumpscareGuardIcon className="w-[100vw] h-[100vh] text-red-600" />
            </div>
        </div>
    );
};

export default Jumpscare;