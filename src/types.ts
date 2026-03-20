import type { MarkdownHeading } from 'astro';
import type { CollectionEntry, DataEntryMap } from 'astro:content';

// Post Types
export type PostType = 'articles' | 'snippets' | 'guides';

// TOC Types
export interface TocItem extends MarkdownHeading {
  children: TocItem[];
}

export interface TocOpts {
  maxHeadingLevel?: number | undefined;
  minHeadingLevel?: number | undefined;
}

// Frontmatter Images Types
export interface FrontmatterImage {
  alt: string;
  src: {
    height: number;
    src: string;
    width: number;
    format: 'avif' | 'png' | 'webp' | 'jpeg' | 'jpg' | 'svg' | 'tiff' | 'gif';
  };
}

// Collation Types
export interface Collation<CollectionType extends keyof DataEntryMap> {
  title: string;
  url: string;
  titleSlug: string;
  entries: CollectionEntry<CollectionType>[];
}

export interface CollationGroup<CollectionType extends keyof DataEntryMap> {
  title: string;
  url: string;
  collations: Collation<CollectionType>[];
  // Return this.collations to allow chaining
  sortCollationsAlpha(): Collation<CollectionType>[];
  sortCollationsMostRecent(): Collation<CollectionType>[];
  sortCollationsLargest(): Collation<CollectionType>[];
  add(item: CollectionEntry<CollectionType>, rawKey: string): void;
  match(title: string): Collation<CollectionType> | undefined;
  matchMany(titles: string[]): Collation<CollectionType>[] | undefined;
}

// Navlinks Types
export type NavLink = {
  name: string;
  url: string;
  pathName: string;
  external?: boolean;
};

// Admonition Types
export type AdmonitionType =
  | 'tip'
  | 'note'
  | 'important'
  | 'caution'
  | 'warning';

// Social Links Types
export type SocialLinks = {
  github?: string;
  x?: string;
  mastodon?: string;
  bluesky?: string;
  linkedin?: string;
  email?: string;
  rss?: boolean;
};

// Site Config Types
export interface SiteConfig {
  site: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  pageSize: number;
  trailingSlashes: boolean;
  socialLinks: SocialLinks;
  navLinks: NavLink[];
}
