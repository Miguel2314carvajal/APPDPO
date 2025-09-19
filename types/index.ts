export interface User {
  _id: string;
  email: string;
  companyName: string;
  category: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
  rol: 'admin' | 'user' | 'usuario';
  folders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  parentFolder?: string | null;
  category: 'profesional_independiente' | 'transporte_escolar' | 'encargador_seguros';
  files: string[];
  usuarios: string[];
  subfolders?: Folder[];
  nivel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  _id: string;
  name: string;
  url: string;
  description?: string;
  folder: string;
  size?: number;
  mimeType?: string;
  googleDriveId?: string;
  createdAt: string;
  updatedAt: string;
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
