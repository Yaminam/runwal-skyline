// The full site map, grouped the way runwalrealty.com's own footer is (About, Business verticals,
// Insights, Customer corner, then the standalone pages). Shared by the footer directory and the menu.

export type NavLink = { href: string; label: string; external?: boolean };
export type NavGroup = { id: string; title: string; links: NavLink[] };

export const SECTIONS: NavGroup[] = [
  {
    id: "about",
    title: "About us",
    links: [
      { href: "/legacy", label: "About the company" },
      { href: "/legacy#journey", label: "Journey" },
      { href: "/legacy#team", label: "Team" },
      { href: "/about/csr", label: "CSR" },
    ],
  },
  {
    id: "business",
    title: "Business verticals",
    links: [
      { href: "/residences", label: "Residences" },
      { href: "/places#commercial-h", label: "Commercial" },
      { href: "/places#retail-h", label: "Organised retail" },
      { href: "/places#hosp-h", label: "Hospitality" },
    ],
  },
  {
    id: "insights",
    title: "Our insights",
    links: [
      { href: "/legacy#awards", label: "Awards" },
      { href: "/insights", label: "Blogs" },
      { href: "/insights", label: "Digital coverage" },
      { href: "/insights", label: "Media coverage" },
    ],
  },
  {
    id: "customers",
    title: "Customer corner",
    links: [
      { href: "/customers#r-loyalist", label: "R Loyalist" },
      { href: "/customers#specialists", label: "The Specialists" },
    ],
  },
  {
    id: "more",
    title: "Runwal",
    links: [
      { href: "/nri", label: "NRI Corner" },
      { href: "/club-oasis", label: "Club Oasis" },
      { href: "/investors", label: "Investors" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact us" },
      { href: "/faq", label: "FAQs" },
    ],
  },
];
