export interface User {
  id: number;
  email: string;
  full_name: string;
  active?: boolean;
  role?: Role;
  branches?: Branch[];
  store_id?: number;
  global_permission_id?: number;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Record<string, string[]>;
}

export interface GlobalPermission {
  id: number;
  name: string;
  description?: string;
  permissions?: Record<string, string[]>;
}

export interface Store {
  id: number;
  name: string;
  manager_name?: string;
  manager_email?: string;
  address?: string;
  phone?: string;
}

export interface Branch {
  id: number;
  name: string;
  phone?: string;
  manager_name?: string;
  manager_email?: string;
  main_branch?: boolean;
  address?: string;
  store_id?: number;
  is_main?: boolean;
}

export interface Item {
  id: number;
  name: string;
  measure?: string;
  cost?: number;
  active?: boolean;
  category_id?: number;
  updated_by?: string;
  created_by?: string;
  current_quantity?: number;
  minimum_quantity?: number;
  price?: number;
  sku?: string;
  stock?: number;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  active?: boolean;
  updated_by?: string;
  created_by?: string;
  description?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
  };
  token: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}
