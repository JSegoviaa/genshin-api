import { allResources } from "./api";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs/" },
      { label: "Authentication", href: "/docs/authentication/" },
      { label: "Pagination", href: "/docs/pagination/" },
      { label: "Filtering & Sorting", href: "/docs/filtering/" },
      { label: "Errors", href: "/docs/errors/" },
    ],
  },
  {
    title: "Resources",
    items: allResources().map((r) => ({
      label: r.title,
      href: `/docs/resources/${r.name}/`,
    })),
  },
];
