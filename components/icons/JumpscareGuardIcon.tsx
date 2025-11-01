import React from 'react';

const JumpscareGuardIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#0a0a0a"/>
        
        {/* Glowing Red Eyes */}
        <circle cx="9" cy="10" r="2.5" fill="#ff0000" opacity="0.5" />
        <circle cx="15" cy="10" r="2.5" fill="#ff0000" opacity="0.5" />
        <circle cx="9" cy="10" r="1" fill="#ffaaaa"/>
        <circle cx="15" cy="10" r="1" fill="#ffaaaa"/>
        
        {/* Jagged Mouth */}
        <path d="M7 14.5 L 9 16 L 11 14.5 L 13 16 L 15 14.5 L 17 16 L 17 17.5 L 7 17.5 Z" fill="#b91c1c"/>

        {/* More Pronounced Cracks */}
        <path d="M14 3 L12 7 L15 9 L13 12" stroke="#333" strokeWidth="0.75" fill="none"/>
        <path d="M5 8 L8 9 L6 11" stroke="#333" strokeWidth="0.75" fill="none"/>
        <path d="M18 7 L16 9" stroke="#333" strokeWidth="0.75" fill="none"/>
    </svg>
);

export default JumpscareGuardIcon;