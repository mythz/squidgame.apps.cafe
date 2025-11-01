import React from 'react';

const PentagonIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5l9.5 7-3.5 11h-12l-3.5-11z"></path>
  </svg>
);

export default PentagonIcon;