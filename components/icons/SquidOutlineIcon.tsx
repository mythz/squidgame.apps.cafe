import React from 'react';

const SquidOutlineIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    {/* Head (Circle) */}
    <circle cx="50" cy="18" r="14" />
    {/* Neck (Triangle) */}
    <path d="M50 32 L38 50 L62 50 Z" />
    {/* Body (Square) */}
    <rect x="38" y="50" width="24" height="30" />
    {/* Bottom shape */}
    <path d="M38 80 L25 95 L50 80 L75 95 L62 80" />
  </svg>
);

export default SquidOutlineIcon;
