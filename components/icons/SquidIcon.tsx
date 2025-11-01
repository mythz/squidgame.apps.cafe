import React from 'react';

const SquidIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
        <path d="M7 10l-1.12 2.25a2 2 0 001.08 2.68l4.04 2.02" />
        <path d="M17 10l1.12 2.25a2 2 0 01-1.08 2.68l-4.04 2.02" />
        <circle cx="9" cy="8" r="1" fill="currentColor"/>
        <circle cx="15" cy="8" r="1" fill="currentColor"/>
    </svg>
);

export default SquidIcon;