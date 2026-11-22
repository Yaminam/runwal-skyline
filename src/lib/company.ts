// Company content for Runwal Realty, taken from runwalrealty.com (About, Our Journey, Team, Awards,
// Organised Retail, Commercial, Investors, FAQ) and the DRHP figures the site quotes.
// Images were downloaded from the site into /images/company and converted to webp.

export const BRAND = {
  name: "Runwal Realty",
  legal: "Runwal Developers Limited",
  founded: 1978,
  founder: "Subhash Runwal",
  md: "Sandeep Subhash Runwal",
  taglines: {
    hero: "Built on our Legacy. Built for the Future.",
    philosophy: "Building for Generations to Come",
    who: "Pioneers of Indian Real Estate",
    pillars: "Crafting Timeless Legacies",
  },
  who:
    "Runwal Realty has been developing residential, commercial and retail real estate across Mumbai, the Mumbai Metropolitan Region and Pune since 1978. What began as a single residential project in Thane has grown into one of MMR's most recognised real estate businesses.",
  intro:
    "At Runwal Realty, we believe that the true measure of our work isn't just in square feet, it's in the lives we shape and the legacies we help build.",
};

/** DRHP figures as of June 30, 2025, as quoted on runwalrealty.com. */
export const STATS = [
  { value: 35, suffix: "", label: "Completed projects", note: "Across residential, commercial and organised retail" },
  { value: 17, suffix: "", label: "Ongoing projects", note: "Under development across MMR and Pune" },
  { value: 24, suffix: "", label: "Upcoming projects", note: "In the pipeline across Mumbai, Thane and Pune" },
  { value: 11.22, suffix: " mn", label: "Sq ft handed over", note: "Residential, commercial and retail", decimals: 2 },
  { value: 2.89, suffix: " mn", label: "Sq ft commercial & retail", note: "Combined portfolio across MMR", decimals: 2 },
] as const;

export const STATS_SOURCE = "Source: Runwal Developers Limited DRHP, data as of June 30, 2025.";
export const RANKING =
  "Among the top 10 developers in the Mumbai Metropolitan Region by residential units supplied between January 2022 and March 2025, and the second largest in Thane over the same period.";

export const PHILOSOPHY = [
  "Throughout history, these walls may appear humble but within their embrace, memories are forged, generations connect, and legacies are built.",
  "At Runwal Realty, we believe our passion for excellence never rests. We intend to look beyond today's wants to create spaces that inspire pride for years to come.",
];

export const CONVICTIONS = ["Building legacies", "Nurturing growth", "Shaping communities"];

export const PILLARS = [
  {
    title: "Established Expertise",
    text: "A prominent real estate development company with a diversified portfolio of residential, commercial and organised retail projects across MMR and Pune.",
  },
  {
    title: "Design & Innovation",
    text: "Recognised for design innovation and lifestyle-oriented developments, creating differentiated assets across commercial and retail segments.",
  },
  {
    title: "Execution Capability",
    text: "Demonstrated end-to-end project execution expertise with a consistent track record of delivering projects on time.",
  },
  {
    title: "Strategic Portfolio",
    text: "A robust pipeline of projects providing visibility of cash flows, supported by land acquisition capabilities, asset-light redevelopment and joint development agreements.",
  },
  {
    title: "Experienced Leadership",
    text: "Seasoned promoters and an experienced senior management team, supported by institutional capital.",
  },
];

export type Milestone = { year: string; title: string; text: string; image?: string };

