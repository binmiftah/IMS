import React from 'react';

const Button = ({ 
    children, 
    onClick, 
    variant = 'primary', // primary, secondary, icon
    disabled = false,
    className = '',
    icon = null,
    type = 'button'
}) => {
    const baseStyles = "flex items-center justify-center transition-colors";
    
    const variants = {
        primary: "bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed",
        secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400",
        icon: "text-gray-500 hover:text-gray-700"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {icon && <span>{icon}</span>}
            {children}
        </button>
    );
};

export default Button;