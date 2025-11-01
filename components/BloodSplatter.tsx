import React from 'react';

const BloodSplatter: React.FC = () => {
  const droplets = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    size: Math.random() * 30 + 10, // Increased size range
    x: Math.random() * 300 - 150, // Increased spread
    y: Math.random() * 300 - 150, // Increased spread
    delay: Math.random() * 0.4, // Slower splatter effect
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      {/* Red flash overlay */}
      <div className="absolute inset-0 animate-red-flash" />
      <div className="relative w-64 h-64"> {/* Increased container size for spread */}
        {droplets.map(d => (
          <div
            key={d.id}
            className="absolute bg-red-600/90 rounded-full animate-splatter"
            style={{
              width: `${d.size}px`,
              height: `${d.size}px`,
              left: `calc(50% + ${d.x}px)`,
              top: `calc(50% + ${d.y}px)`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BloodSplatter;