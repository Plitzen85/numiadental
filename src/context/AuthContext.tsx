import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StaffMember } from './MarketContext';

interface AuthContextType {
    currentUser: StaffMember | null;
    login: (email: string, password: string, staff: StaffMember[]) => boolean;
    logout: () => void;
    refreshUser: (newUserData: StaffMember) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    login: () => false,
    logout: () => { },
    refreshUser: () => { },
    isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

const SESSION_KEY = 'numia_current_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
            try { return JSON.parse(saved); } catch { return null; }
        }
        return null;
    });

    const login = (email: string, password: string, staff: StaffMember[]): boolean => {
        const match = staff.find(
            s => s.email.toLowerCase() === email.toLowerCase() && s.password === password
        );
        if (match) {
            setCurrentUser(match);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(match));
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem(SESSION_KEY);
    };

    const refreshUser = (newUserData: StaffMember) => {
        setCurrentUser(newUserData);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUserData));
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, refreshUser, isAuthenticated: !!currentUser }}>
            {children}
        </AuthContext.Provider>
    );
};
