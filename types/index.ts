export interface User {
  _id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  rol: 'admin' | 'user';
  folders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  files: string[];
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
  nombres: string;
  apellidos: string;
  token: string;
  _id: string;
  rol: string;
  email: string;
  telefono: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  folders: string[];
}
