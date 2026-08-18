import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DEFAULT_USERS } from '../data/initialData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  loginWithGoogleEmail: (email: string, name?: string) => User;
  toggleRole: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addUser: (user: Partial<User>) => User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'reserve_school_current_user';
const STORAGE_KEY_USERS = 'reserve_school_users_list';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch {
      // ignore
    }
    // Default to the school administrator (Prof. Vinicius)
    return DEFAULT_USERS[0];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const loginWithGoogleEmail = (email: string, name?: string): User => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      return existing;
    }

    // Determine default role: if email matches initial admin or contains admin/coord, set as ADMIN
    const isAdminEmail =
      email.toLowerCase().includes('admin') ||
      email.toLowerCase().includes('vinicius') ||
      email.toLowerCase().includes('coordenacao');

    const generatedName = name || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: generatedName,
      email: email.toLowerCase(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      role: isAdminEmail ? 'ADMIN' : 'TEACHER',
      subject: 'Docente Convidado',
      schoolName: 'E.E. Governador Milton Campos',
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    return newUser;
  };

  const toggleRole = () => {
    if (!currentUser) return;
    const newRole: UserRole = currentUser.role === 'ADMIN' ? 'TEACHER' : 'ADMIN';
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, role: newRole };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const addUser = (userData: Partial<User>): User => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name || 'Novo Professor',
      email: userData.email || `professor_${Date.now()}@educacao.mg.gov.br`,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name || 'prof')}`,
      role: userData.role || 'TEACHER',
      subject: userData.subject || 'Geral',
      schoolName: userData.schoolName || 'E.E. Governador Milton Campos',
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin: currentUser?.role === 'ADMIN',
        login,
        logout,
        switchUser,
        loginWithGoogleEmail,
        toggleRole,
        updateUserRole,
        addUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
