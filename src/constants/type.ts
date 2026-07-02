export interface NavMenuItem {
  id: string;
  title: string;
  slug: string;
  adminOnly?: boolean;
}

export interface NavMenuGroup {
  id: string;
  label: string;
  children: NavMenuItem[];
}
