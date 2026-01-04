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
  {
    label: "发布",
    iconPath: "M12 5v14M5 12h14",
    href: "/mod/new",
    requiresModerator: true,
  },
  {
    label: "通知",
    iconPath:
      "M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z",
    badge: "2",
  },
  {
    label: "我",
    iconPath:
      "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2-8 4.5V21h16v-2.5C20 16 16.4 14 12 14Z",
  },
];
