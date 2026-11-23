// Content for CSR, Customer Corner, NRI, Club Oasis, Investors, Careers and Contact, transcribed from
// the live runwalrealty.com pages (Nov 2026). Listings (blogs, coverage, openings, FAQs) live in
// coverage-data.ts. Nothing here is invented; where the source is thin, the pages say so.

export * from "./coverage-data";
export type { Faq, Opening, Story, Video } from "./coverage-types";

export const FAQ_CATEGORIES = ["Company", "IPO & Investors", "Residences", "Offices", "Club Oasis", "R Loyalist", "Awards"] as const;

/* ---------------------------------------------------------------- CSR */
export const CSR = {
  title: "Fostering positive impact",
  intro:
    "We believe in giving back to the community and creating meaningful change where it matters most. Our efforts are focused on two key areas: education, by supporting quality learning opportunities for children, women, the elderly, and the differently-abled; and healthcare, by providing access to essential medical services through camps, preventive care, and sustainable health programs.",
  areas: [
    {
      key: "education",
      title: "Empowering Minds",
      text: "Supporting the provision of quality learning opportunities, including special and vocational education, for underprivileged groups such as children, women, the elderly, and the differently-abled.",
      image: "/images/coverage/csr/education.webp",
      groups: ["Children", "Women", "The elderly", "The differently-abled"],
    },
    {
      key: "health",
      title: "Health for All",
      text: "Contributing towards the delivery of essential medical services through medical camps, improving access to preventive and curative care, and implementing sustainable health programs.",
      image: "/images/coverage/csr/health.webp",
      groups: ["Medical camps", "Preventive care", "Curative care", "Sustainable health programs"],
    },
  ],
  banner: "/images/coverage/csr/banner.webp",
  committee: [
    { name: "Sandeep Subhash Runwal", role: "Managing Director", seat: "Chairperson" },
    { name: "Rupal Vora", role: "Independent Director", seat: "Member" },
    { name: "Santkumar Pandey", role: "Executive Director", seat: "Member" },
  ],
  policy: "https://runwalrealty.com/wp-content/uploads/2025/12/Corporate-Social-Responsibility-Policy.pdf",
  source: "https://runwalrealty.com/about/csr/",
};

/* ---------------------------------------------------------------- Customer corner */
export const LOYALIST = {
  title: "Embracing loyalty has never been so rewarding",
  intro: "As our special and distinguished member you have the option to choose from a bouquet of gifts as your rewards.",
  benefits: [
    { k: "Loyalty", pct: 2, text: "Loyalty benefit on every booking you make again with Runwal Realty." },
    { k: "Referrer", pct: 1, text: "Benefit to the referrer on a successful booking by their referred friend or relative." },
    { k: "Referred", pct: 1, text: "Benefit to the referred friend or relative for the booking." },
  ],
  steps: [
    "Recommend a Runwal Realty project to friends and family",
    "An R Loyalist representative assists them in visiting the Runwal Realty site and selecting their dream home",
    "They book their dream home with Runwal Realty",
    "Earn amazing rewards",
  ],
  eligibility: "Only existing buyers from Runwal Realty can join the Rloyalist referral program.",
  terms: "Loyalty benefits apply to Runwal Realty projects only. Contact rloyalist@runwal.com for complete terms and conditions.",
  email: "rloyalist@runwal.com",
  phone: "+91 92402 89489",
  phoneHref: "+919240289489",
  image: "/images/coverage/loyalist/rewards.webp",
  source: "https://runwalrealty.com/customer-corner/rloyalist/",
};

export const SPECIALISTS = {
  title: "The Specialists",
  intro:
    "The Specialists bring together Runwal Realty and select Channel Partners to forge an association where both draw their collective strengths to create a robust future.",
  benefits: [
    { title: "Payments & query resolution", line: "Quick feedback on all the questions" },
    { title: "Dedicated relationship manager", line: "The right hand you could count on" },
    { title: "Fast track earning", line: "Prioritised brokerage payout" },
    { title: "Tech enablement", line: "To ensure complete transparency" },
    { title: "Regular sales training", line: "Practice to perfect" },
    { title: "Priority access to marketing collaterals", line: "The weapons to win every battle" },
  ],
  enrol: "Channel partners enrol with their name, company, contact details, firm location and RERA registration number.",
  image: "/images/coverage/specialists/partners.webp",
  source: "https://runwalrealty.com/customer-corner/the-specialists/",
};

