export interface User {
  _id: string;
  email: string;
  companyName: string;
  maxSessions: number;
  rol: 'admin' | 'user' | 'usuario';
  folders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  parentFolder?: string | null;
  files: string[];
  usuarios: string[];
  createdAt: string;
  updatedAt: string;
}

export interface File {
  _id: string;
  name: string;
  url: string;
  description?: string;
  folder: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  companyName: string;
  token: string;
  _id: string;
  rol: string;
  email: string;
  maxSessions: number;
  folders: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  email: string;
  companyName: string;
  maxSessions?: number;
  folders: string[];
}
