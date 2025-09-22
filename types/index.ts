export interface User {
  _id: string;
  email: string;
  companyName: string;
  maxSessions?: number;
  category?: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
  rol: 'admin' | 'usuario';
  folders: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Folder {
  _id: string;
  name: string;
  files: File[];
  usuarios: string[];
  parentFolder?: string | null | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
  subfolders?: Folder[];
  totalFiles?: number;
  subfoldersCount?: number;
  category?: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
  nivel?: number;
}

export interface File {
  _id: string;
  name: string;
  description: string;
  url: string;
  tipo: string;
  size: number;
  mimeType: string;
  createdAt: string;
  clienteDestinatario?: {
    _id: string;
    email: string;
    companyName: string;
  };
  googleDriveId?: string;
  folder?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  companyName: string;
  token: string;
  _id: string;
  rol: string;
  email: string;
  category: string;
  folders: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  email: string;
  companyName: string;
  category: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
  folders: string[];
}

export interface CreateNestedFolderData {
  name: string;
  category: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
  description?: string;
  parentFolder?: string | null;
  parentPath?: string[];
  subfolders?: CreateNestedFolderData[];
}

export interface NestedFolderTree {
  _id: string;
  name: string;
  category: string;
  parentFolder?: string | null;
  files: any[];
  subfolders: NestedFolderTree[];
  nivel: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalFolders: number;
  totalFiles: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: User[];
}

export interface FileData {
  nombre: string;
  descripcion: string;
  carpetaId: string;
  archivo: any;
  clienteDestinatario?: string;
}

export interface UserFormData {
  email: string;
  companyName: string;
  category: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
}

export interface EditUserFormData {
  email: string;
  companyName: string;
  maxSessions: number;
  folders: string[];
}
