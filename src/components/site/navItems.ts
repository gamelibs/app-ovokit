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
    href: "/?all=1&group=difficulty",
  },
  {
    label: "收藏",
    iconPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z",
    href: "/favorites",
  },
];
