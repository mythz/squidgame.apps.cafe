import React from 'react';

const MarbleIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill="#4ade80" />
    <circle cx="8" cy="16" r="4" fill="#3b82f6" />
    <circle cx="17" cy="15" r="5" fill="#facc15" />
    <circle cx="12" cy="12" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    <circle cx="8" cy="16" r="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <circle cx="17" cy="15" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
  </svg>
);

export default MarbleIcon;