/* ---------------------------------------------------------------- NRI */
export const NRI = {
  whyIndia:
    "For the period 2022 to 2023, Indian residential real estate saw robust growth where supply increased by 24.64% while absorption grew by 30.60% on account of post-COVID recovery and market confidence. From 2023 to 2024, there was a slight moderation in momentum, likely influenced by macroeconomic challenges. The overall growth from 2022 to 2024 remains strong, with supply rising by 15.35% and absorption by 25.97%. Q1 2025 trends also indicate resilience and a healthy pipeline.",
  figures: [
    { v: 24.64, label: "Supply growth", span: "2022 to 2023" },
    { v: 30.6, label: "Absorption growth", span: "2022 to 2023" },
    { v: 15.35, label: "Supply growth", span: "2022 to 2024" },
    { v: 25.97, label: "Absorption growth", span: "2022 to 2024" },
  ],
  growthIntro:
    "The Central as well as State Governments along with RBI have been instrumental and supportive to ensure that the real estate sector emerges stronger after the Covid-19 pandemic. Some of the key actions:",
  growth: [
    "Demand remained robust despite the rise in mortgage rates",
    "Pradhan Mantri Awas Yojana-Urban 2.0 (2024)",
    "REITs (Real Estate Investment Trusts)",
    "SM REIT (Small and Medium Real Estate Investment Trust)",
    "Sustainability and green building initiatives in real estate",
    "Property tax waiver (Maharashtra)",
  ],
  partnerships: [
    "A 50:50 joint venture with a global long-term investor from Singapore to develop R City Mall, one of the first large-scale foreign direct investments in India's real estate sector.",
    "A 50:50 joint venture with a reputed global private equity firm to develop The Central Park in Pune.",
    "A partnership with a prominent domestic bank, through its professional investment service arm, to develop The Residence at Napean Sea Road.",
    "A partnership with an Indian infrastructure development and finance company to develop Runwal Elegante in Andheri.",
  ],
  images: { hero: "/images/coverage/nri/why-india.webp", growth: "/images/coverage/nri/growth.webp", family: "/images/coverage/nri/partners.webp" },
  source: "https://runwalrealty.com/nri-corner/",
};

/* ---------------------------------------------------------------- Club Oasis */
export const OASIS = {
  headline: "Beyond the five senses lies the one that matters most.",
  sub: "An Oasis of belonging, reserved only for Runwal Realty communities.",
  sixthSense:
    "Home is more than a space; it is the feeling of being known, welcomed, and rooted. At Club Oasis, we awaken this deeper instinct: the sixth sense of belonging. These are places where mornings bring familiar hellos, evenings turn into shared rituals, and weekends become memories made together.",
  story:
    "Runwal Realty carries a promise: to give you more than a home, to give you a sense of belonging. Out of this promise, Club Oasis was born. Not a facility, but the soul of each community, a haven of over 30,000 sq. ft., created only for the families who live there. Every Oasis is unique, bound to its own neighbourhood, and reserved exclusively for its residents.",
  expressions: [
    { k: "Calm", text: "Pools and pavilions that feel like an extension of your own backyard.", image: "/images/coverage/oasis/calm.webp" },
    { k: "Joy", text: "Lounges and gathering halls alive with voices you know by name.", image: "/images/coverage/oasis/joy.webp" },
    { k: "Strength", text: "Gyms, studios, and courts where health is shared, not solitary.", image: "/images/coverage/oasis/strength.webp" },
    { k: "Wonder", text: "Corners where children grow up together, side by side.", image: "/images/coverage/oasis/wonder.webp" },
    { k: "Stillness", text: "Gardens and courtyards that welcome you back to yourself.", image: "/images/coverage/oasis/stillness.webp" },
    { k: "Togetherness", text: "Spaces where strangers become neighbours, and neighbours become kin.", image: "/images/coverage/oasis/togetherness.webp" },
  ],
  places: [
    { name: "Runwal Sanctuary", area: "Mulund, Mumbai", slug: "runwal-sanctuary" },
    { name: "Runwal Raaya", area: "Worli, Mumbai", slug: "runwal-raaya" },
    { name: "Runwal Lands End", area: "Kolshet, Thane", slug: "runwal-lands-end" },
    { name: "Runwal One", area: "Manpada, Thane", slug: "runwal-one" },
    { name: "Runwal The Central Park", area: "Pimpri Chinchwad, Pune", slug: "runwal-the-central-park" },
  ],
  images: { comfort: "/images/coverage/oasis/comfort.webp", story: "/images/coverage/oasis/story.webp", film: "/images/social/club-oasis.webp" },
  source: "https://runwalrealty.com/club-oasis/",
};