/** "Milestones of Excellence", from runwalrealty.com/about/our-journey (site wording). */
export const JOURNEY: Milestone[] = [
  { year: "1978", title: "Foundation by Subhash Runwal", text: "Laying the foundation of our real estate journey, with a first residential development in Thane.", image: "/images/company/journey/1978.webp" },
  { year: "1993", title: "Leadership Expansion", text: "Sandeep Subhash Runwal joined the business.", image: "/images/company/journey/1993.webp" },
  { year: "2003", title: "Foray into Retail", text: "Opened R Mall, Mulund, marking entry into organised retail developments.", image: "/images/company/journey/2003.webp" },
  { year: "2006", title: "Global Partnerships", text: "Formed a joint venture with a global long-term investor from Singapore.", image: "/images/company/journey/2006.webp" },
  { year: "2009", title: "Scaling Retail", text: "Inauguration of R City Mall, the largest Grade A mall in Mumbai's Eastern suburbs, with 1.23 million sq ft of leasable area.", image: "/images/company/journey/2009.webp" },
  { year: "2012–17", title: "Entering South & Central Mumbai", text: "Launched The Reserve in Worli, The Residence on Nepean Sea Road and Nirvana at Parel.", image: "/images/company/journey/2012-2017.webp" },
  { year: "2019", title: "Commercial Footprint", text: "Partnered with a global equity partner to develop a commercial project in MMR.", image: "/images/company/journey/2019.webp" },
  { year: "2020", title: "Expansion to Pune", text: "Launched a mixed-use development in Pune: Runwal The Central Park, PCMC.", image: "/images/company/journey/2020.webp" },
  { year: "2023", title: "Township Growth", text: "Full exit to strategic partners. Launched a mixed-use development in MMR, gold pre-certified by IGBC in 2025.", image: "/images/company/journey/2023.webp" },
  { year: "2024–25", title: "Strategic Acquisitions", text: "Acquired 4.2 acres in South & Central Mumbai, and five redevelopment projects of 2.14 million sq ft in the western suburbs.", image: "/images/company/journey/2024-2025.webp" },
];

export const SPLIT_2016 = {
  title: "Two companies, one founding name",
  text: "From 2016 onwards, the erstwhile Runwal Group has operated as two independent entities: Runwal Realty, led by Sandeep Runwal, and Runwal Enterprises, led by Subodh Runwal, each with its own leadership, identity and strategic direction.",
  note: "Runwal Garden City in Dombivli, Runwal Bliss and Runwal Avenue in Kanjurmarg are not Runwal Realty projects. Only Runwal Garden City in Thane is.",
};

export const MD = {
  name: "Sandeep Subhash Runwal",
  title: "Promoter & Managing Director",
  image: "/images/company/team/sandeep-runwal.webp",
  lines: [
    "Joined his father Subhash Runwal in 1993 and has led the company for over three decades.",
    "Alumnus of IIM Bangalore and Harvard Business School. Has served as president of NAREDCO.",
  ],
};

export const TEAM = [
  { name: "Sandeep Subhash Runwal", title: "Managing Director & Promoter", image: "/images/company/team/sandeep-runwal.webp", bio: "Joined in 1993. IIM Bangalore and Harvard Business School. Three decades steering the company's growth." },
  { name: "Hassan A. Visweswara", title: "Chairman & Non-Executive Director", image: "/images/company/team/hassan-visweswara.webp", bio: "M.E., Indian Institute of Science. 33+ years, including LIC, Brigade Enterprises and Mantri Developers." },
  { name: "Rupal Vora", title: "Independent Director", image: "/images/company/team/rupal-vora.webp", bio: "LLB, Government Law College. 25+ years in law; boards include Walchandnagar Industries and Aarti Pharmalabs." },
  { name: "Bhavesh Rasiklal Vora", title: "Independent Director", image: "/images/company/team/bhavesh-vora.webp", bio: "Chartered Accountant, 30+ years. Senior founding partner, B Y & Associates." },
  { name: "Yogesh Bafna", title: "Executive Director & CFO", image: "/images/company/team/yogesh-bafna.webp", bio: "Chartered Accountant. 20+ years in real estate, including Deloitte, ABN AMRO and Indiabulls Real Estate." },
  { name: "Santkumar Pandey", title: "Executive Director", image: "/images/company/team/santkumar-pandey.webp", bio: "B.E. Civil. 35+ years, including Oberoi Realty, Tata Housing and K. Raheja Universal." },
];

export type Award = { year: string; award: string; project: string; event?: string };

