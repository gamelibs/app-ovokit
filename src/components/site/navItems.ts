export type NavItem = {
  label: string;
  iconPath: string;
  badge?: string;
  href?: string;
  requiresModerator?: boolean;
};

export const navItems: NavItem[] = [
  {
    label: "发现",
    iconPath: "M12 3l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
    href: "/",
  },
];
