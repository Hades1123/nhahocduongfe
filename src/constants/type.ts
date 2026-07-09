export interface NavMenuItem {
  id: string;
  title: string;
  slug: string;
  adminOnly?: boolean;
}

export type Role = "GUEST" | "ADMIN" | "DENTIST";
export interface NavMenuGroup {
  id: string;
  label: string;
  children: NavMenuItem[];
  role: Role[];
}