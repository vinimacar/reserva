import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DEFAULT_USERS } from '../data/initialData';
import { detectGenderFromName, getDefaultAvatar } from '../data/avatars';

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
  addUser: (user: Partial<User>, autoLogin?: boolean) => User;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateSchoolNameForAllUsers: (schoolName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'reserve_school_current_user';
const STORAGE_KEY_USERS = 'reserve_school_users_list';

// Helper to normalize user avatar and gender
function normalizeUser(u: User): User {
  const gender = u.gender || detectGenderFromName(u.name);
  let avatar = u.avatar;
  // If Vinicius had the previous mismatched image, fix it
  if (u.id === 'user_vinicius' && avatar.includes('534528741775')) {
    avatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80';
  } else if (!avatar) {
    avatar = getDefaultAvatar(gender, u.name);
  }
  return {
    ...u,
    gender,
    avatar,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map(normalizeUser);
      }
    } catch {
      // ignore
    }
    return DEFAULT_USERS.map(normalizeUser);
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeUser(parsed);
      }
    } catch {
      // ignore
    }
    // Default to the school administrator (Prof. Vinicius)
    return normalizeUser(DEFAULT_USERS[0]);
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
    const gender = detectGenderFromName(generatedName);

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: generatedName,
      email: email.toLowerCase(),
      avatar: getDefaultAvatar(gender, generatedName),
      gender: gender,
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

  const addUser = (userData: Partial<User>, autoLogin: boolean = true): User => {
    // Check if user with this email already exists
    const existingIndex = users.findIndex(
      (u) => userData.email && u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updatedUser: User = {
        ...users[existingIndex],
        ...userData,
        name: userData.name || users[existingIndex].name,
      };
      const newUsers = [...users];
      newUsers[existingIndex] = updatedUser;
      setUsers(newUsers);
      if (autoLogin) {
        setCurrentUser(updatedUser);
      }
      return updatedUser;
    }

    const rawName = userData.name || 'Novo Professor';
    const detectedGender = userData.gender || detectGenderFromName(rawName);
    const chosenAvatar = userData.avatar || getDefaultAvatar(detectedGender, rawName);

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: rawName,
      email: userData.email || `professor_${Date.now()}@educacao.mg.gov.br`,
      gender: detectedGender,
      avatar: chosenAvatar,
      role: userData.role || 'TEACHER',
      subject: userData.subject || 'Geral',
      schoolName: userData.schoolName || currentUser?.schoolName || 'E.E. Governador Milton Campos',
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    if (autoLogin) {
      setCurrentUser(newUser);
    }
    return newUser;
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...data };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string) => {
    // Prevent deleting if it's the last user
    if (users.length <= 1) return;

    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== userId);
      return filtered;
    });

    if (currentUser && currentUser.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
      } else {
        setCurrentUser(null);
      }
    }
  };

  const updateSchoolNameForAllUsers = (schoolName: string) => {
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        schoolName,
      }))
    );
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, schoolName } : null));
    }
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
        updateUser,
        deleteUser,
        updateSchoolNameForAllUsers,
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