/* ---------------------------------------------------------------- Investors */
const UP = "https://runwalrealty.com/wp-content/uploads/";
export const INVESTORS = {
  company: "Runwal Developers Limited (Runwal Realty)",
  cin: "U70100MH1988PLC046631",
  promoter: "Sandeep Runwal",
  drhp: "30 September 2025",
  structure:
    "100% book-built offer comprising a fresh issue of equity shares aggregating up to ₹1,700 crore and an offer for sale by the promoter selling shareholder (Sandeep Subhash Runwal) aggregating up to ₹300 crore, for a total of up to ₹2,000 crore. Face value of ₹1 per equity share. Proposed to be listed on BSE Limited and National Stock Exchange of India Limited.",
  split: [
    { label: "Fresh issue", cr: 1700 },
    { label: "Offer for sale", cr: 300 },
  ],
  managers: ["ICICI Securities Limited", "BOB Capital Markets Limited", "IIFL Capital Services Limited", "JM Financial Limited"],
  registrar: "MUFG Intime India Private Limited (formerly Link Intime India Private Limited)",
  disclaimer:
    "Runwal Developers Limited, operating under the brand Runwal Realty, is a separate legal entity and is not affiliated with the listed company Runwal Enterprises Limited, promoted by Mr. Subodh Runwal.",
  docs: [
    {
      group: "IPO",
      items: [
        { label: "Draft Red Herring Prospectus (DRHP)", url: UP + "2025/10/DRHP.pdf" },
        { label: "Industry report from Anarock", url: UP + "2025/10/Industry-Report.pdf" },
        { label: "IPO audio video, English", url: UP + "2025/10/English_Runwal-Developers-Ltd_Sebi-AV.mp4" },
        { label: "IPO audio video, Hindi", url: UP + "2025/10/Hindi_Runwal-Developers-Ltd_Sebi-AV.mp4" },
        { label: "Outstanding dues of material creditors", url: UP + "2025/12/Outstanding-dues-of-material-creditors.pdf" },
      ],
    },
    {
      group: "Financials",
      items: [
        { label: "Consolidated FY 2024-25", url: UP + "2025/10/RDL_Consol_FY-2024-25.pdf" },
        { label: "Consolidated FY 2023-24", url: UP + "2025/10/RDPL_Consol_FY-2023-24.pdf" },
        { label: "Consolidated FY 2022-23", url: UP + "2025/10/RDPL_Consol_FY-2022-23.pdf" },
        { label: "Standalone FY 2024-25", url: UP + "2025/10/RDL_Standalone_FY-2024-25.pdf" },
        { label: "Standalone FY 2023-24", url: UP + "2025/10/RDPL_Standalone_FY-2023-24.pdf" },
        { label: "Standalone FY 2022-23", url: UP + "2025/10/RDPL_Standalone_FY-2022-23.pdf" },
      ],
    },
    {
      group: "Subsidiaries",
      items: [
        { label: "R Mall Developers Pvt. Ltd. 24-25", url: UP + "2025/10/RMDPL_FY-2024-25.pdf" },
        { label: "R Mall Developers Pvt. Ltd. 23-24", url: UP + "2025/10/RMDPL_FY-2023-24.pdf" },
        { label: "R Mall Developers Pvt. Ltd. 22-23", url: UP + "2025/10/RMDPL_FY-2022-23.pdf" },
        { label: "R Retail Ventures Pvt. Ltd. 24-25", url: UP + "2025/10/RRVPL_FY-2024-25.pdf" },
        { label: "R Retail Ventures Pvt. Ltd. 23-24", url: UP + "2025/10/RRVPL_FY-2023-24.pdf" },
        { label: "R Retail Ventures Pvt. Ltd. 22-23", url: UP + "2025/10/RRVPL_FY-2022-23.pdf" },
        { label: "Aethon Developers Pvt. Ltd. 24-25", url: UP + "2025/10/ADPL_FY-2024-25.pdf" },
        { label: "Aethon Developers Pvt. Ltd. 23-24", url: UP + "2025/10/ADPL_FY-2023-24.pdf" },
        { label: "Aethon Developers Pvt. Ltd. 22-23", url: UP + "2025/10/ADPL_FY-2022-23.pdf" },
        { label: "Group companies", url: UP + "2025/11/Group-Companies.pdf" },
      ],
    },
    {
      group: "Annual reports",
      items: [
        { label: "RDL Annual Report 2024-25", url: UP + "2025/10/RDL-Annual-Report-2024-25-1.pdf" },
        { label: "Annual Report FY 2023-24", url: UP + "2025/10/Annual-Report_FY-23-24.pdf" },
        { label: "Annual Report FY 2022-23", url: UP + "2025/10/Annual-Report_FY-2022-23-1.pdf" },
        { label: "Annual Report FY 2021-22", url: UP + "2025/10/Annual-Report_FY-2021-22-1.pdf" },
        { label: "Annual Report FY 2020-21", url: UP + "2025/10/Annual-Report-FY-2020-21-1.pdf" },
        { label: "Annual Return 2024-25", url: UP + "2026/09/annual-return-2025.pdf" },
        { label: "Annual Return 2023-24", url: UP + "2025/10/Annual-Return-2023-24-1.pdf" },
        { label: "Annual Return 2022-23", url: UP + "2025/10/Annual-Return-2022-23-1.pdf" },
        { label: "Annual Return 2021-22", url: UP + "2025/10/Annual-Return-2021-22-1.pdf" },
        { label: "Annual Return 2020-21", url: UP + "2025/10/Annual-Return-2020-21-1.pdf" },
      ],
    },
    {
      group: "Governance",
      items: [
        { label: "MOA and AOA", url: UP + "2025/11/MOA-and-AOA.pdf" },
        { label: "Familiarisation programme for independent directors", url: UP + "2025/12/Familiarisation-Progamme-for-Independent-Directors.pdf" },
        { label: "Code of conduct for Board, KMP and senior management", url: UP + "2025/12/Code-of-Conduct-for-Board-Members-KMP-Senior-Management.pdf" },
        { label: "Policy and procedure for leakage of UPSI", url: UP + "2025/12/Policy-and-procedure-for-leakage-of-UPSI.pdf" },
        { label: "Corporate Social Responsibility policy", url: UP + "2025/12/Corporate-Social-Responsibility-Policy.pdf" },
        { label: "Dividend distribution policy", url: UP + "2025/12/Dividend-Distribution-Policy.pdf" },
        { label: "Policy on diversity of Board of Directors", url: UP + "2025/12/Policy-on-Diversity-of-Board-of-Directors.pdf" },
      ],
    },
  ],
  committees: [
    { name: "Audit", members: [["Bhavesh Rasiklal Vora", "Chairperson"], ["Rupal Vora", "Member"], ["Yogesh Bafna", "Member"]] },
    { name: "Nomination & Remuneration", members: [["Rupal Vora", "Chairperson"], ["Bhavesh Rasiklal Vora", "Member"], ["Hassan Anantharamaiah Visweswara", "Member"]] },
    { name: "Stakeholders' Relationship", members: [["Bhavesh Rasiklal Vora", "Chairperson"], ["Santkumar Pandey", "Member"], ["Yogesh Bafna", "Member"]] },
    { name: "Corporate Social Responsibility", members: [["Sandeep Subhash Runwal", "Chairperson"], ["Rupal Vora", "Member"], ["Santkumar Pandey", "Member"]] },
    { name: "Risk Management", members: [["Sandeep Subhash Runwal", "Chairperson"], ["Bhavesh Rasiklal Vora", "Member"], ["Yogesh Bafna", "Member"]] },
  ],
  contact: {
    name: "Charu Patki",
    role: "Company Secretary and Compliance Officer",
    address: "Runwal & Omkar Esquare, 5th floor, Off Eastern Express Highway, Opp Sion Chunabhatti Signal, Sion (E), Mumbai 400022",
    phone: "022 6113 3000",
    phoneHref: "02261133000",
    email: "cs@runwal.com",
  },
  registrarContact: { email: "runwaldevelopers.ipo@in.mpms.mufg.com", phone: "+91 810 811 4949", phoneHref: "+918108114949", web: "https://in.mpms.mufg.com/" },
  banner: "/images/coverage/investors/banner.webp",
  source: "https://runwalrealty.com/investors/",
};

