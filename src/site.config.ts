import type { SiteConfig } from '~/types';

const config: SiteConfig = {
  site: 'https://blessbycode.github.io',
  title: 'blessbycode',
  description: 'A technical blog where blessings come in disguise of code.',
  author: 'blessbycode',
  tags: [
    'Html',
    'Html5',
    'Css',
    'Css3',
    'JavaScript',
    'EcmaScript',
    'TypeScript',
    'Angular',
    'React',
    'Astro',
    'Mongo',
    'Node.js',
    'blessbycode',
  ],
  pageSize: 9,
  trailingSlashes: false,
  navLinks: [
    {
      name: 'Home',
      url: '/',
      pathName: '',
    },
    {
      name: 'Articles',
      url: '/articles',
      pathName: 'articles',
    },
    {
      name: 'Snippets',
      url: '/snippets',
      pathName: 'snippets',
    },
    {
      name: 'Guides',
      url: '/guides',
      pathName: 'guides',
    },
  ],
  socialLinks: {
    mastodon: 'https://mastodon.social/@blessbycode',
    email: 'blessbycode@gmail.com',
    bluesky: 'https://bsky.app/profile/blessbycode.bsky.social',
    x: 'https://x.com/blessbycode',
    rss: true, // Set to true to include an RSS feed link in the footer
  },
};

export default config;