/** From runwalrealty.com/our-insights/events-award (de-duplicated). */
export const AWARDS: Award[] = [
  { year: "2026", project: "Runwal One", award: "Mixed Use Project of the Year" },
  { year: "2026", project: "Runwal One", award: "LEED Platinum Certification", event: "USGBC" },
  { year: "2026", project: "Runwal The Central Park", award: "Best Mixed-Use Development, Global" },
  { year: "2025", project: "Runwal Realty", award: "Developer of the Year", event: "17th Realty+ Excellence Awards, West" },
  { year: "2025", project: "Runwal Realty", award: "Developer of the Year, Luxury" },
  { year: "2025", project: "Runwal Raaya", award: "Luxury Project of the Year, Regional" },
  { year: "2025", project: "Runwal One", award: "Best Mixed-Use Development, India", event: "Asia Pacific Property Awards" },
  { year: "2025", project: "Runwal Nirvana", award: "Residential High-Rise Development, India", event: "Asia Pacific Property Awards" },
  { year: "2025", project: "R City", award: "Most Admired Shopping Centre: Marketing & Promotion (Metro)", event: "MAPIC India" },
  { year: "2025", project: "R City", award: "Excellence in Experiential Marketing", event: "ET Retail FAME Awards" },
  { year: "2025", project: "Runwal Realty", award: "Iconic Brand of the Year, Residential", event: "Realty+ Brand Leadership" },
  { year: "2025", project: "Runwal Realty", award: "Iconic Brand of the Year, Retail", event: "Realty+ Brand Leadership" },
  { year: "2025", project: "Runwal Realty", award: "Developers A-List", event: "Forbes India" },
  { year: "2025", project: "Runwal Realty", award: "Garden Beautification and Maintenance", event: "Vrukshvalli, Thane Municipal Corporation" },
  { year: "2024", project: "R Square Andheri", award: "Most Environment-Friendly Office Space", event: "Realty+ Excellence Awards, West" },
  { year: "2024", project: "Runwal Realty", award: "Developer of the Year, Luxury", event: "16th Realty+ Excellence Awards, West" },
  { year: "2024", project: "R City", award: "Most Popular Mall of the Year", event: "16th Realty+ Excellence Awards, West" },
  { year: "2024", project: "Runwal Nirvana", award: "High-Rise Project of the Year", event: "Construction Week India Awards" },
  { year: "2024", project: "R Mall Thane", award: "Most Admired Shopping Centre, Turnaround Story", event: "Images Shopping Centre Awards" },
  { year: "2024", project: "Runwal Realty", award: "Outstanding Performance in OSH, Construction", event: "NSCI Safety Awards" },
  { year: "2024", project: "Runwal Realty", award: "Outstanding and Award-Winning Performance", event: "Vrukshvalli Exhibition" },
  { year: "2023–24", project: "Runwal One", award: "Iconic Residential Project of the Year", event: "Times Real Estate Conclave" },
  { year: "2023–24", project: "Runwal Realty", award: "Iconic Residential Developer of the Year", event: "Times Real Estate Conclave" },
  { year: "2023", project: "Runwal Realty", award: "Asia's Most Iconic Brand in Real Estate", event: "Asian Brand & Leadership Conclave" },
  { year: "2023", project: "R City", award: "Most Admired Shopping Centre: Marketing & Promotion (West)", event: "MAPIC India" },
  { year: "2022", project: "R City", award: "Most Admired Shopping Centre: Marketing & Promotion (West)", event: "MAPIC India" },
  { year: "2022", project: "Runwal Timeless", award: "Fastest Selling Project of the Year", event: "Ace Alpha Awards" },
  { year: "2021", project: "Runwal One", award: "Best Real Estate Company of the Year", event: "Business Leader of the Year Awards" },
];

