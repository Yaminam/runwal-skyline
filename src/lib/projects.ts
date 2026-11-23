// Runwal Realty projects. Copy, figures and images come from runwalrealty.com (scraped Nov 2026).
// Where the site contradicts itself, the project-page value is used. Prices are the site's "starting from" (* T&C).

export type Region = "South Mumbai" | "Western Suburbs" | "Central Suburbs" | "Thane" | "Pune";

export type Project = {
  slug: string;
  name: string;
  short: string;
  kind: "Residential" | "Commercial";
  tagline: string;
  headline: string;
  lines: string[];
  area: string;
  address: string;
  city: "Mumbai" | "Thane" | "Pune";
  region: Region;
  status: string;
  type: string;
  configs: { label: string; carpet: string }[];
  bhk: number[];
  priceFrom: string | null;
  facts: { label: string; value: string }[];
  /** storeys of the tower model in the explorer */
  floors: number;
  description: string;
  amenities: string[];
  connectivity: string[];
  awards: string[];
  rera: string[];
  lat: number;
  lon: number;
  images: {
    hero: string;
    /** clean crop of the marketing banner (no text panel) */
    feature: string | null;
    mobile: string | null;
    card: string;
    overview: string | null;
    gallery: { src: string; label: string }[];
  };
};

export const PROJECTS: Project[] = [
  {
    "slug": "runwal-malabar",
    "name": "Runwal Malabar",
    "short": "Malabar",
    "kind": "Residential",
    "tagline": "An address for the city's most powerful",
    "headline": "Runwal Malabar Sky Residences in Malabar Hill",
    "lines": [
      "11 Private Mansions. Each, a chapter in a legacy unfolding skyward.",
      "So rare, you'll be the first to greet the city's sunrise and last to bid farewell to its sunset.",
      "Power isn't displayed. It's sculpted.",
      "Mumbai's Aristocratic Address"
    ],
    "area": "Malabar Hill",
    "address": "Malabar Hill, South Mumbai (next to the Governor's Estate)",
    "city": "Mumbai",
    "region": "South Mumbai",
    "status": "Ongoing",
    "type": "Residential · ultra-luxury sky mansions",
    "configs": [
      {
        "label": "Simplex sky mansion",
        "carpet": "2,420 sq ft"
      },
      {
        "label": "Duplex sky mansion",
        "carpet": "5,103 sq ft"
      }
    ],
    "bhk": [
      3,
      5
    ],
    "priceFrom": "₹33 Cr*",
    "facts": [
      {
        "label": "Residences",
        "value": "11 sky mansions"
      },
      {
        "label": "Height",
        "value": "690 ft"
      },
      {
        "label": "Views",
        "value": "270° sea & skyline"
      }
    ],
    "floors": 48,
    "description": "Rising 690 feet above the city beside the Governor's Estate, Runwal Malabar is a collection of just 11 sky mansions where the Arabian Sea, Mumbai's skyline and open skies converge in a 270° panorama. Crafted for those who have already arrived, it pairs the heritage of Malabar Hill with bespoke amenities and concierge living.",
    "amenities": [
      "Serene infinity pool",
      "Sunlit sundeck",
      "Tranquil jacuzzi",
      "Ice lounge",
      "Gymnasium",
      "Private business suite",
      "Grand arrival lobby",
      "Private drop-off with three-sided verdant landscape",
      "Concierge"
    ],
    "connectivity": [
      "Rising 690 ft above the city, next to the Governor's Estate",
      "Just 11 exclusive sky mansions",
      "270° panorama of the Arabian Sea, skyline and skies",
      "Minutes from Hanging Gardens, Marine Drive and Girgaon Chowpatty",
      "Private decks, expansive living spaces"
    ],
    "awards": [],
    "rera": [
      "PR1170002502441"
    ],
    "lat": 18.955,
    "lon": 72.797,
    "images": {
      "hero": "/images/projects/runwal-malabar/hero.webp",
      "feature": "/images/projects/runwal-malabar/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-malabar/card.webp",
      "overview": "/images/projects/runwal-malabar/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-malabar/g1.webp",
          "label": "Private sky mansions"
        },
        {
          "src": "/images/projects/runwal-malabar/g2.webp",
          "label": "Panoramic sunrise/sunset views"
        },
        {
          "src": "/images/projects/runwal-malabar/g3.webp",
          "label": "Sculpted sky-mansion interiors"
        }
      ]
    }
  },
  {
    "slug": "runwal-raaya",
    "name": "Runwal Raaya",
    "short": "Raaya",
    "kind": "Residential",
    "tagline": "Uncompromised residences in the heart of Worli",
    "headline": "Where royalty resides in the heart of Worli",
    "lines": [
      "Here, you don't adjust to life; life adjusts to you.",
      "Drawing inspiration from the Sanskrit word Raay, meaning king or emperor",
      "Location: Worli's Golden Triangle"
    ],
    "area": "Worli",
    "address": "Worli's Golden Triangle (between Bandra-Worli Sea Link, BKC and Lower Parel)",
    "city": "Mumbai",
    "region": "South Mumbai",
    "status": "Ongoing",
    "type": "Residential · ultra-luxury, low-density (2 towers)",
    "configs": [
      {
        "label": "3 Bed",
        "carpet": "1,738 sq ft onwards"
      },
      {
        "label": "4 Bed",
        "carpet": "2,208 sq ft onwards"
      },
      {
        "label": "5 Bed",
        "carpet": "4,285 sq ft onwards"
      }
    ],
    "bhk": [
      3,
      4,
      5
    ],
    "priceFrom": "₹12.51 Cr*",
    "facts": [
      {
        "label": "Land",
        "value": "5 acres"
      },
      {
        "label": "Towers",
        "value": "2"
      },
      {
        "label": "Landscaping",
        "value": "2.5 acres"
      }
    ],
    "floors": 44,
    "description": "Drawing its name from the Sanskrit 'Raay', meaning king, Runwal Raaya is a low-density enclave of two towers on 5 acres in Worli's Golden Triangle. Its 3, 4 and 5-bed private residences come with private elevators, sun-kissed decks and Italian marble-clad lobbies, set within 2.5 acres of wellness-first landscaping.",
    "amenities": [
      "Indoor wellness pool & spa (branded spa, heated pool per FAQ)",
      "2.5-acre wellness-first landscaping",
      "Sky decks & rooftop retreats",
      "Celestial Club with party café & sky lounge",
      "Private theatre",
      "Library & art café",
      "Landscape gardens & shallow water paths",
      "Badminton, pickleball & padel courts",
      "Fully equipped gym & sports bar",
      "Observation deck & rooftop barbecue",
      "Rock-climbing wall",
      "Banquet hall & business centre"
    ],
    "connectivity": [
      "Two private-access elevators per residence + separate service lift",
      "6-ft wide private deck off the living room; walk-in wardrobe; house-help room with attached toilet",
      "Italian marble-clad lobbies",
      "Bandra-Worli Sea Link 2.4 km; Mahalaxmi Racecourse 3.9 km",
      "Four Seasons 6 min; St. Regis 7 min; Kamala Mills 9 min",
      "All of Mumbai within ~30 minutes"
    ],
    "awards": [
      "Luxury Project of the Year 2025, Regional"
    ],
    "rera": [
      "P51900080218",
      "P51900080252"
    ],
    "lat": 19.012,
    "lon": 72.818,
    "images": {
      "hero": "/images/projects/runwal-raaya/hero.webp",
      "feature": "/images/projects/runwal-raaya/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-raaya/card.webp",
      "overview": "/images/projects/runwal-raaya/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-raaya/g1.webp",
          "label": "Tower exterior with sun decks"
        },
        {
          "src": "/images/projects/runwal-raaya/g2.webp",
          "label": "Italian marble-clad lobby"
        },
        {
          "src": "/images/projects/runwal-raaya/g3.webp",
          "label": "Sky deck and rooftop retreat"
        },
        {
          "src": "/images/projects/runwal-raaya/g4.webp",
          "label": "Indoor wellness pool and spa"
        },
        {
          "src": "/images/projects/runwal-raaya/g5.webp",
          "label": "Living room"
        },
        {
          "src": "/images/projects/runwal-raaya/g6.webp",
          "label": "Celestial Club sky lounge"
        },
        {
          "src": "/images/projects/runwal-raaya/g7.webp",
          "label": "Private elevator lobby"
        },
        {
          "src": "/images/projects/runwal-raaya/g8.webp",
          "label": "Night view of towers"
        },
        {
          "src": "/images/projects/runwal-raaya/g9.webp",
          "label": "Landscaped gardens & water paths"
        }
      ]
    }
  },
  {
    "slug": "runwal-timeless",
    "name": "Runwal Timeless",
    "short": "Timeless",
    "kind": "Residential",
    "tagline": "Own your time",
    "headline": "Where Life Feels Eternal",
    "lines": [
      "Embrace a life where every moment is yours to cherish, allowing you to live life at your pace"
    ],
    "area": "Wadala",
    "address": "Wadala (near Wadala Monorail, BKC-Wadala Growth Corridor); contact page lists site as Sion",
    "city": "Mumbai",
    "region": "South Mumbai",
    "status": "Ongoing",
    "type": "Residential",
    "configs": [
      {
        "label": "2 BHK",
        "carpet": "583–737 sq ft"
      },
      {
        "label": "3 BHK",
        "carpet": "915–1,002 sq ft"
      }
    ],
    "bhk": [
      2,
      3
    ],
    "priceFrom": null,
    "facts": [
      {
        "label": "Sky Promenade",
        "value": "22,000 sq ft"
      },
      {
        "label": "Amenities",
        "value": "50+"
      },
      {
        "label": "Monorail",
        "value": "500 m"
      }
    ],
    "floors": 36,
    "description": "Set in Wadala, Mumbai's emerging transport hub, Runwal Timeless is about giving time back: trains, monorail, metro and the Eastern Freeway are minutes away. Its 2 and 3 BHK homes are crowned by a 22,000 sq ft rooftop Sky Promenade and 50+ lifestyle amenities.",
    "amenities": [
      "22,000 sq ft rooftop Sky Promenade",
      "Sports bar",
      "Cabana / lounge seating",
      "Sundowner party area",
      "Swimming pool, kids' pool & lotus pond",
      "Spa with massage rooms",
      "Gym, boxing arena, dance studio, aerial fitness",
      "Art café & outdoor library",
      "Yoga deck & meditation",
      "Amphitheatre",
      "Jogging track",
      "Rock climbing & jungle adventure"
    ],
    "connectivity": [
      "Monorail 500 m; metro station 1.1 km",
      "Eastern Freeway 6.3 km; Bandra Terminus 7.6 km",
      "R City 9.7 km; Lower Parel 10.2 km",
      "International airport 15.3 km; Bandra-Worli Sea Link 18.1 km",
      "Double-height entrance lobby; select private-deck residences"
    ],
    "awards": [
      "Fastest Selling Project of the Year, Ace Alpha Awards 2022"
    ],
    "rera": [
      "P51900005685"
    ],
    "lat": 19.021,
    "lon": 72.866,
    "images": {
      "hero": "/images/projects/runwal-timeless/hero.webp",
      "feature": "/images/projects/runwal-timeless/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-timeless/card.webp",
      "overview": "/images/projects/runwal-timeless/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-timeless/g1.webp",
          "label": "Tower elevation"
        },
        {
          "src": "/images/projects/runwal-timeless/g2.webp",
          "label": "Sky promenade deck"
        },
        {
          "src": "/images/projects/runwal-timeless/g3.webp",
          "label": "Cabana lounge"
        },
        {
          "src": "/images/projects/runwal-timeless/g4.webp",
          "label": "Sundowner party area"
        },
        {
          "src": "/images/projects/runwal-timeless/g5.webp",
          "label": "Sports bar"
        },
        {
          "src": "/images/projects/runwal-timeless/g6.webp",
          "label": "Living & dining"
        }
      ]
    }
  },
  {
    "slug": "runwal-rare",
    "name": "Runwal Rare",
    "short": "Rare",
    "kind": "Residential",
    "tagline": "Reserve of the refined",
    "headline": "Reserve of the Refined",
    "lines": [
      "With limitless vistas and boundless possibilities, this residence offers an unparalleled canvas to shape your vision of luxury and comfort.",
      "Live the high life in Andheri, just off Juhu Circle"
    ],
    "area": "Andheri West",
    "address": "Off Juhu Circle, D N Nagar, Andheri West",
    "city": "Mumbai",
    "region": "Western Suburbs",
    "status": "Ongoing",
    "type": "Residential · boutique (50 apartments)",
    "configs": [
      {
        "label": "2 BHK",
        "carpet": "859 sq ft"
      },
      {
        "label": "3 BHK",
        "carpet": "1,101–1,216 sq ft"
      }
    ],
    "bhk": [
      2,
      3
    ],
    "priceFrom": null,
    "facts": [
      {
        "label": "Apartments",
        "value": "Only 50"
      },
      {
        "label": "Storeys",
        "value": "16"
      },
      {
        "label": "DN Nagar Metro",
        "value": "350 m"
      }
    ],
    "floors": 16,
    "description": "Located just off Juhu Circle, Runwal Rare is a collection of only 50 bespoke 2 and 3-bedroom residences designed for privacy. A rooftop Sky Gym and infinity pool crown the 16-storey building, with seaside views and one of Mumbai's most prestigious neighbourhoods at the doorstep.",
    "amenities": [
      "Rooftop infinity pool with pool deck",
      "SkyGym / outdoor gym",
      "Yoga & meditation zone",
      "Mini open-air theatre",
      "Rooftop lounge",
      "Party area",
      "Barbecue area",
      "Terrace garden",
      "Outdoor library",
      "Banquet"
    ],
    "connectivity": [
      "Only 50 exclusive apartments",
      "Seaside views; rooftop crowned by SkyGym and infinity pool",
      "DN Nagar Metro 350 m; Andheri station 2.8 km",
      "Kokilaben Hospital 1.3 km; Nanavati 3.9 km",
      "Billabong High School 1 km; Bhavans College 1.2 km",
      "DB Mall 1.3 km; Infiniti Mall 2.0 km; The Club 500 m",
      "Branded lifts, 2-tier security"
    ],
    "awards": [],
    "rera": [
      "P51800034594"
    ],
    "lat": 19.136,
    "lon": 72.829,
    "images": {
      "hero": "/images/projects/runwal-rare/hero.webp",
      "feature": "/images/projects/runwal-rare/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-rare/card.webp",
      "overview": "/images/projects/runwal-rare/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-rare/g1.webp",
          "label": "Twilight view"
        },
        {
          "src": "/images/projects/runwal-rare/g2.webp",
          "label": "Road view"
        },
        {
          "src": "/images/projects/runwal-rare/g3.webp",
          "label": "Side elevation"
        },
        {
          "src": "/images/projects/runwal-rare/g4.webp",
          "label": "Dining area"
        }
      ]
    }
  },
  {
    "slug": "runwal-auris",
    "name": "Runwal Auris",
    "short": "Auris",
    "kind": "Residential",
    "tagline": "A masterpiece to admire",
    "headline": "In a city that rarely pauses, calm must be designed.",
    "lines": [
      "Calm here is not incidental. It is intentional.",
      "Seamlessly Planned"
    ],
    "area": "Malad West",
    "address": "Link Road, Malad West (Western suburbs)",
    "city": "Mumbai",
    "region": "Western Suburbs",
    "status": "Ongoing",
    "type": "Residential · luxury high-rise",
    "configs": [
      {
        "label": "3 BHK",
        "carpet": "from 1,428 sq ft"
      },
      {
        "label": "4 BHK",
        "carpet": "up to 2,016 sq ft"
      }
    ],
    "bhk": [
      3,
      4
    ],
    "priceFrom": "₹5.37 Cr*",
    "facts": [
      {
        "label": "Land",
        "value": "8 acres"
      },
      {
        "label": "Homes per floor",
        "value": "6"
      },
      {
        "label": "Homes begin",
        "value": "~100 ft up"
      }
    ],
    "floors": 58,
    "description": "Rising above an expansive 8-acre parcel on Link Road, Malad West, Runwal Auris is conceived for low-density living, with the first homes beginning roughly 100 feet above ground. Landscaped decks rise over the parking podiums, views open out and noise recedes. Calm by design. 3 and 4-bed residences come with generous decks, tall ceilings and cross-ventilation.",
    "amenities": [
      "4-acre elevated eco-deck",
      "2-acre wellness-first landscaping",
      "Indoor wellness pool & spa",
      "Full-size Olympic-standard tennis court",
      "Pickle-ball & padel courts",
      "Rooftop retreats",
      "Library & art café",
      "Cycling & jogging track",
      "Rock-climbing wall",
      "Sports bar & gymnasium",
      "Private theatre",
      "Pet zone"
    ],
    "connectivity": [
      "Low-density living on an 8-acre parcel; just 6 homes per floor",
      "Homes begin ~100 ft above ground; landscaped decks above parking podiums",
      "Sea-facing orientations on Link Road",
      "Malad West Metro 1.4 km; Mith Chowky Metro 1.6 km; Malad station 2.9 km",
      "Western Express Highway 6 km; domestic airport 16.1 km; international airport 17.8 km",
      "Infiniti Mall 1.3 km; Inorbit 2.3 km"
    ],
    "awards": [],
    "rera": [
      "P51800055792"
    ],
    "lat": 19.187,
    "lon": 72.842,
    "images": {
      "hero": "/images/projects/runwal-auris/hero.webp",
      "feature": "/images/projects/runwal-auris/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-auris/card.webp",
      "overview": "/images/projects/runwal-auris/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-auris/g1.webp",
          "label": "Tower exterior"
        },
        {
          "src": "/images/projects/runwal-auris/g2.webp",
          "label": "Clubhouse and amenities"
        },
        {
          "src": "/images/projects/runwal-auris/g3.webp",
          "label": "Swimming pool and wellness deck"
        },
        {
          "src": "/images/projects/runwal-auris/g4.webp",
          "label": "Living-room interior"
        },
        {
          "src": "/images/projects/runwal-auris/g5.webp",
          "label": "Landscaped garden and walkways"
        },
        {
          "src": "/images/projects/runwal-auris/g6.webp",
          "label": "Entrance lobby"
        }
      ]
    }
  },
  {
    "slug": "runwal-sanctuary",
    "name": "Runwal Sanctuary",
    "short": "Sanctuary",
    "kind": "Residential",
    "tagline": "Life set free",
    "headline": "Your Gateway to Green Living.",
    "lines": [
      "Experience the essence of green living with breathtaking hill views at every turn."
    ],
    "area": "Mulund West",
    "address": "LBS Marg, Sambhaji Nagar, Mulund West (near Yogi Hills)",
    "city": "Mumbai",
    "region": "Central Suburbs",
    "status": "Ongoing",
    "type": "Residential · green community",
    "configs": [
      {
        "label": "2 BHK",
        "carpet": "666–690 sq ft"
      },
      {
        "label": "2.5 BHK",
        "carpet": "771 sq ft"
      },
      {
        "label": "3 BHK",
        "carpet": "1,030 sq ft"
      }
    ],
    "bhk": [
      2,
      3
    ],
    "priceFrom": "₹2.15 Cr*",
    "facts": [
      {
        "label": "Land",
        "value": "6 acres"
      },
      {
        "label": "Towers",
        "value": "5"
      },
      {
        "label": "Trees",
        "value": "350+"
      }
    ],
    "floors": 30,
    "description": "Runwal Sanctuary is a 6-acre, 5-tower community on LBS Marg in Mulund West that keeps about 40% of its land open, with 350+ trees and hill views at every turn. Its 2, 2.5 and 3 BHK homes are cross-ventilated, and 40+ amenities plus a 15,000 sq ft clubhouse make green living the everyday.",
    "amenities": [
      "15,000 sq ft clubhouse",
      "Rooftop swimming pool & kids' pool",
      "Yoga plaza, yoga & meditation zones",
      "Pet trail",
      "Amphitheatre",
      "Garden café zone",
      "Gymnasium & steam room",
      "Mini theatre",
      "Badminton & squash courts",
      "Banquet lawns",
      "Viewing deck",
      "Children's play area & crèche"
    ],
    "connectivity": [
      "Hill views of Yogi Hills from tower sundecks",
      "350+ trees, perfect cross-ventilation",
      "Upasani Super Speciality Hospital 900 m; Johnson & Johnson Garden 800 m",
      "St. Mary's Convent High School 2.1 km; Eastern Express Highway 12.1 km (as stated)",
      "Upcoming Metro Line 4 and Goregaon-Mulund Link Road"
    ],
    "awards": [],
    "rera": [
      "P51800012621",
      "P51800032538",
      "P51800025926",
      "P51800029440"
    ],
    "lat": 19.172,
    "lon": 72.948,
    "images": {
      "hero": "/images/projects/runwal-sanctuary/hero.webp",
      "feature": "/images/projects/runwal-sanctuary/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-sanctuary/card.webp",
      "overview": "/images/projects/runwal-sanctuary/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-sanctuary/g1.webp",
          "label": "Aerial view"
        },
        {
          "src": "/images/projects/runwal-sanctuary/g2.webp",
          "label": "Entry gate and avenue"
        },
        {
          "src": "/images/projects/runwal-sanctuary/g3.webp",
          "label": "Tower 3 feature wall"
        },
        {
          "src": "/images/projects/runwal-sanctuary/g4.webp",
          "label": "Tower worm's-eye view"
        },
        {
          "src": "/images/projects/runwal-sanctuary/g5.webp",
          "label": "Swimming pool"
        },
        {
          "src": "/images/projects/runwal-sanctuary/g6.webp",
          "label": "Living & dining"
        }
      ]
    }
  },
  {
    "slug": "runwal-one",
    "name": "Runwal One",
    "short": "One",
    "kind": "Residential",
    "tagline": "India's Best Mixed-Use Development",
    "headline": "Thane's True Urban Habitat",
    "lines": [
      "A lifestyle so complete, you will need atleast 25 hours a day to enjoy it."
    ],
    "area": "Manpada, Thane",
    "address": "Manpada, Ghodbunder Road / Eastern Express Highway, Thane West",
    "city": "Thane",
    "region": "Thane",
    "status": "Ongoing",
    "type": "Residential · mixed-use township",
    "configs": [
      {
        "label": "1 BHK",
        "carpet": "441–472 sq ft"
      },
      {
        "label": "2 BHK",
        "carpet": "565–662 sq ft"
      },
      {
        "label": "3 BHK",
        "carpet": "950–963 sq ft"
      }
    ],
    "bhk": [
      1,
      2,
      3
    ],
    "priceFrom": "₹1.64+ Cr*",
    "facts": [
      {
        "label": "Land",
        "value": "21 acres"
      },
      {
        "label": "Open space",
        "value": "5 acres"
      },
      {
        "label": "Amenities",
        "value": "50+"
      }
    ],
    "floors": 40,
    "description": "Spread across 21 acres in Manpada with 5 acres of open green space, Runwal One brings homes, retail and lifestyle amenities together in one planned habitat on the Eastern Express Highway. It offers 50+ amenities and one of Thane's most expansive clubhouses, with views over Sanjay Gandhi National Park.",
    "amenities": [
      "~50,000 sq ft clubhouse (one of Thane's largest)",
      "Cascading pool & infinity pool",
      "Sunken garden",
      "Elevated jogging track",
      "Putting greens",
      "Spa, salon, yoga & meditation",
      "2 theatres",
      "Library",
      "Outdoor café",
      "Outdoor gymnasium",
      "Sky club",
      "Pet park, seniors park, festival square"
    ],
    "connectivity": [
      "21-acre planned habitat with 5 acres of open green space",
      "Views of Sanjay Gandhi National Park / Yeoor Hills",
      "Eastern Express Highway 200 m; upcoming metro 300 m; R Mall 500 m",
      "Thane-Borivali tunnel ~2.9 km (expected to cut Thane-Borivali to ~15 min)",
      "Majiwada Junction 3.1 km; Viviana Mall & Jupiter Hospital 5.2 km"
    ],
    "awards": [
      "Best Mixed-Use Development India, Asia Pacific Property Awards",
      "Mixed Use Project Of The Year (2026)",
      "Iconic Residential Project of the Year, Times Real Estate Conclave 2023-24",
      "LEED Platinum (2026)"
    ],
    "rera": [
      "P51700053696",
      "P51700048270",
      "P51700048278",
      "PR1330002502798",
      "PR1330002503071"
    ],
    "lat": 19.236,
    "lon": 72.968,
    "images": {
      "hero": "/images/projects/runwal-one/hero.webp",
      "feature": "/images/projects/runwal-one/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-one/card.webp",
      "overview": "/images/projects/runwal-one/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-one/g1.webp",
          "label": "Tower A1 aerial view"
        },
        {
          "src": "/images/projects/runwal-one/g2.webp",
          "label": "Tower A1 with pool, day"
        },
        {
          "src": "/images/projects/runwal-one/g3.webp",
          "label": "Tower A1 with pool, evening"
        },
        {
          "src": "/images/projects/runwal-one/g4.webp",
          "label": "Towers front elevation"
        },
        {
          "src": "/images/projects/runwal-one/g5.webp",
          "label": "Clubhouse"
        },
        {
          "src": "/images/projects/runwal-one/g6.webp",
          "label": "Sunken garden"
        },
        {
          "src": "/images/projects/runwal-one/g7.webp",
          "label": "Outdoor pool area"
        },
        {
          "src": "/images/projects/runwal-one/g8.webp",
          "label": "Jodi apartment interior"
        }
      ]
    }
  },
  {
    "slug": "runwal-zenith",
    "name": "Runwal Zenith",
    "short": "Zenith",
    "kind": "Residential",
    "tagline": "The epitome of luxury",
    "headline": "Experience the Benchmark of Luxury Living",
    "lines": [
      "This one-of-a-kind property soars above the rest, delivering an ultra-luxury lifestyle for the select few.",
      "The only standalone 3 BHK tower"
    ],
    "area": "Balkum, Thane",
    "address": "Balkum, Thane West (opp. Runwal Garden City)",
    "city": "Thane",
    "region": "Thane",
    "status": "Ongoing",
    "type": "Residential · standalone 3 BHK tower",
    "configs": [
      {
        "label": "3 BHK",
        "carpet": "966–1,220 sq ft"
      }
    ],
    "bhk": [
      3
    ],
    "priceFrom": "₹2.39 Cr*",
    "facts": [
      {
        "label": "Storeys",
        "value": "51"
      },
      {
        "label": "Homes per floor",
        "value": "6"
      },
      {
        "label": "Metro",
        "value": "0.6 km"
      }
    ],
    "floors": 51,
    "description": "Runwal Zenith is a single tower in Balkum, Thane dedicated entirely to 3 BHK homes, six to a floor. Surrounded by green hills and Thane's lakes, it pairs endless creek and city views with a 10,000 sq ft landscaped podium, a two-level rooftop club and a metro station next door.",
    "amenities": [
      "10,000 sq ft landscaped podium 'Arena' with infinity-edge pool",
      "Club Z two-level rooftop (terrace lawn, lounge, dance arena, barbeque deck, café lounge)",
      "Yoga deck 'Nirvana' on 40th floor",
      "Swimming pool & kids' pool",
      "Gymnasium",
      "Indoor games room",
      "Mini theatre",
      "Library",
      "Banquet lawn",
      "Senior citizen seating",
      "Meditation zone",
      "Café lounge"
    ],
    "connectivity": [
      "Only standalone 3 BHK tower; one consistent home size",
      "Views of Thane creek and city from upper floors",
      "Metro station 0.6 km (Balkum Naka, Metro Line 4)",
      "Ghodbunder Road & Eastern Express Highway 2.0 km; R Mall 2.1 km",
      "Jupiter Hospital 3.1 km; Thane station 6.0 km",
      "Near ISKCON temple, green hills and 30 lakes"
    ],
    "awards": [],
    "rera": [
      "P51700046734"
    ],
    "lat": 19.214,
    "lon": 72.985,
    "images": {
      "hero": "/images/projects/runwal-zenith/hero.webp",
      "feature": "/images/projects/runwal-zenith/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-zenith/card.webp",
      "overview": "/images/projects/runwal-zenith/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-zenith/g1.webp",
          "label": "Tower elevation 1"
        },
        {
          "src": "/images/projects/runwal-zenith/g2.webp",
          "label": "Tower elevation 2"
        },
        {
          "src": "/images/projects/runwal-zenith/g3.webp",
          "label": "Podium landscape"
        },
        {
          "src": "/images/projects/runwal-zenith/g4.webp",
          "label": "Terrace amenity"
        },
        {
          "src": "/images/projects/runwal-zenith/g5.webp",
          "label": "Terrace café"
        },
        {
          "src": "/images/projects/runwal-zenith/g6.webp",
          "label": "Master bedroom"
        }
      ]
    }
  },
  {
    "slug": "runwal-lands-end",
    "name": "Runwal Lands End",
    "short": "Lands End",
    "kind": "Residential",
    "tagline": "Land, Water, Sky, Homes",
    "headline": "A Home Where Nature Is Your Closest Neighbour.",
    "lines": [
      "Experience luxury living midst lush greenery, where tranquility reigns, serenity whispers, and every view is a masterpiece.",
      "Our Most Pristine Development",
      "Breathtaking View Of The Ulhas River"
    ],
    "area": "Kolshet, Thane",
    "address": "Kolshet Road, Thane West (opp. Kia Service Centre)",
    "city": "Thane",
    "region": "Thane",
    "status": "Ongoing",
    "type": "Residential · low-density riverside township",
    "configs": [
      {
        "label": "1 BHK",
        "carpet": "354–445 sq ft"
      },
      {
        "label": "2 BHK",
        "carpet": "542–632 sq ft"
      }
    ],
    "bhk": [
      1,
      2
    ],
    "priceFrom": "₹1.39 Cr*",
    "facts": [
      {
        "label": "Land",
        "value": "10 acres"
      },
      {
        "label": "Towers",
        "value": "7"
      },
      {
        "label": "Amenities",
        "value": "70+"
      }
    ],
    "floors": 34,
    "description": "Surrounded by approximately 1,600 acres of greenery and offering 270° panoramic views of the Ulhas River, Runwal Lands End is a low-density development of just 7 towers on 10 acres in Kolshet. A 1 lakh sq ft vehicle-free podium, hundreds of trees and 70+ resort-style amenities set around a 40,000 sq ft clubhouse make nature its closest neighbour.",
    "amenities": [
      "~40,000 sq ft clubhouse",
      "Beach pool & swimming pool",
      "Butterfly dome",
      "Tree house",
      "River gazing deck",
      "Sand beach",
      "Putting golf",
      "Jungle adventure & rock-climbing wall",
      "Cricket ground & football court",
      "Tennis court",
      "Lily pond & flower tunnel",
      "Elevated jogging/cycling track"
    ],
    "connectivity": [
      "Surrounded by ~1,600 acres of greenery, mangroves and the Ulhas River",
      "Only 7 towers on 10 acres; 1 lakh sq ft vehicle-free podium",
      "Kapurbawdi Junction 3.2 km; Eastern Express Highway 4.2 km; upcoming metro 2.1 km",
      "R Mall 2.7 km; Viviana Mall & Jupiter Hospital 5.4 km; Thane station 9 km",
      "Thane-Borivali tunnel ~5.1 km"
    ],
    "awards": [],
    "rera": [
      "P51700046298",
      "PR1330002502164",
      "P51700056121"
    ],
    "lat": 19.228,
    "lon": 73.005,
    "images": {
      "hero": "/images/projects/runwal-lands-end/hero.webp",
      "feature": "/images/projects/runwal-lands-end/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-lands-end/card.webp",
      "overview": "/images/projects/runwal-lands-end/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-lands-end/g1.webp",
          "label": "Tower elevation with river view"
        },
        {
          "src": "/images/projects/runwal-lands-end/g2.webp",
          "label": "Front tower elevation"
        },
        {
          "src": "/images/projects/runwal-lands-end/g3.webp",
          "label": "Swimming pool"
        },
        {
          "src": "/images/projects/runwal-lands-end/g4.webp",
          "label": "Aerial view of amenities"
        },
        {
          "src": "/images/projects/runwal-lands-end/g5.webp",
          "label": "Tree house landscape"
        },
        {
          "src": "/images/projects/runwal-lands-end/g6.webp",
          "label": "Sky deck"
        },
        {
          "src": "/images/projects/runwal-lands-end/g7.webp",
          "label": "Living room"
        }
      ]
    }
  },
  {
    "slug": "runwal-the-central-park",
    "name": "Runwal The Central Park",
    "short": "The Central Park",
    "kind": "Residential",
    "tagline": "26 acres of complete life",
    "headline": "Runwal The Central Park 2, 3 & 4 BHK Homes in Pune",
    "lines": [
      "Pimpri - Chinchwad's New City Centre",
      "Drawing inspiration from one of the most iconic landscapes in the world"
    ],
    "area": "Chinchwad, Pune",
    "address": "Old Mumbai-Pune Highway, Chinchwad, PCMC (Pimpri-Chinchwad's 'New City Centre')",
    "city": "Pune",
    "region": "Pune",
    "status": "Ongoing",
    "type": "Residential · integrated mixed-use township",
    "configs": [
      {
        "label": "2 BHK",
        "carpet": "671–747 sq ft"
      },
      {
        "label": "3 BHK",
        "carpet": "978–1,199 sq ft"
      },
      {
        "label": "4 BHK",
        "carpet": "1,935 sq ft"
      }
    ],
    "bhk": [
      2,
      3,
      4
    ],
    "priceFrom": "₹1.40 Cr*",
    "facts": [
      {
        "label": "Land",
        "value": "26 acres"
      },
      {
        "label": "Storeys",
        "value": "40"
      },
      {
        "label": "Clubhouse",
        "value": "50,000 sq ft"
      }
    ],
    "floors": 40,
    "description": "Inspired by one of the world's most iconic landscapes, Runwal The Central Park is a 26-acre integrated township on the old Mumbai-Pune Highway in Chinchwad. Its 40-storey towers are among the tallest in the region, set amid nature trails, open lawns and 50+ amenities anchored by a 50,000 sq ft clubhouse.",
    "amenities": [
      "50,000 sq ft clubhouse",
      "Infinity-edge indoor pool (largest indoor pool in PCMC)",
      "Rock climbing adventure park",
      "Star gazing deck",
      "Tree house",
      "Nature trail & zen garden",
      "Futsal, volleyball & badminton courts",
      "Mini theatre & open amphitheatre",
      "Café & alfresco dining",
      "Bonfire area",
      "Jacuzzi & aqua gym for kids",
      "Daycare"
    ],
    "connectivity": [
      "Pune's largest integrated mixed-use development; includes a large-format mall",
      "PCMC's tallest development (40-storey towers)",
      "Old Mumbai-Pune Highway 0.1 km; metro station 0.6 km (Finolex Chowk, Pimpri-Swargate corridor)",
      "PCMC 0.9 km; Chinchwad station 1.5 km",
      "Mumbai-Pune Expressway 9 km; Pune airport 20.3 km",
      "Vaastu-compliant, cross-ventilated layouts"
    ],
    "awards": [
      "Best Mixed-Use Development Global (2026)"
    ],
    "rera": [
      "P52100025260",
      "P52100030291",
      "P52100032101",
      "PR1260002503069",
      "PR1260002502733"
    ],
    "lat": 18.636,
    "lon": 73.799,
    "images": {
      "hero": "/images/projects/runwal-the-central-park/hero.webp",
      "feature": "/images/projects/runwal-the-central-park/feature.webp",
      "mobile": null,
      "card": "/images/projects/runwal-the-central-park/card.webp",
      "overview": "/images/projects/runwal-the-central-park/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/runwal-the-central-park/g1.webp",
          "label": "Night view"
        },
        {
          "src": "/images/projects/runwal-the-central-park/g2.webp",
          "label": "Entrance portal, day"
        },
        {
          "src": "/images/projects/runwal-the-central-park/g3.webp",
          "label": "Clubhouse"
        },
        {
          "src": "/images/projects/runwal-the-central-park/g4.webp",
          "label": "Sports arena"
        },
        {
          "src": "/images/projects/runwal-the-central-park/g5.webp",
          "label": "Deck view"
        },
        {
          "src": "/images/projects/runwal-the-central-park/g6.webp",
          "label": "Living & dining"
        }
      ]
    }
  }
];

