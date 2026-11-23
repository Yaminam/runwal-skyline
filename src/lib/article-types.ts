export type Block =
  | { t: "p" | "h2" | "h3" | "blockquote" | "figcaption"; html: string }
  | { t: "img"; src: string; alt: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; rows: string[][] };

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string | null;
  cover: string | null;
  blocks: Block[];
  faqs: { q: string; a: string }[];
  words: number;
  source: string;
};
