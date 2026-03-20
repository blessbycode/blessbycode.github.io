import { getCollection, type CollectionEntry } from 'astro:content';
import { slug } from 'github-slugger';
import type { Collation, CollationGroup, PostType } from './types';

export function formattedDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

export async function getSortedPosts(type: PostType) {
  const allPosts = await getCollection(type, ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  const sortedPosts = allPosts.sort((a, b) => {
    return a.data.published < b.data.published ? -1 : 1;
  });
  return sortedPosts;
}

abstract class PostsCollationGroup implements CollationGroup<PostType> {
  title: string;
  url: string;
  collations: Collation<PostType>[];

  constructor(title: string, url: string, collations: Collation<PostType>[]) {
    this.title = title;
    this.url = url;
    this.collations = collations;
  }

  sortCollationsAlpha(): Collation<PostType>[] {
    this.collations.sort((a, b) => a.title.localeCompare(b.title));
    return this.collations;
  }

  sortCollationsLargest(): Collation<PostType>[] {
    this.collations.sort((a, b) => b.entries.length - a.entries.length);
    return this.collations;
  }

  sortCollationsMostRecent(): Collation<PostType>[] {
    this.collations.sort((a, b) => {
      const aDate = a.entries[a.entries.length - 1].data.published;
      const bDate = b.entries[b.entries.length - 1].data.published;
      return aDate < bDate ? 1 : -1;
    });
    return this.collations;
  }

  add(item: CollectionEntry<PostType>, collationTitle: string): void {
    const collationTitleSlug = slug(collationTitle.trim());
    const existing = this.collations.find(
      (i) => i.titleSlug === collationTitleSlug,
    );
    if (existing) {
      const alreadyHasThisPost = existing.entries.find((e) => e.id === item.id);
      if (!alreadyHasThisPost) {
        existing.entries.push(item);
      }
    } else {
      this.collations.push({
        title: collationTitle,
        titleSlug: collationTitleSlug,
        url: `${this.url}/${encodeURIComponent(collationTitleSlug)}`,
        entries: [item],
      });
    }
  }

  match(rawKey: string): Collation<PostType> | undefined {
    return this.collations.find((entry) => entry.title === rawKey);
  }

  matchMany(rawKeys: string[]): Collation<PostType>[] {
    return this.collations.filter((entry) => rawKeys.includes(entry.title));
  }
}

export class SeriesGroup extends PostsCollationGroup {
  // Private constructor to enforce the use of the static build method
  private constructor(
    title: string,
    url: string,
    items: Collation<PostType>[],
  ) {
    super(title, url, items);
  }
  // Factory method to create a SeriesGroup instance with async data fetching
  static async build(
    posts?: CollectionEntry<PostType>[],
  ): Promise<SeriesGroup> {
    const sortedArticles = await getSortedPosts('articles');
    const sortedSnippets = await getSortedPosts('snippets');
    const sortedGuides = await getSortedPosts('guides');
    const seriesGroup = new SeriesGroup('Series', '/series', []);
    (posts || [...sortedArticles, ...sortedSnippets, ...sortedGuides]).forEach(
      (post) => {
        const frontmatterSeries = post.data.series;
        if (frontmatterSeries) {
          seriesGroup.add(post, frontmatterSeries);
        }
      },
    );
    return seriesGroup;
  }
}

export class TagsGroup extends PostsCollationGroup {
  // Private constructor to enforce the use of the static build method
  private constructor(
    title: string,
    url: string,
    items: Collation<PostType>[],
  ) {
    super(title, url, items);
  }

  // Factory method to create a SeriesGroup instance with async data fetching
  static async build(posts?: CollectionEntry<PostType>[]): Promise<TagsGroup> {
    const sortedArticles = await getSortedPosts('articles');
    const sortedSnippets = await getSortedPosts('snippets');
    const sortedGuides = await getSortedPosts('guides');
    const tagsGroup = new TagsGroup('Tags', '/tags', []);
    (posts || [...sortedArticles, ...sortedSnippets, ...sortedGuides]).forEach(
      (post) => {
        const frontmatterTags = post.data.tags || [];
        frontmatterTags.forEach((tag) => {
          tagsGroup.add(post, tag);
        });
      },
    );
    return tagsGroup;
  }
}

export function getPostSequenceContext(
  post: CollectionEntry<PostType>,
  posts: CollectionEntry<PostType>[],
) {
  const index = posts.findIndex((p) => p.id === post.id);
  const prev = index > 0 ? posts[index - 1] : undefined;
  const next = index < posts.length - 1 ? posts[index + 1] : undefined;
  return { index, prev, next };
}
