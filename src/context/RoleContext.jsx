import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const { user } = useAuth();
    const [role, setRole] = useState(null);

    useEffect(() => {
        // Assume user.role exists (e.g., 'admin', 'user', etc.)
        if (user && user.role) {
            setRole(user.role);
        } else {
            setRole(null);
        }
    }, [user]);

    return (
        <RoleContext.Provider value={{ role, setRole }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);