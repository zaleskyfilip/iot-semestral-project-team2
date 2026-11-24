import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserRole } from '../types/atmodesq';

const STORAGE_KEY = 'atmodesq_api_key';
const STORAGE_ROLE = 'atmodesq_user_role';

export const DEV_PRESETS: Record<UserRole, string> = {
    ADMIN: 'dev-admin-key',
    USER: 'dev-user-key',
};

interface AuthContextValue {
    apiKey: string;
    userRole: UserRole;
    isAuthenticated: boolean;
    setCredentials: (apiKey: string, role: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [apiKey, setApiKey] = useState<string>(
        () => localStorage.getItem(STORAGE_KEY) ?? ''
    );
    const [userRole, setUserRole] = useState<UserRole>(() => {
        const saved = localStorage.getItem(STORAGE_ROLE);
        return saved === 'ADMIN' ? 'ADMIN' : 'USER';
    });

    const setCredentials = (nextKey: string, nextRole: UserRole) => {
        const trimmed = nextKey.trim();
        localStorage.setItem(STORAGE_KEY, trimmed);
        localStorage.setItem(STORAGE_ROLE, nextRole);
        setApiKey(trimmed);
        setUserRole(nextRole);
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_ROLE);
        setApiKey('');
        setUserRole('USER');
    };

    return (
        <AuthContext.Provider
            value={{
                apiKey,
                userRole,
                isAuthenticated: Boolean(apiKey),
                setCredentials,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return ctx;
}