export interface IOrganization {
  name: string;
  areaCode: string;
  address: any;
  classes: any;
  inputClassName: string;
}

export interface IUserInformation {
  id?: number;
  username: string;
  password: string;
  rePassword: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  organizationId: number | null;
  roleIds: number[];
}

export interface IUpdatePassword {
  password: string;
  rePassword: string;
}

export interface IRole {
  id: string;
  code: string;
  name: string;
  description?: string;
}
