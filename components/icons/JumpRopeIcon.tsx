import React from 'react';

const JumpRopeIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
    <path d="M16 8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
    <path d="M12 21a8 8 0 0 0-8-8" />
    <path d="M12 21a8 8 0 0 1 8-8" />
  </svg>
);

export default JumpRopeIcon;