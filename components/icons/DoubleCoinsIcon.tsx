import React from 'react';

const DoubleCoinsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 15H9v-2H7v2H5v2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2zm-6-4.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5v-5zM15 4V2H9v2H7v2h2v2h2V6h2V4h2V2h-2V0h-2v2h-2V0H9v2H7v2h2v2h2V6h2V4z" opacity="0.4" />
        <path d="M14 6h-4v2h4V6zm-4-4h4V0h-4v2z" />
        <path d="M19 8.5c0-2.21-1.79-4-4-4h-5c-2.21 0-4 1.79-4 4v5c0 2.21 1.79 4 4 4h5c2.21 0 4-1.79 4-4v-5zm-5 5.5h-5c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
    </svg>
);

export default DoubleCoinsIcon;