/* ---------------------------------------------------------------- Careers */
export const CAREERS = {
  intro:
    "At Runwal Realty, we believe that our people are the cornerstone of our success. We take immense pride in the wealth of knowledge and experience that our team brings to the table, and we aim to empower each employee by integrating their personal goals with our organizational vision. We are committed to enriching careers beyond just competitive salaries; we advocate for flexible work arrangements and a strong work-life balance.",
  values: [
    { k: "Results-focused", text: "We are driven by outcomes, measuring success through what we achieve." },
    { k: "Continuous knowledge upgrades", text: "Staying abreast of industry trends is fundamental to our expertise." },
    { k: "Talent nurturing", text: "We provide an egalitarian platform, ensuring all talent can thrive." },
    { k: "Work-life synergy", text: "We emphasise balancing professional and personal life." },
    { k: "Agility in action", text: "A nimble mindset, ready to meet the evolving demands of the real estate market." },
    { k: "Lifelong learning", text: "Our culture values continual learning and professional development." },
  ],
  life: [
    { event: "Runwal Premier League 2024", images: [1, 2, 3, 4].map((i) => `/images/coverage/careers/rpl-2024-${i}.webp`) },
    { event: "Runwal Next 2024", images: [1, 2, 3, 4].map((i) => `/images/coverage/careers/runwal-next-2024-${i}.webp`) },
    { event: "Ganesh Chaturthi 2024", images: [1, 2, 3, 4].map((i) => `/images/coverage/careers/ganesh-2024-${i}.webp`) },
    { event: "Annual Day 2023", images: [1, 2, 3, 4].map((i) => `/images/coverage/careers/annual-day-2023-${i}.webp`) },
  ],
  apply: "https://runwalrealty.com/careers/",
  email: "corporate@runwal.com",
  banner: "/images/coverage/careers/people.webp",
};

