import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse, LoginCredentials, RegisterData, User, Store, Branch, Item, Role, GlobalPermission, Category } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface ApiError {
  error: {
    code?: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/sessions')) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
      }
    );
  }

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as ApiError;
      return data.error?.message || 'Error de conexión';
    }
    return 'Error de conexión';
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await this.api.post<AuthResponse>('/sessions', credentials);
    return data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await this.api.post<AuthResponse>('/registration', { user: userData });
    return data;
  }

  async resetPassword(email: string): Promise<void> {
    await this.api.post('/passwords/reset', { email });
  }

  async updatePassword(token: string, password: string, passwordConfirmation: string): Promise<void> {
    await this.api.put('/passwords', {
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  }

  async getUsers(): Promise<User[]> {
    const { data } = await this.api.get<{ users: User[] }>('/users');
    return data.users;
  }

  async getUser(id: number): Promise<User> {
    const { data } = await this.api.get<{ user: User }>(`/users/${id}`);
    return data.user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const { data } = await this.api.patch<{ user: User }>(`/users/${id}`, userData);
    return data.user;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  async getStores(): Promise<Store[]> {
    const { data } = await this.api.get<{ stores: Store[] }>('/stores');
    return data.stores;
  }

  async getStore(id: number): Promise<Store> {
    const { data } = await this.api.get<{ store: Store }>(`/stores/${id}`);
    return data.store;
  }

  async createStore(storeData: Partial<Store>): Promise<Store> {
    const { data } = await this.api.post<{ store: Store }>('/stores', storeData);
    return data.store;
  }

  async updateStore(id: number, storeData: Partial<Store>): Promise<Store> {
    const { data } = await this.api.patch<{ store: Store }>(`/stores/${id}`, storeData);
    return data.store;
  }

  async deleteStore(id: number): Promise<void> {
    await this.api.delete(`/stores/${id}`);
  }

  async getBranches(storeId?: number): Promise<Branch[]> {
    const url = storeId ? `/branches?store_id=${storeId}` : '/branches';
    const { data } = await this.api.get<{ branches: Branch[] }>(url);
    return data.branches;
  }

  async getBranch(id: number): Promise<Branch> {
    const { data } = await this.api.get<{ branch: Branch }>(`/branches/${id}`);
    return data.branch;
  }

  async createBranch(branchData: Partial<Branch>): Promise<Branch> {
    const { data } = await this.api.post<{ branch: Branch }>('/branches', branchData);
    return data.branch;
  }

  async updateBranch(id: number, branchData: Partial<Branch>): Promise<Branch> {
    const { data } = await this.api.patch<{ branch: Branch }>(`/branches/${id}`, branchData);
    return data.branch;
  }

  async deleteBranch(id: number): Promise<void> {
    await this.api.delete(`/branches/${id}`);
  }

  async getBranchUsers(branchId: number): Promise<User[]> {
    const { data } = await this.api.get<{ users: User[] }>(`/branches/${branchId}/users`);
    return data.users;
  }

  async getCategories(): Promise<Category[]> {
    const { data } = await this.api.get<{ categories: Category[] }>('/categories');
    return data.categories;
  }

  async getCategory(id: number): Promise<Category> {
    const { data } = await this.api.get<{ category: Category }>(`/categories/${id}`);
    return data.category;
  }

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const { data } = await this.api.post<{ category: Category }>('/categories', categoryData);
    return data.category;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category> {
    const { data } = await this.api.patch<{ category: Category }>(`/categories/${id}`, categoryData);
    return data.category;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  async getInventory(params?: { branch_id?: number; category_id?: number; active?: string; quantity_status?: string }): Promise<Item[]> {
    const queryParams = new URLSearchParams();
    if (params?.branch_id) queryParams.append('branch_id', String(params.branch_id));
    if (params?.category_id) queryParams.append('category_id', String(params.category_id));
    if (params?.active) queryParams.append('active', params.active);
    if (params?.quantity_status) queryParams.append('quantity_status', params.quantity_status);

    const url = queryParams.toString() ? `/inventory?${queryParams}` : '/inventory';
    const { data } = await this.api.get<{ items: Item[] }>(url);
    return data.items;
  }

  async getItems(params?: { category_id?: number; branch_id?: number; active?: boolean }): Promise<Item[]> {
    const queryParams = new URLSearchParams();
    if (params?.category_id) queryParams.append('category_id', String(params.category_id));
    if (params?.branch_id) queryParams.append('branch_id', String(params.branch_id));
    if (params?.active !== undefined) queryParams.append('active', String(params.active));

    const url = queryParams.toString() ? `/items?${queryParams}` : '/items';
    const { data } = await this.api.get<{ items: Item[] }>(url);
    return data.items;
  }

  async getCategoryItems(categoryId: number, params?: { branch_id?: number; active?: boolean }): Promise<Item[]> {
    const queryParams = new URLSearchParams();
    if (params?.branch_id) queryParams.append('branch_id', String(params.branch_id));
    if (params?.active !== undefined) queryParams.append('active', String(params.active));

    const url = queryParams.toString()
      ? `/categories/${categoryId}/items?${queryParams}`
      : `/categories/${categoryId}/items`;
    const { data } = await this.api.get<{ items: Item[] }>(url);
    return data.items;
  }

  async getBranchItems(branchId: number, params?: { category_id?: number; active?: boolean }): Promise<Item[]> {
    const queryParams = new URLSearchParams();
    if (params?.category_id) queryParams.append('category_id', String(params.category_id));
    if (params?.active !== undefined) queryParams.append('active', String(params.active));

    const url = queryParams.toString()
      ? `/branches/${branchId}/items?${queryParams}`
      : `/branches/${branchId}/items`;
    const { data } = await this.api.get<{ items: Item[] }>(url);
    return data.items;
  }

  async createItem(itemData: Partial<Item> & { category_id?: number }): Promise<Item> {
    const url = itemData.category_id
      ? `/categories/${itemData.category_id}/items`
      : '/items';
    const { data } = await this.api.post<{ item: Item }>(url, itemData);
    return data.item;
  }

  async updateItem(id: number, itemData: Partial<Item> & { branch_id?: number }): Promise<Item> {
    const { branch_id, ...rest } = itemData;
    const url = branch_id ? `/branches/${branch_id}/items/${id}` : `/items/${id}`;
    const { data } = await this.api.patch<{ item: Item }>(url, rest);
    return data.item;
  }

  async deleteItem(id: number, params?: { branch_id?: number; category_id?: number }): Promise<void> {
    let url = `/items/${id}`;
    if (params?.branch_id) {
      url = `/branches/${params.branch_id}/items/${id}`;
    } else if (params?.category_id) {
      url = `/categories/${params.category_id}/items/${id}`;
    }
    await this.api.delete(url);
  }

  async getRoles(): Promise<Role[]> {
    const { data } = await this.api.get<{ roles: Role[] }>('/roles');
    return data.roles;
  }

  async getRole(id: number): Promise<Role> {
    const { data } = await this.api.get<{ role: Role }>(`/roles/${id}`);
    return data.role;
  }

  async createRole(roleData: Partial<Role>): Promise<Role> {
    const { data } = await this.api.post<{ role: Role }>('/roles', roleData);
    return data.role;
  }

  async updateRole(id: number, roleData: Partial<Role>): Promise<Role> {
    const { data } = await this.api.patch<{ role: Role }>(`/roles/${id}`, roleData);
    return data.role;
  }

  async deleteRole(id: number): Promise<void> {
    await this.api.delete(`/roles/${id}`);
  }

  async getGlobalPermissions(): Promise<GlobalPermission[]> {
    const response = await this.api.get('/global_permissions');
    const rawData = response.data as { global_permissions: unknown[] };
    const perms = rawData.global_permissions;
    if (perms.length > 0) {
      const firstItem = perms[0] as Record<string, unknown>;
      if (firstItem.global_permission) {
        return perms.map(p => (p as Record<string, unknown>).global_permission as GlobalPermission);
      }
    }
    return perms as GlobalPermission[];
  }

  async getGlobalPermission(id: number): Promise<GlobalPermission> {
    const { data } = await this.api.get<{ global_permission: GlobalPermission }>(`/global_permissions/${id}`);
    return data.global_permission;
  }

  async createGlobalPermission(permissionData: Partial<GlobalPermission>): Promise<GlobalPermission> {
    const { data } = await this.api.post<{ global_permission: GlobalPermission }>('/global_permissions', permissionData);
    return data.global_permission;
  }

  async updateGlobalPermission(id: number, permissionData: Partial<GlobalPermission>): Promise<GlobalPermission> {
    const { data } = await this.api.patch<{ global_permission: GlobalPermission }>(`/global_permissions/${id}`, permissionData);
    return data.global_permission;
  }

  async deleteGlobalPermission(id: number): Promise<void> {
    await this.api.delete(`/global_permissions/${id}`);
  }

  async manageUser(userId: number, data: Record<string, unknown>): Promise<User> {
    const { data: response } = await this.api.patch<{ user: User }>(`/admin/users/${userId}/manage`, data);
    return response.user;
  }

  async detachUserStore(userId: number): Promise<void> {
    await this.api.delete(`/admin/users/${userId}/store`);
  }

  async revokeUserBranchAccess(userId: number, branchId: number): Promise<void> {
    await this.api.delete(`/admin/users/${userId}/branches/${branchId}`);
  }

  async getUserBranches(): Promise<Branch[]> {
    const { data } = await this.api.get<{ branches: Branch[] }>('/branches');
    return data.branches;
  }

  async getBranchCategories(branchId: number): Promise<Category[]> {
    const { data } = await this.api.get<{ categories: Category[] }>(`/branches/${branchId}/categories`);
    return data.categories;
  }

  async setUserStore(storeId: number): Promise<User> {
    const { data } = await this.api.post<{ user: User }>('/users/set_store', { store_id: storeId });
    return data.user;
  }

  async confirmEmail(token: string): Promise<void> {
    await this.api.patch(`/confirmations/${token}`);
  }
}

export const api = new ApiService();
