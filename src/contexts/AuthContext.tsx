import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshPermissions: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessStore: () => boolean;
  permissionResources: Record<string, string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hasResourcePermission(resources: Record<string, string[]>, resource: string, action: string): boolean {
  const perms = resources[resource];
  if (!perms || perms.length === 0) return false;
  if (perms.includes('all') || perms.includes('*')) return true;
  return perms.includes(action);
}

function checkCanAccessStore(user: User | null, resources: Record<string, string[]>): boolean {
  if (!user) return false;
  if (user.store_id) return true;
  return hasResourcePermission(resources, 'store', 'index');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionResources, setPermissionResources] = useState<Record<string, string[]>>({});

  const loadPermissions = async (userData: User): Promise<Record<string, string[]>> => {
    try {
      const resources: Record<string, string[]> = {};
      
      const globalPermId = userData.global_permission?.id;
      if (globalPermId) {
        try {
          const globalPerm = await api.getGlobalPermission(globalPermId);
          const globalPermsObj = globalPerm.permissions || {};
          Object.entries(globalPermsObj).forEach(([key, actions]) => {
            if (actions && actions.length > 0) {
              resources[key] = actions;
            }
          });
        } catch (e) {
          console.warn('Could not load global permissions:', e);
        }
      }
      
      const branches = userData.branches || [];
      for (const branch of branches) {
        if (branch.role?.id) {
          try {
            const role = await api.getRole(branch.role.id);
            const rolePermsObj = role.permissions || {};
            Object.entries(rolePermsObj).forEach(([key, actions]) => {
              if (actions && actions.length > 0) {
                if (resources[key]) {
                  resources[key] = [...new Set([...resources[key], ...actions])];
                } else {
                  resources[key] = actions;
                }
              }
            });
          } catch (e) {
            console.warn('Could not load role permissions:', e);
          }
        }
      }
      
      console.log('Loaded permission resources:', resources);
      return resources;
    } catch (error) {
      console.error('Error loading permissions:', error);
      return {};
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser && storedUser !== 'undefined') {
        try {
          const parsedUser = JSON.parse(storedUser);
          const freshUser = await api.getUser(parsedUser.id);
          setToken(storedToken);
          setUserState(freshUser);
          const extractedPerms = await loadPermissions(freshUser);
          setPermissionResources(extractedPerms);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUserState(null);
          setPermissionResources({});
        }
      }
      setIsLoading(false);
    };
    initAuth();

    const handleAuthExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUserState(null);
      setPermissionResources({});
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const refreshPermissions = async () => {
    if (!user) return;
    try {
      const freshUser = await api.getUser(user.id);
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUserState(freshUser);
      const extractedPerms = await loadPermissions(freshUser);
      setPermissionResources(extractedPerms);
    } catch (error) {
      console.error('Error refreshing permissionResources:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    
    try {
      const fullUser = await api.getUser(response.user.id);
      localStorage.setItem('user', JSON.stringify(fullUser));
      setUserState(fullUser);
      const extractedPerms = await loadPermissions(fullUser);
      setPermissionResources(extractedPerms);
    } catch {
      localStorage.setItem('token', response.token);
      const basicUser = { id: response.user.id, email: response.user.email } as User;
      localStorage.setItem('user', JSON.stringify(basicUser));
      setUserState(basicUser);
      setPermissionResources({});
    }
  };

  const register = async (data: RegisterData) => {
    const response = await api.register(data);
    localStorage.setItem('token', response.token);
    setToken(response.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedStoreId');
    setToken(null);
    setUserState(null);
    setPermissionResources({});
  };

  const updateUser = async (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUserState(userData);
    const extractedPerms = await loadPermissions(userData);
    setPermissionResources(extractedPerms);
  };

  const hasPermission = useMemo(() => (resource: string, action: string) => {
    return hasResourcePermission(permissionResources, resource, action);
  }, [permissionResources]);

  const canAccessStore = useMemo(() => () => {
    return checkCanAccessStore(user, permissionResources);
  }, [user, permissionResources]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, refreshPermissions, isLoading, hasPermission, canAccessStore, permissionResources }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
