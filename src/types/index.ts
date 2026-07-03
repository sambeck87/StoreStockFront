export interface User {
  id: number;
  email: string;
  full_name: string;
  active?: boolean;
  role?: Role;
  branches?: Branch[];
  store_id?: number;
  global_permission_id?: number;
  global_permission?: GlobalPermission;
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
  role?: Role;
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
  role?: Role;
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
  category_name?: string;
  updated_by?: string;
  created_by?: string;
  current_quantity?: number;
  minimum_quantity?: number;
  quantity_status?: 'complete' | 'low' | 'empty' | null;
  branch_id?: number;
  branch_name?: string;
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
  password_confirmation: string;
  full_name: string;
}

export interface InventoryExport {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filters: Record<string, string>;
  error_message: string | null;
  download_url: string | null;
  created_at: string;
}