/* ---------------------------------------------------------------- Contact */
const gmap = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const CONTACT_PAGE = {
  office: "Runwal & Omkar Esquare, 5th floor, off Eastern Express Highway, Opposite Sion Chunabhatti Signal, Sion (East), Mumbai 400 022, Maharashtra, India",
  officeMap: "https://maps.app.goo.gl/UYUXyVCPKh6zuRLa9",
  landline: "022 6113 3000",
  landlineHref: "02261133000",
  fax: "022 2409 3749",
  sales: "022 6232 8585",
  salesHref: "02262328585",
  email: "corporate@runwal.com",
  sites: [
    { name: "Runwal Raaya", area: "Worli, Mumbai", slug: "runwal-raaya" },
    { name: "Runwal Malabar", area: "Malabar Hill, Mumbai", slug: "runwal-malabar" },
    { name: "Runwal Timeless", area: "Wadala, Mumbai", slug: "runwal-timeless" },
    { name: "Runwal Rare", area: "Andheri, Mumbai", slug: "runwal-rare" },
    { name: "Runwal Auris", area: "Malad, Mumbai", slug: "runwal-auris" },
    { name: "Runwal Sanctuary", area: "Mulund, Mumbai", slug: "runwal-sanctuary" },
    { name: "Runwal One", area: "Manpada, Thane", slug: "runwal-one" },
    { name: "Runwal Zenith", area: "Balkum, Thane", slug: "runwal-zenith" },
    { name: "Runwal Eirene", area: "Balkum, Thane", slug: null },
    { name: "Runwal Lands End", area: "Kolshet, Thane", slug: "runwal-lands-end" },
    { name: "Runwal The Central Park", area: "Pimpri Chinchwad, Pune", slug: "runwal-the-central-park" },
  ].map((s) => ({ ...s, map: gmap(`${s.name} ${s.area}`) })),
  image: "/images/coverage/contact/office.webp",
};