export const COMMERCIAL = [
  {
    slug: "r-square-andheri",
    name: "R Square Andheri",
    area: "Andheri-Kurla Road, Andheri (E)",
    image: "/images/company/commercial/r-square-andheri.webp",
    detail: "/images/company/commercial/r-square-andheri-overview.webp",
    line: "An IGBC Gold-certified commercial landmark, designed for sustainability and excellence in the modern workspace.",
    facts: [
      ["1.1 mn", "sq ft of offices"],
      ["~50,367", "sq ft floor plates"],
      ["14", "office floors"],
      ["IGBC Gold", "certified, May 2020"],
    ],
    text: "Large floor plates and flex offices with direct access to BKC, the Eastern Highway, Mumbai Airport and the Metro, behind a high-performance double-glazed facade.",
  },
  {
    slug: "r-square-mulund",
    name: "R Square Mulund",
    area: "LBS Marg, Mulund (W)",
    image: "/images/company/commercial/r-square-mulund.webp",
    detail: "/images/company/commercial/r-square-mulund-overview.webp",
    line: "Not just another business address. A vision statement carved from the ambition of an exalted journey.",
    facts: [
      ["650–2,200", "sq ft boutique offices"],
      ["1", "standalone tower on an acre"],
      ["Ready", "to move in"],
      ["En-suite", "washroom & pantry"],
    ],
    text: "Smart, self-contained boutique offices for fast-growing start-ups and established companies, close to Mulund station and the Eastern Express Highway.",
  },
];

export const RETAIL = [
  {
    name: "R City",
    area: "Ghatkopar (W)",
    image: "/images/company/retail/r-city.webp",
    wide: "/images/company/retail/r-city-wide.webp",
    line: "The largest Grade A mall in Mumbai's Eastern suburbs.",
    facts: ["1.23 mn sq ft leasable", "Opened 2009", "MAPIC India awards 2022, 2023, 2025"],
    url: "https://rcity.in/",
  },
  {
    name: "R Mall Thane",
    area: "Thane (W)",
    image: "/images/company/retail/r-mall-thane.webp",
    line: "Most Admired Shopping Centre of the Year, Turnaround Story, 2024.",
    facts: ["Images Shopping Centre Awards 2024", "500 m from Runwal One"],
    url: "https://rmall.co.in/",
  },
  {
    name: "R Mall Mulund",
    area: "Mulund (W)",
    image: "/images/company/retail/r-mall-mulund.webp",
    line: "Where Runwal's retail story began, in 2003.",
    facts: ["Opened 2003", "Runwal's first mall"],
  },
  {
    name: "R Odeon",
    area: "Ghatkopar (E)",
    image: "/images/company/retail/r-odeon.webp",
    line: "A neighbourhood destination for shopping and cinema in Ghatkopar East.",
    facts: ["Ghatkopar (E)"],
  },
];

export const HOSPITALITY = {
  text: "An upcoming hospitality portfolio of hotels across Worli, Thane, Pune and Alibaug deepens Runwal's mixed-use expertise.",
  places: [
    { name: "Worli", note: "Mumbai" },
    { name: "Thane", note: "MMR" },
    { name: "Pune", note: "Maharashtra" },
    { name: "Alibaug", note: "Coastal Konkan" },
  ],
};

export const UPCOMING = [
  { name: "Runwal Vile Parle", area: "Vile Parle, Mumbai", image: "/images/company/upcoming/vile-parle.webp" },
  { name: "Runwal Bandra", area: "Bandra, Mumbai", image: "/images/company/upcoming/bandra.webp" },
  { name: "Runwal Andheri", area: "Andheri, Mumbai", image: "/images/company/upcoming/andheri.webp" },
  { name: "Runwal Walkeshwar", area: "Walkeshwar, South Mumbai" },
];

export const IPO = {
  date: "30 September 2025",
  size: "₹2,000 crore",
  structure: "Fresh issue of up to ₹1,700 crore and an offer for sale of up to ₹300 crore.",
  listing: "Proposed listing on BSE and NSE",
  managers: ["ICICI Securities", "BOB Capital Markets", "IIFL Capital Services", "JM Financial"],
  url: "https://www.sebi.gov.in/filings/public-issues/oct-2025/runwal-developers-limited-drhp_97161.html",
};

