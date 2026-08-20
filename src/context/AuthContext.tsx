import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DEFAULT_USERS } from '../data/initialData';
import { detectGenderFromName, getIconForSubject } from '../data/avatars';

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  login: (user: User) => void;
  logout: () => void;
  loginWithCredentials: (email: string, password?: string) => LoginResult;
  loginWithGoogleEmail: (email: string, name?: string) => User;
  changePassword: (userId: string, newPassword: string) => { success: boolean; error?: string };
  toggleRole: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addUser: (user: Partial<User>, autoLogin?: boolean) => User;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateSchoolNameForAllUsers: (schoolName: string) => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'reserve_school_current_user';
const STORAGE_KEY_USERS = 'reserve_school_users_list';

// Helper to normalize user avatar to educational icon (no photos/animals) and set password
function normalizeUser(u: User): User {
  const gender = u.gender || detectGenderFromName(u.name);
  let avatar = u.avatar;

  // Convert old photos or URLs to clean discipline icons
  if (!avatar || avatar.startsWith('http') || avatar.includes('unsplash') || avatar.includes('dicebear')) {
    avatar = getIconForSubject(u.subject);
  }

  const password = u.password || 'educacao123';
  const iconKey = u.iconKey || avatar;

  return {
    ...u,
    gender,
    avatar,
    iconKey,
    password,
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
        const parsed: User = JSON.parse(saved);
        return normalizeUser(parsed);
      }
    } catch {
      // ignore
    }
    // Default to school administrator (Prof. Vinicius) or null
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
    const normalized = normalizeUser(user);
    setCurrentUser(normalized);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const loginWithCredentials = (email: string, password?: string): LoginResult => {
    const trimmedEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!found) {
      return {
        success: false,
        error: `Nenhum professor encontrado com o e-mail "${trimmedEmail}". Verifique o endereço digitado ou solicite cadastro à coordenação.`,
      };
    }

    const expectedPassword = found.password || 'educacao123';
    const providedPassword = (password || '').trim();

    // If password provided and does not match
    if (providedPassword && providedPassword !== expectedPassword) {
      return {
        success: false,
        error: 'Senha incorreta para esta conta de professor. A senha padrão inicial é "educacao123".',
      };
    }

    const normalized = normalizeUser(found);
    setCurrentUser(normalized);
    return {
      success: true,
      user: normalized,
    };
  };

  const loginWithGoogleEmail = (email: string, name?: string): User => {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (existing) {
      const normalized = normalizeUser(existing);
      setCurrentUser(normalized);
      return normalized;
    }

    // Determine default role: if email matches initial admin or contains admin/coord, set as ADMIN
    const isAdminEmail =
      trimmedEmail.includes('admin') ||
      trimmedEmail.includes('vinicius') ||
      trimmedEmail.includes('coordenacao');

    const generatedName = name || trimmedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const gender = detectGenderFromName(generatedName);
    const subject = 'Docente Geral';
    const iconAvatar = getIconForSubject(subject);

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: generatedName,
      email: trimmedEmail,
      avatar: iconAvatar,
      iconKey: iconAvatar,
      password: 'educacao123',
      gender: gender,
      role: isAdminEmail ? 'ADMIN' : 'TEACHER',
      subject: subject,
      schoolName: 'E.E. Governador Milton Campos',
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    return newUser;
  };

  const changePassword = (userId: string, newPassword: string): { success: boolean; error?: string } => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'A nova senha deve ter no mínimo 4 caracteres.' };
    }

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        const updated = { ...u, password: newPassword.trim() };
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    });

    setUsers(updatedUsers);
    return { success: true };
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(normalizeUser(found));
    }
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

  const addUser = (userData: Partial<User>, autoLogin: boolean = false): User => {
    // Check if user with this email already exists
    const existingIndex = users.findIndex(
      (u) => userData.email && u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updatedUser: User = normalizeUser({
        ...users[existingIndex],
        ...userData,
        name: userData.name || users[existingIndex].name,
      });
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
    const chosenSubject = userData.subject || 'Geral';
    const chosenAvatar = userData.avatar || userData.iconKey || getIconForSubject(chosenSubject);

    const newUser: User = normalizeUser({
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: rawName,
      email: userData.email || `professor_${Date.now()}@educacao.mg.gov.br`,
      gender: detectedGender,
      avatar: chosenAvatar,
      iconKey: chosenAvatar,
      password: userData.password || 'educacao123',
      role: userData.role || 'TEACHER',
      subject: chosenSubject,
      schoolName: userData.schoolName || currentUser?.schoolName || 'E.E. Governador Milton Campos',
    });

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
          const updated = normalizeUser({ ...u, ...data });
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
    if (users.length <= 1) return;

    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== userId);
      return filtered;
    });

    if (currentUser && currentUser.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUser(normalizeUser(remaining[0]));
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
        loginWithCredentials,
        loginWithGoogleEmail,
        changePassword,
        toggleRole,
        updateUserRole,
        addUser,
        updateUser,
        deleteUser,
        updateSchoolNameForAllUsers,
        switchUser,
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
