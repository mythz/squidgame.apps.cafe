
import React from 'react';

const TriangleIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 22h20L12 2z" />
  </svg>
);

export default TriangleIcon;
