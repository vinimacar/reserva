import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserApprovalStatus } from '../types';
import { DEFAULT_USERS, DEFAULT_SCHOOLS } from '../data/initialData';
import { detectGenderFromName, getIconForSubject } from '../data/avatars';
import {
  subscribeToUsers,
  saveUserToCloud,
  deleteUserFromCloud,
} from '../services/firestoreSync';
import {
  registerInFirebaseAuth,
  authenticateWithFirebaseAuth,
  signOutFromFirebaseAuth,
  syncAllUsersToFirebaseAuth,
  AuthSyncResult,
} from '../services/firebaseAuthService';
import {
  OWNER_EMAIL,
  OWNER_NAME,
  isOwnerEmail,
  verifyTotpCode,
  isSession2FAVerified,
  setSession2FAVerified,
} from '../services/totp';
import { setErrorLoggerUserContext } from '../services/errorLogger';

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  isDeveloperMode: boolean;
  isOwner: boolean;
  is2FAVerified: boolean;
  login: (user: User) => void;
  logout: () => void;
  loginWithCredentials: (email: string, password?: string, preferredSchoolId?: string) => LoginResult;
  loginWithGoogleEmail: (email: string, name?: string, schoolId?: string, schoolName?: string) => User;
  developerLogin: (input: { email?: string; totpCode: string; password?: string } | string) => { success: boolean; error?: string };
  developerLoginWithGoogle: (googleEmail: string, googleDisplayName?: string) => { success: boolean; error?: string };
  exitDeveloperMode: () => void;
  changePassword: (userId: string, newPassword: string) => { success: boolean; error?: string };
  toggleRole: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<User | null> | void;
  addUser: (user: Partial<User>, autoLogin?: boolean) => User;
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  updateSchoolNameForAllUsers: (schoolName: string, schoolId?: string) => void;
  switchUser: (userId: string) => void;
  resetUsersToDefault: () => void;
  syncUsersToFirebaseAuth: (onProgress?: (current: number, total: number, email: string) => void) => Promise<AuthSyncResult>;
  pendingApprovalUsers: User[];
  approveUser: (userId: string, approvedBy?: string) => void;
  rejectUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'reserve_school_current_user';
const STORAGE_KEY_USERS = 'reserve_school_users_list';
const STORAGE_KEY_DEV_MODE = 'reserve_developer_mode_active';