export const COMMERCIAL: Project[] = [
  {
    "slug": "r-square-andheri",
    "name": "R Square Andheri",
    "short": "R Square Andheri",
    "kind": "Commercial",
    "tagline": "A Grade A office landmark on Andheri-Kurla Road",
    "headline": "A state-of-the-art, IGBC Gold-certified (May 2020) commercial landmark, designed for sustainability and excellence in the modern workspace.",
    "lines": [],
    "area": "Andheri East",
    "address": "Andheri-Kurla Road, Andheri (E)",
    "city": "Mumbai",
    "region": "Western Suburbs",
    "status": "Ongoing",
    "type": "Commercial · Grade A office",
    "configs": [
      {
        "label": "Typical floor plate",
        "carpet": "~50,367 sq ft"
      },
      {
        "label": "Office units",
        "carpet": "from ~7,226 sq ft"
      },
      {
        "label": "Flex office",
        "carpet": "On request"
      }
    ],
    "bhk": [],
    "priceFrom": null,
    "facts": [
      {
        "label": "Office space",
        "value": "1.1 mn sq ft"
      },
      {
        "label": "Office floors",
        "value": "14"
      },
      {
        "label": "Certification",
        "value": "IGBC Gold"
      }
    ],
    "floors": 14,
    "description": "R Square is an IGBC Gold-certified, 1.1 million sq ft office landmark on Andheri-Kurla Road with large ~50,367 sq ft floor plates across 14 office floors. Close to BKC, the airport and the metro, it offers flex offices and a full suite of corporate amenities.",
    "amenities": [
      "Flex office",
      "Food & beverage / café zone",
      "Gym",
      "Medical centre",
      "Ambulance",
      "Concierge",
      "Library",
      "Meditation space",
      "Universal accessibility",
      "Landscape area",
      "Smoking zone"
    ],
    "connectivity": [
      "Direct access to BKC, Eastern Highway, Mumbai Airport and Metro",
      "Andheri Metro (Line 1) and Andheri railway station nearby",
      "High-performance double-glazed glass facade",
      "Landscaped walkways"
    ],
    "awards": [
      "Most Environment-Friendly Commercial/Office Space, Realty+ Conclave & Excellence Awards 2024 West"
    ],
    "rera": [],
    "lat": 19.115,
    "lon": 72.866,
    "images": {
      "hero": "/images/projects/r-square-andheri/hero.webp",
      "feature": null,
      "mobile": null,
      "card": "/images/projects/r-square-andheri/card.webp",
      "overview": "/images/projects/r-square-andheri/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/r-square-andheri/g1.webp",
          "label": "Majestic facade"
        },
        {
          "src": "/images/projects/r-square-andheri/g2.webp",
          "label": "Double-glazed glass facade"
        },
        {
          "src": "/images/projects/r-square-andheri/g3.webp",
          "label": "Landscaped walkways"
        }
      ]
    }
  },
  {
    "slug": "r-square-mulund",
    "name": "R Square Mulund",
    "short": "R Square Mulund",
    "kind": "Commercial",
    "tagline": "Smart boutique offices, ready to move in",
    "headline": "R Square is not just another business address, it's a vision statement carved from the ambition of an exalted journey.",
    "lines": [],
    "area": "Mulund West",
    "address": "LBS Marg, Mulund (W), opp. ESIC Hospital",
    "city": "Mumbai",
    "region": "Central Suburbs",
    "status": "Ready to move",
    "type": "Commercial · boutique offices",
    "configs": [
      {
        "label": "Boutique offices",
        "carpet": "650–2,200 sq ft"
      }
    ],
    "bhk": [],
    "priceFrom": null,
    "facts": [
      {
        "label": "Tower",
        "value": "Standalone"
      },
      {
        "label": "Land",
        "value": "~1 acre"
      },
      {
        "label": "Status",
        "value": "Ready to move"
      }
    ],
    "floors": 12,
    "description": "A standalone tower on an acre on LBS Marg, R Square Mulund offers ready-to-move smart boutique offices from 650 to 2,200 sq ft, suited to fast-growing start-ups and established companies alike. Each office is self-contained with its own washroom and pantry.",
    "amenities": [
      "Grand drop-off",
      "Gated & secured work spaces",
      "Double-height entrance lobby",
      "Energy-efficient full glass facade",
      "Natural sunlight & ventilation in lobbies and staircases",
      "Self-contained offices with en-suite washroom & pantry",
      "Visitor washrooms on every floor"
    ],
    "connectivity": [
      "Close to Mulund station and Eastern Express Highway",
      "Quick access to South Mumbai and the Western suburbs"
    ],
    "awards": [],
    "rera": [],
    "lat": 19.172,
    "lon": 72.952,
    "images": {
      "hero": "/images/projects/r-square-mulund/hero.webp",
      "feature": null,
      "mobile": null,
      "card": "/images/projects/r-square-mulund/card.webp",
      "overview": "/images/projects/r-square-mulund/overview.webp",
      "gallery": [
        {
          "src": "/images/projects/r-square-mulund/g1.webp",
          "label": "Render 1"
        }
      ]
    }
  }
];

export const ALL_PROJECTS: Project[] = [...PROJECTS, ...COMMERCIAL];

export const REGIONS: Region[] = ["South Mumbai", "Western Suburbs", "Central Suburbs", "Thane", "Pune"];

export function getProject(slug: string) {
  return ALL_PROJECTS.find((p) => p.slug === slug);
}

/** The project after this one, wrapping around (for "next residence" links). */
export function nextProject(slug: string) {
  const i = ALL_PROJECTS.findIndex((p) => p.slug === slug);
  return ALL_PROJECTS[(i + 1) % ALL_PROJECTS.length];
}
