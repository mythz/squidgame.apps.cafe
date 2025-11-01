import React from 'react';

interface PatrollingGuardProps {
  position: { x: number; z: number; };
}

const PatrollingGuard: React.FC<PatrollingGuardProps> = ({ position }) => {
  const scale = 0.5 + (position.z / 100) * 0.5;

  return (
    <div
      className="absolute bottom-0"
      aria-hidden="true"
      style={{
        left: `${position.x}%`,
        // The guard is placed "on top" of the floor, using translateZ to position it within the 3D space.
        transform: `translateX(-50%) translateZ(${position.z}px)`,
        zIndex: 40,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Guard Body */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-12"
        style={{
          transform: `scale(${scale})`,
          filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.4))',
        }}
      >
        <div className="w-full h-1/3 bg-pink-300 rounded-full relative">
          {/* Mask shape */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 border-black rounded-full"></div>
        </div>
        <div className="w-full h-2/3 bg-pink-600 rounded-b-md"></div>
      </div>
    </div>
  );
};

export default PatrollingGuard;
