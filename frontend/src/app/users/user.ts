export interface UserPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  rol: string;
  activo: boolean;
}

export interface User extends Omit<UserPayload, 'password'> {
  id: number;
}
