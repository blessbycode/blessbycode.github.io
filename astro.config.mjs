// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

import siteConfig from './src/site.config';
import remarkReadingTime from './src/plugins/remark-reading-time';

import expressiveCode from 'astro-expressive-code';
import { pluginColorChips } from 'expressive-code-color-chips';
import { pluginLanguageBadge } from 'expressive-code-language-badge';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { remarkAdmonitions } from './src/plugins/remark-admonitions';
import remarkDirective from 'remark-directive';
import remarkGemoji from './src/plugins/remark.gemoji';
import remarkMath from 'remark-math'; /* for latex math support */
import rehypeKatex from 'rehype-katex'; /* again, for latex math support */

// https://astro.build/config
export default defineConfig({
  site: siteConfig.site,
  trailingSlash: siteConfig.trailingSlashes ? 'always' : 'never',
  prefetch: true,
  image: {
    responsiveStyles: true,
  },
  markdown: {
    remarkPlugins: [
      remarkReadingTime,
      remarkDirective,
      remarkAdmonitions,
      remarkGemoji,
      remarkMath,
    ],
    rehypePlugins: [
      [rehypeHeadingIds, { headingIdCompat: true }],
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [
        rehypeExternalLinks,
        {
          rel: ['noreferrer', 'noopener'],
          target: '_blank',
        },
      ],
      rehypeKatex,
    ],
  },
  integrations: [
    sitemap(),
    icon(),
    expressiveCode({
      themes: ['github-dark-dimmed', 'github-light'],
      useDarkModeMediaQuery: true,
      defaultProps: {
        wrap: true,
      },
      styleOverrides: {
        codeFontFamily: 'var(--font-mono)',
        codeFontSize: 'var(--text-base)',
        codeBackground: 'var(--bg-inset)',
        borderColor: 'var(--bg-border)',
        borderWidth: '1px',
        borderRadius: 'var(--space-4)',
        uiFontFamily: 'var(--font-mono)',
        uiFontSize: 'var(--text-base)',
        frames: {
          terminalBackground: 'var(--bg-inset)',
          terminalTitlebarBackground: 'var(--bg-elevated)',
          terminalTitlebarBorderBottomColor: 'var(--border-subtle)',
          editorBackground: 'var(--bg-inset)',
          editorTabBarBackground: 'var(--bg-elevated)',
          editorActiveTabBackground: 'none',
          inlineButtonForeground: 'var(--text-muted)',
          inlineButtonBorder: 'var(--bg-border)',
          inlineButtonBorderOpacity: '1',
          tooltipSuccessBackground: 'var(--color-success)',
        },
      },
      plugins: [pluginColorChips(), pluginLanguageBadge()],
    }),
    mdx(),
  ],
  experimental: {
    contentIntellisense: true,
  },
});