// Helper to normalize user avatar to educational icon (no photos/animals) and set password
function normalizeUser(u: User): User {
  const isOwner = isOwnerEmail(u.email);
  const gender = u.gender || detectGenderFromName(u.name);
  let avatar = u.avatar;

  // Convert old photos or URLs to clean discipline icons
  if (!avatar || avatar.startsWith('http') || avatar.includes('unsplash') || avatar.includes('dicebear')) {
    avatar = getIconForSubject(u.subject);
  }

  const password = u.password || 'educacao123';
  const iconKey = u.iconKey || avatar;
  const schoolId = u.schoolId || DEFAULT_SCHOOLS[0]?.id || 'school_milton_campos';
  const schoolName = u.schoolName || DEFAULT_SCHOOLS[0]?.name || 'E.E. Governador Milton Campos';

  // REGRA DO PROPRIETÁRIO (ACESSO IRRESTRITO):
  // O proprietário vinicius.machado.carvalho@educacao.mg.gov.br possui acesso irrestrito:
  // SEMPRE cargo ADMIN e aprovação total APPROVED (nunca pendente nem rebaixado).
  let role: UserRole = u.role;
  let approvalStatus: UserApprovalStatus = u.approvalStatus || 'APPROVED';

  if (isOwner) {
    role = 'ADMIN';
    approvalStatus = 'APPROVED';
  }

  return {
    ...u,
    gender,
    avatar,
    iconKey,
    password,
    role,
    schoolId,
    schoolName,
    approvalStatus,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Guarantee owner always has unrestricted ADMIN role and APPROVED status
          const hasOwner = parsed.some((u) => isOwnerEmail(u.email));
          const listWithNormalized = parsed.map((u) => {
            if (isOwnerEmail(u.email)) {
              return {
                ...normalizeUser(u),
                role: 'ADMIN' as UserRole,
                approvalStatus: 'APPROVED' as UserApprovalStatus,
              };
            }
            return normalizeUser(u);
          });
          if (!hasOwner) {
            const ownerSeed = DEFAULT_USERS.find((u) => isOwnerEmail(u.email)) || DEFAULT_USERS[0];
            listWithNormalized.unshift(normalizeUser(ownerSeed));
          }
          return listWithNormalized;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_USERS.map(normalizeUser);
  });

  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DEV_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const [is2FAVerified, setIs2FAVerified] = useState<boolean>(() => isSession2FAVerified());

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed: User = JSON.parse(saved);
        if (parsed && parsed.id && parsed.name) {
          if (parsed.email && isOwnerEmail(parsed.email)) {
            return {
              ...normalizeUser(parsed),
              role: 'ADMIN' as UserRole,
              approvalStatus: 'APPROVED' as UserApprovalStatus,
            };
          }
          return normalizeUser(parsed);
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    if (isDeveloperMode) {
      localStorage.setItem(STORAGE_KEY_DEV_MODE, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_DEV_MODE);
    }
  }, [isDeveloperMode]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      setErrorLoggerUserContext({
        email: currentUser.email,
        id: currentUser.id,
        schoolId: currentUser.schoolId,
      });
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      setErrorLoggerUserContext({
        email: null,
        id: null,
        schoolId: null,
      });
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  // Real-time synchronization with Cloud Firestore for Users
  useEffect(() => {
    const unsubscribe = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        const normalizedList = cloudUsers.map((u) => {
          if (u.email && isOwnerEmail(u.email)) {
            return {
              ...normalizeUser(u),
              role: 'ADMIN' as UserRole,
              approvalStatus: 'APPROVED' as UserApprovalStatus,
            };
          }
          return normalizeUser(u);
        });

        // Ensure owner is always in the users list
        if (!normalizedList.some((u) => isOwnerEmail(u.email))) {
          const ownerSeed = DEFAULT_USERS.find((u) => isOwnerEmail(u.email)) || DEFAULT_USERS[0];
          normalizedList.unshift(normalizeUser(ownerSeed));
        }

        setUsers(normalizedList);
        // Ensure currentUser is kept in sync with the cloud state
        setCurrentUser((curr) => {
          if (!curr) return null;
          if (isOwnerEmail(curr.email)) {
            const freshOwner = normalizedList.find((u) => isOwnerEmail(u.email));
            return freshOwner || {
              ...curr,
              role: 'ADMIN' as UserRole,
              approvalStatus: 'APPROVED' as UserApprovalStatus,
            };
          }
          const fresh = normalizedList.find((u) => u.id === curr.id || u.email.toLowerCase() === curr.email.toLowerCase());
          return fresh || curr;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for ?logout=true, ?sair=true, or ?limpar=true in URL to clear stored sessions
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') === 'true' || params.get('sair') === 'true' || params.get('limpar') === 'true') {
          setCurrentUser(null);
          setIsDeveloperMode(false);
          localStorage.removeItem(STORAGE_KEY_USER);
          localStorage.removeItem(STORAGE_KEY_DEV_MODE);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const login = (user: User) => {
    const normalized = normalizeUser(user);
    setCurrentUser(normalized);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsDeveloperMode(false);
    setIs2FAVerified(false);
    setSession2FAVerified(false);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_DEV_MODE);
    signOutFromFirebaseAuth();
  };

  const loginWithCredentials = (
    email: string,
    password?: string,
    preferredSchoolId?: string
  ): LoginResult => {
    const trimmedEmail = email.trim().toLowerCase();

    // Look for matching user in users list
    let found = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    // If not found by direct email, check if owner or designated admin in DEFAULT_SCHOOLS
    if (!found) {
      if (isOwnerEmail(trimmedEmail)) {
        const autoOwner: User = normalizeUser({
          id: 'user_vinicius',
          name: OWNER_NAME,
          email: OWNER_EMAIL,
          avatar: 'icon:tech',
          iconKey: 'icon:tech',
          password: password || 'educacao123',
          role: 'ADMIN',
          gender: 'MALE',
          subject: 'Tecnologia & Robótica / Gestão Geral',
          schoolId: preferredSchoolId || DEFAULT_SCHOOLS[0]?.id || 'school_milton_campos',
          schoolName: DEFAULT_SCHOOLS[0]?.name || 'E.E. Governador Milton Campos',
          approvalStatus: 'APPROVED',
        });

        setUsers((prev) => [autoOwner, ...prev.filter((u) => !isOwnerEmail(u.email))]);
        setCurrentUser(autoOwner);
        saveUserToCloud(autoOwner).catch(console.warn);
        registerInFirebaseAuth(autoOwner.email, autoOwner.password, autoOwner.name).catch(console.warn);
        return { success: true, user: autoOwner };
      }

      const schoolWithAdmin = DEFAULT_SCHOOLS.find((s) =>
        s.adminEmails.some((e) => e.toLowerCase() === trimmedEmail)
      );

      if (schoolWithAdmin) {
        // Auto register this school admin
        const name = schoolWithAdmin.directorName || trimmedEmail.split('@')[0].replace('.', ' ');
        const autoUser: User = normalizeUser({
          id: `user_${Date.now()}`,
          name: name.startsWith('Prof') ? name : `Prof. ${name}`,
          email: trimmedEmail,
          avatar: 'icon:tech',
          iconKey: 'icon:tech',
          password: password || 'educacao123',
          role: 'ADMIN',
          schoolId: schoolWithAdmin.id,
          schoolName: schoolWithAdmin.name,
          subject: 'Administração Escolar',
        });

        setUsers((prev) => [...prev, autoUser]);
        setCurrentUser(autoUser);
        registerInFirebaseAuth(autoUser.email, autoUser.password, autoUser.name).catch((err) =>
          console.warn('Auto admin Firebase Auth sync note:', err)
        );
        return { success: true, user: autoUser };
      }

      return {
        success: false,
        error: `Nenhum professor encontrado com o e-mail "${trimmedEmail}". Verifique o endereço digitado ou solicite cadastro ao responsável da sua escola.`,
      };
    }

    // Check if user belongs to preferred school if specified and user has no schoolId
    if (preferredSchoolId && (!found.schoolId || found.schoolId !== preferredSchoolId)) {
      // If user specifically requested a school, update if applicable
      const targetSchool = DEFAULT_SCHOOLS.find((s) => s.id === preferredSchoolId);
      if (targetSchool && !found.schoolId) {
        found = { ...found, schoolId: preferredSchoolId, schoolName: targetSchool.name };
      }
    }

    const expectedPassword = found.password || 'educacao123';
    const providedPassword = (password || '').trim();

    // Require password for credential login to prevent unauthorized access
    if (!providedPassword) {
      return {
        success: false,
        error: 'Por favor, informe sua senha de acesso. Por segurança, não é permitido acessar sem senha.',
      };
    }

    // If password does not match
    if (providedPassword !== expectedPassword) {
      return {
        success: false,
        error: 'Senha incorreta para esta conta de professor. A senha padrão inicial é "educacao123". Se você alterou sua senha e esqueceu, solicite redefinição ao administrador da escola.',
      };
    }

    const normalized = normalizeUser(found);
    setCurrentUser(normalized);

    // Asynchronously authenticate or register in Firebase Authentication
    authenticateWithFirebaseAuth(
      trimmedEmail,
      providedPassword || expectedPassword,
      normalized.name
    ).catch((authErr) => {
      console.warn('Firebase Auth background authentication note:', authErr);
    });

    return {
      success: true,
      user: normalized,
    };
  };

  const loginWithGoogleEmail = (
    email: string,
    name?: string,
    schoolId?: string,
    schoolName?: string
  ): User => {
    const trimmedEmail = email.trim().toLowerCase();
    const isOwner = isOwnerEmail(trimmedEmail);
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (existing) {
      let normalized = normalizeUser(existing);
      if (isOwner) {
        normalized = {
          ...normalized,
          role: 'ADMIN',
          approvalStatus: 'APPROVED',
        };
      }
      setCurrentUser(normalized);
      // Ensure user is in Firebase Auth
      registerInFirebaseAuth(normalized.email, normalized.password, normalized.name).catch((e) =>
        console.warn('Firebase Auth sync note:', e)
      );
      return normalized;
    }

    // Find school by provided schoolId or default
    const matchedSchool = DEFAULT_SCHOOLS.find((s) => s.id === schoolId) || DEFAULT_SCHOOLS[0];
    const targetSchoolId = schoolId || matchedSchool.id;
    const targetSchoolName = schoolName || matchedSchool.name;

    const rawName = name || (isOwner ? OWNER_NAME : trimmedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
    const formattedName = isOwner ? OWNER_NAME : (rawName.startsWith('Prof') ? rawName : `Prof. ${rawName}`);
    const gender = isOwner ? 'MALE' : detectGenderFromName(formattedName);
    const subject = isOwner ? 'Tecnologia & Robótica / Gestão Geral' : 'Docente Geral';
    const iconAvatar = isOwner ? 'icon:tech' : getIconForSubject(subject);

    // REGRA DE ACESSO:
    // O PROPRIETÁRIO (vinicius.machado.carvalho@educacao.mg.gov.br) possui ACESSO IRRESTRITO:
    // entra SEMPRE como Administrador ('ADMIN') e status APROVADO ('APPROVED').
    // Demais professores que acessam pela primeira vez via Google entram como 'TEACHER'
    // e com status 'PENDING' (aguardando liberação pela coordenação).
    const newUser: User = {
      id: isOwner ? 'user_vinicius' : `user_${Date.now()}`,
      name: formattedName,
      email: trimmedEmail,
      avatar: iconAvatar,
      iconKey: iconAvatar,
      password: 'educacao123',
      gender: gender,
      role: isOwner ? 'ADMIN' : 'TEACHER',
      subject: subject,
      schoolId: targetSchoolId,
      schoolName: targetSchoolName,
      approvalStatus: isOwner ? 'APPROVED' : 'PENDING',
      firstLoginAt: new Date().toISOString(),
      authProvider: 'GOOGLE',
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);

    // Save to Firestore and also register in Firebase Authentication
    saveUserToCloud(newUser).catch((e) => console.warn('Cloud user save warning:', e));
    registerInFirebaseAuth(newUser.email, newUser.password, newUser.name).catch((e) =>
      console.warn('Firebase Auth registration warning:', e)
    );

    return newUser;
  };

  const developerLogin = (
    input: { email?: string; totpCode: string; password?: string } | string
  ): { success: boolean; error?: string } => {
    let email = '';
    let totpCode = '';
    let password = '';

    if (typeof input === 'string') {
      totpCode = input.trim();
      email = currentUser?.email || OWNER_EMAIL;
    } else {
      email = (input.email || currentUser?.email || '').trim().toLowerCase();
      totpCode = (input.totpCode || '').trim();
      password = (input.password || '').trim();
    }

    // 1. Strict Owner Check: Only vinicius.machado.carvalho@educacao.mg.gov.br
    if (!isOwnerEmail(email)) {
      return {
        success: false,
        error: `Acesso negado: O Console do Desenvolvedor é de acesso exclusivo do proprietário (${OWNER_EMAIL}). O e-mail informado não possui autorização.`,
      };
    }

    // 2. Google Authenticator TOTP Code Verification
    if (!totpCode) {
      return {
        success: false,
        error: 'Informe o código dinâmico de 6 dígitos gerado pelo Google Authenticator.',
      };
    }

    const totpValidation = verifyTotpCode(totpCode);
    if (!totpValidation.success) {
      return {
        success: false,
        error: totpValidation.error || 'Código do Google Authenticator inválido ou expirado.',
      };
    }

    // 3. Optional password verification if provided or if not already authenticated
    if (password) {
      const validKeys = [
        'educacao123',
        'devmaster',
        'developer2026',
        'master2026#',
        '2026dev',
        'adminmaster',
      ];
      if (!validKeys.includes(password.toLowerCase())) {
        return {
          success: false,
          error: 'Senha do proprietário incorreta. Verifique suas credenciais.',
        };
      }
    }

    // 4. Set developer mode and session 2FA authorization
    setIsDeveloperMode(true);
    setIs2FAVerified(true);
    setSession2FAVerified(true);

    // Provide Vinicius Carvalho session
    const ownerUser: User = users.find((u) => isOwnerEmail(u.email)) || normalizeUser({
      id: 'user_vinicius',
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      avatar: 'icon:tech',
      iconKey: 'icon:tech',
      password: 'educacao123',
      role: 'ADMIN',
      gender: 'MALE',
      schoolId: DEFAULT_SCHOOLS[0]?.id || 'school_milton_campos',
      schoolName: 'E.E. Governador Milton Campos',
      subject: 'Tecnologia & Robótica',
    });

    setCurrentUser(ownerUser);
    return { success: true };
  };

  const developerLoginWithGoogle = (
    googleEmail: string,
    googleDisplayName?: string
  ): { success: boolean; error?: string } => {
    const cleanEmail = (googleEmail || '').trim().toLowerCase();

    // STRICT: Only vinicius.machado.carvalho@educacao.mg.gov.br is authorized
    if (!isOwnerEmail(cleanEmail)) {
      return {
        success: false,
        error: `Acesso negado: O Console do Desenvolvedor é de uso estritamente exclusivo do usuário ${OWNER_EMAIL}. A conta Google conectada (${cleanEmail}) não possui autorização.`,
      };
    }

    setIsDeveloperMode(true);
    setIs2FAVerified(true);
    setSession2FAVerified(true);

    const ownerUser: User = users.find((u) => isOwnerEmail(u.email)) || normalizeUser({
      id: 'user_vinicius',
      name: googleDisplayName || OWNER_NAME,
      email: OWNER_EMAIL,
      avatar: 'icon:tech',
      iconKey: 'icon:tech',
      password: 'educacao123',
      role: 'ADMIN',
      gender: 'MALE',
      schoolId: DEFAULT_SCHOOLS[0]?.id || 'school_milton_campos',
      schoolName: 'E.E. Governador Milton Campos',
      subject: 'Tecnologia & Robótica',
    });

    setCurrentUser(ownerUser);
    return { success: true };
  };

  const exitDeveloperMode = () => {
    setIsDeveloperMode(false);
    setIs2FAVerified(false);
    setSession2FAVerified(false);
    localStorage.removeItem(STORAGE_KEY_DEV_MODE);
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
    // Only allow direct user switching if Developer Mode is active for testing
    if (!isDeveloperMode) {
      console.warn('Troca direta de usuário bloqueada por segurança. Cada usuário deve autenticar individualmente.');
      return;
    }
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(normalizeUser(found));
    }
  };

  const toggleRole = () => {
    if (!currentUser) return;
    const newRole: UserRole = currentUser.role === 'ADMIN' ? 'TEACHER' : 'ADMIN';
    const updated = normalizeUser({ ...currentUser, role: newRole });
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    saveUserToCloud(updated).catch((e) => console.warn('Cloud role toggle warning:', e));
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<User | null> => {
    const target = users.find((u) => u.id === userId);
    if (!target) return null;
    if (isOwnerEmail(target.email)) {
      console.warn('O proprietário do sistema possui cargo irrestrito de ADMIN e não pode ser alterado.');
      return target;
    }

    const updated: User = normalizeUser({
      ...target,
      role: newRole,
    });

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId || (u.email && u.email.toLowerCase() === target.email.toLowerCase())) {
          return { ...updated, id: u.id };
        }
        return u;
      })
    );

    if (
      currentUser &&
      (currentUser.id === userId ||
        (currentUser.email && currentUser.email.toLowerCase() === target.email.toLowerCase()))
    ) {
      setCurrentUser(updated);
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    try {
      await saveUserToCloud(updated);
      console.log(`[Firestore] Permissão de ${updated.name} (${updated.email}) gravada no banco de dados como ${newRole}.`);
    } catch (e) {
      console.error('[Firestore] Erro ao gravar permissão de usuário no banco de dados:', e);
      throw e;
    }

    return updated;
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
      saveUserToCloud(updatedUser).catch((e) => console.warn('Cloud user save warning:', e));
      return updatedUser;
    }

    const rawName = userData.name || 'Novo Professor';
    const formattedName = rawName.startsWith('Prof') ? rawName : `Prof. ${rawName}`;
    const detectedGender = userData.gender || detectGenderFromName(formattedName);
    const chosenSubject = userData.subject || 'Geral';
    const chosenAvatar = userData.avatar || userData.iconKey || getIconForSubject(chosenSubject);

    const newUser: User = normalizeUser({
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: formattedName,
      email: userData.email || `professor_${Date.now()}@educacao.mg.gov.br`,
      gender: detectedGender,
      avatar: chosenAvatar,
      iconKey: chosenAvatar,
      password: userData.password || 'educacao123',
      role: userData.role || 'TEACHER',
      subject: chosenSubject,
      schoolId: userData.schoolId || currentUser?.schoolId || DEFAULT_SCHOOLS[0]?.id || 'school_milton_campos',
      schoolName: userData.schoolName || currentUser?.schoolName || DEFAULT_SCHOOLS[0]?.name || 'E.E. Governador Milton Campos',
    });

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUserToCloud(newUser).catch((e) => console.warn('Cloud user save warning:', e));
    registerInFirebaseAuth(newUser.email, newUser.password, newUser.name).catch((e) =>
      console.warn('Firebase Auth user registration note:', e)
    );
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
          saveUserToCloud(updated).catch((e) => console.warn('Cloud user update warning:', e));
          if (data.password) {
            registerInFirebaseAuth(updated.email, data.password, updated.name).catch((e) =>
              console.warn('Firebase Auth password update note:', e)
            );
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target && isOwnerEmail(target.email)) {
      console.warn('O proprietário do sistema possui acesso irrestrito e não pode ser excluído.');
      return;
    }
    if (users.length <= 1) return;

    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== userId);
      return filtered;
    });
    deleteUserFromCloud(userId).catch((e) => console.warn('Cloud user delete warning:', e));

    if (currentUser && currentUser.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUser(normalizeUser(remaining[0]));
      } else {
        setCurrentUser(null);
      }
    }
  };

  const resetUsersToDefault = () => {
    const defaultNormalized = DEFAULT_USERS.map(normalizeUser);
    setUsers(defaultNormalized);
    localStorage.removeItem(STORAGE_KEY_USERS);
    defaultNormalized.forEach((u) => {
      saveUserToCloud(u).catch(() => {});
      registerInFirebaseAuth(u.email, u.password, u.name).catch(() => {});
    });
  };

  const updateSchoolNameForAllUsers = (schoolName: string, schoolId?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (!schoolId || u.schoolId === schoolId) {
          const updated = {
            ...u,
            schoolName,
          };
          saveUserToCloud(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );
    if (currentUser && (!schoolId || currentUser.schoolId === schoolId)) {
      setCurrentUser((prev) => (prev ? { ...prev, schoolName } : null));
    }
  };

  const approveUser = (userId: string, approvedBy?: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const approvedUser: User = {
      ...target,
      approvalStatus: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: approvedBy || currentUser?.name || 'Coordenação Pedagógica',
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? approvedUser : u)));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(approvedUser);
    }
    saveUserToCloud(approvedUser).catch((e) => console.warn('Cloud user save warning:', e));
  };

  const rejectUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target && isOwnerEmail(target.email)) {
      console.warn('O proprietário do sistema possui acesso irrestrito e não pode ser rejeitado.');
      return;
    }
    deleteUser(userId);
  };

  const pendingApprovalUsers = useMemo(() => {
    return users.filter((u) => u && u.approvalStatus === 'PENDING' && !isOwnerEmail(u.email));
  }, [users]);

  const syncUsersToFirebaseAuth = async (
    onProgress?: (current: number, total: number, email: string) => void
  ): Promise<AuthSyncResult> => {
    return await syncAllUsersToFirebaseAuth(users, onProgress);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin: isOwnerEmail(currentUser?.email) || isDeveloperMode || currentUser?.role === 'ADMIN',
        isDeveloperMode,
        isOwner: isOwnerEmail(currentUser?.email),
        is2FAVerified,
        login,
        logout,
        loginWithCredentials,
        loginWithGoogleEmail,
        developerLogin,
        developerLoginWithGoogle,
        exitDeveloperMode,
        changePassword,
        toggleRole,
        updateUserRole,
        addUser,
        updateUser,
        deleteUser,
        updateSchoolNameForAllUsers,
        switchUser,
        resetUsersToDefault,
        syncUsersToFirebaseAuth,
        pendingApprovalUsers,
        approveUser,
        rejectUser,
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