export const PRESS = [
  { outlet: "The Economic Times", headline: "Runwal Realty enters hospitality with six hotels, Rs 3,500 cr investment", url: "https://economictimes.indiatimes.com/industry/services/property-/-cstruction/runwal-realty-enters-hospitality-with-six-hotels-rs-3500-cr-investment/articleshow/135896960.cms" },
  { outlet: "The Times of India", headline: "Inside Runwal Realty's growth strategy for luxury housing, commercial assets and social infrastructure", url: "https://timesofindia.indiatimes.com/business/inside-runwal-realtys-growth-strategy-for-luxury-housing-commercial-assets-and-social-infrastructure/articleshow/135121054.cms" },
  { outlet: "Branding in Asia", headline: "How Landor repositioned Runwal Realty for luxury without losing its legacy", url: "https://www.brandinginasia.com/how-landor-repositioned-runwal-realty-for-luxury-without-losing-its-legacy/" },
  { outlet: "Free Press Journal", headline: "Runwal Realty plans 3 new schools across MMR, first IB campus in Chembur", url: "https://www.freepressjournal.in/amp/mumbai/mumbai-runwal-realty-plans-3-new-schools-across-mmr-first-ib-campus-in-chembur" },
  { outlet: "Realty+", headline: "Runwal Realty: crafting a multi-asset empire", url: "https://www.rprealtyplus.com/developers-speak/runwal-realty-crafting-multi-asset-empire-125370.html" },
];

export const PRESS_OUTLETS = [
  "The Economic Times",
  "The Times of India",
  "Hindustan Times",
  "Forbes India",
  "Mint",
  "Moneycontrol",
  "CNBC-TV18",
  "Business Today",
  "PTI",
  "Construction Week",
  "Free Press Journal",
  "Realty+",
];

export const CONTACT = {
  address: ["Runwal & Omkar Esquare, 5th floor", "Off Eastern Express Highway, Sion (East)", "Mumbai 400 022, Maharashtra"],
  phone: "022-61133000",
  sales: "022-62328585",
  email: "corporate@runwal.com",
  maps: "https://maps.google.com/?q=Runwal+%26+Omkar+Esquare+Sion+East+Mumbai",
};

export const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/runwal/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/runwalrealty/" },
  { label: "YouTube", href: "https://www.youtube.com/@RunwalDev" },
  { label: "Facebook", href: "https://www.facebook.com/RunwalDevelopers/" },
];

export const RERA_NOTE =
  "All Runwal Realty projects are registered under MahaRERA. Registration numbers are listed on each project page and can be verified at maharera.maharashtra.gov.in. Images are artist's impressions and indicative only.";

/** Residences offered in the enquiry flow. */
export const ENQUIRY_PROJECTS = [
  { slug: "runwal-malabar", name: "Runwal Malabar", area: "Malabar Hill", kind: "home" },
  { slug: "runwal-raaya", name: "Runwal Raaya", area: "Worli", kind: "home" },
  { slug: "runwal-timeless", name: "Runwal Timeless", area: "Wadala", kind: "home" },
  { slug: "runwal-rare", name: "Runwal Rare", area: "Andheri West", kind: "home" },
  { slug: "runwal-auris", name: "Runwal Auris", area: "Malad West", kind: "home" },
  { slug: "runwal-sanctuary", name: "Runwal Sanctuary", area: "Mulund West", kind: "home" },
  { slug: "runwal-one", name: "Runwal One", area: "Manpada, Thane", kind: "home" },
  { slug: "runwal-zenith", name: "Runwal Zenith", area: "Balkum, Thane", kind: "home" },
  { slug: "runwal-lands-end", name: "Runwal Lands End", area: "Kolshet, Thane", kind: "home" },
  { slug: "runwal-the-central-park", name: "Runwal The Central Park", area: "Chinchwad, Pune", kind: "home" },
  { slug: "r-square-andheri", name: "R Square Andheri", area: "Andheri East", kind: "office" },
  { slug: "r-square-mulund", name: "R Square Mulund", area: "Mulund West", kind: "office" },
] as const;

export const BUDGETS = ["Below ₹75 lakh", "₹75 lakh – 1 Cr", "₹1 – 1.5 Cr", "₹1.5 – 2 Cr", "₹2 – 5 Cr", "₹5 – 15 Cr", "Above ₹15 Cr"];
