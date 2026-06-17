export interface IUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  status: boolean;
  organization?: {
    id: number;
    name: string;
  };
  roleList?: {
    id: string;
    code: string;
    name: string;
  }[];
}

export interface GenericResponse {
  status: string;
  message: string;
}

export interface ILoginResponse {
  status: string;
  accessToken: string;
  refreshToken: string;
}

export interface IUserResponse {
  status: string;
  data: {
    user: IUser;
  };
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}
