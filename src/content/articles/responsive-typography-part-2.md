---
title: 'Responsive Typography in CSS - Part 2'
published: 2026-01-05
draft: false
description: 'Second part of the 2-part series about Responsive Typography in CSS.'
toc: true
series: 'responsive typography'
tags: ['typography']
icons: ['css-3']
tech: 'css'
---

## Letter Spacing and Word Spacing

Fine-tuning the space between characters and words can transform the feel of text from generic to refined.

```css
/* ── Letter spacing (tracking) ───────────────────────────────────────── */

/* ❌ Using px for letter-spacing — doesn't scale with font size */
h1 {
  letter-spacing: -2px;
}

/* ✅ Using em — scales proportionally with font size */
/* Uppercase labels: open up the tracking significantly */
.label-uppercase {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em; /* 10% of font size — more air for small caps */
  font-weight: 600;
}

/* Display headings: slightly negative tracking for large text */
h1 {
  font-size: clamp(3rem, 5vw, 6rem);
  letter-spacing: -0.025em; /* -2.5% — large text needs optical tightening */
}

h2 {
  font-size: clamp(2rem, 3vw, 3.5rem);
  letter-spacing: -0.015em; /* slightly less tight than h1 */
}

/* Body text: near-zero or zero letter-spacing */
body {
  font-size: 1rem;
  letter-spacing: 0.01em; /* just a hair of extra space — often improves readability */
}

/* ── Word spacing ─────────────────────────────────────────────────────── */

/* Rarely needed with modern typefaces, but useful for specific effects */
.pull-quote {
  font-size: 1.5rem;
  word-spacing: 0.05em; /* 5% extra space between words */
}

/* ── A complete refined heading style ───────────────────────────────────*/
.hero-title {
  font-size: clamp(3rem, 6vw, 7rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em; /* tight tracking for very large display type */
  text-wrap: balance; /* distribute words evenly across lines */
}
```

:::tip
Large type always benefits from slightly negative letter spacing. This is because spacing that looks natural at small sizes looks loose and gappy at display sizes. The rule of thumb: `letter-spacing: -0.02em` to `-0.04em` for headings above 48px. For body text, either leave it at zero or add a tiny positive value (`0.01em`) — never negative on body text.
:::

## text-wrap: balance and pretty — New CSS Superpowers

Two relatively new CSS values completely change how text wraps across lines, eliminating the common problem of a single orphaned word on the last line.

```css
/* ── text-wrap: balance ─────────────────────────────────────────────── */
/*
   BEFORE:
   "The most important thing in
   communication is
   typography"

   AFTER (with balance):
   "The most important thing
   in communication is
   typography"

   balance: distributes words as evenly as possible across lines
   Best for: headings, subheadings, short display text (max ~6 lines)
*/

h1,
h2,
h3,
h4,
h5,
h6,
.card-title,
.caption,
.label {
  text-wrap: balance;
}

/* ── text-wrap: pretty ───────────────────────────────────────────────── */
/*
   pretty: eliminates orphans (single words alone on the last line)
   Specifically designed for body text — better for long paragraphs
   than balance, which has a performance cost at scale.
*/
p,
li,
blockquote {
  text-wrap: pretty;
}

/* ── Practical complete example ─────────────────────────────────────── */
.blog-post h2 {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-wrap: balance; /* No more awkward single-word last lines in headings */
  max-width: 30ch; /* Encourage natural 3-4 line wrapping */
}

.blog-post p {
  font-size: clamp(1rem, 1.5vw + 0.5rem, 1.125rem);
  line-height: 1.7;
  max-width: 70ch;
  text-wrap: pretty; /* Clean, natural wrapping without orphans */
}
```

:::note
`text-wrap: balance` has a notable performance consideration — browsers have to calculate the optimal wrapping, which is expensive for large amounts of text. Limit its use to headings and short text elements, not paragraphs or large text blocks. `text-wrap: pretty` is optimized for longer text and has a much lower performance cost.
:::

## Font Loading and Performance

No matter how good your type scale is, if fonts load slowly, users see a flash of unstyled text (FOUT) or invisible text (FOIT). Both are jarring.

```css
/* ── @font-face: loading custom fonts ───────────────────────────────── */

@font-face {
  font-family: 'Inter';
  /* Provide both woff2 and woff for maximum compatibility */
  /* woff2 is smaller and more compressed — browsers that support it will use it */
  src:
    url('/fonts/inter-variable.woff2') format('woff2-variations'),
    url('/fonts/inter-variable.woff') format('woff-variations');
  font-weight: 100 900; /* For variable fonts: declare the full range */
  font-style: normal;
  /*
    font-display: swap
    - Shows system font immediately (no invisible text)
    - Swaps to custom font when it loads (brief re-render)
    - Best for body text: content is visible right away

    font-display: optional
    - Shows custom font only if it loads within a very short window
    - Falls back to system font permanently if it misses the window
    - Best for non-essential display fonts: no layout shift

    font-display: block
    - Hides text for up to 3s while font loads (FOIT)
    - Only for critical icon fonts where the system fallback is meaningless
  */
  font-display: swap;
}

/* ── System font stack — zero loading time ───────────────────────────── */
body {
  font-family:
    'Inter',
    /* Your preferred font */ system-ui,
    /* OS default: Segoe UI on Windows, SF Pro on macOS/iOS */ -apple-system,
    /* Safari + older macOS */ BlinkMacSystemFont,
    /* Chrome on macOS */ 'Segoe UI',
    /* Windows */ Roboto,
    /* Android */ 'Helvetica Neue',
    /* Older macOS/iOS fallback */ Arial,
    /* Universal fallback */ sans-serif; /* Generic fallback */
}

/* ── Monospace system stack for code blocks ─────────────────────────── */
code,
pre,
kbd {
  font-family:
    'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, 'SF Mono',
    'Menlo', Consolas, 'Courier New', monospace;
  font-size: 0.9em; /* Monospace fonts visually appear larger — scale down slightly */
}
```

```html
<!-- ── Preload critical fonts in HTML <head> ─────────────────────────── -->
<!-- Only preload the font used in the first screenful (above the fold) -->
<!-- Preloading too many fonts HURTS performance — be selective -->
<link
  rel="preload"
  href="/fonts/inter-variable.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

:::warning
Never preload every font variant. Preloading causes the browser to fetch the resource immediately, competing with other critical resources. Only preload the woff2 file used for body text — the font that appears in the first visible screenful. Other weights and styles can load normally.
:::

## Variable Fonts — Responsive by Nature

Variable fonts contain an entire font family in a single file. One file holds all weights, widths, and styles as continuous axes that CSS can control with precise values.

```css
/* ── Loading and using a variable font ──────────────────────────────── */

@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/InterVariable.woff2') format('woff2-variations');
  font-weight: 100 900; /* full range available in one file */
  font-display: swap;
}

/* ── Standard axis: font-weight ─────────────────────────────────────── */
/* With variable fonts, font-weight can be ANY number (not just 100, 400, 700) */
.hero-title {
  font-weight: 820; /* exactly 820 — available in variable fonts */
}

.body-text {
  font-weight: 420; /* not bold but slightly heavier than 400 */
}

/* ── font-variation-settings: access advanced axes ──────────────────── */
/* 'wght' = weight axis */
/* 'wdth' = width axis (condensed ↔ expanded) */
/* 'ital' = italic axis */
/* 'slnt' = slant axis */
/* 'opsz' = optical size (designed for small vs large text) */

.condensed-heading {
  font-family: 'Roboto Flex', sans-serif;
  font-variation-settings:
    'wght' 700,
    /* bold weight */ 'wdth' 75,
    /* 75% width — condensed */ 'opsz' 32; /* optical size: 32pt — optimized for display */
}

.body-copy {
  font-family: 'Roboto Flex', sans-serif;
  font-variation-settings:
    'wght' 400,
    'wdth' 100,
    /* normal width */ 'opsz' 16; /* optical size: 16pt — optimized for small text */
}

/* ── MAGIC: Animate font weight for interactive effects ─────────────── */
/* Variable fonts can be transitioned smoothly */
.nav-link {
  font-weight: 400;
  transition: font-weight 200ms ease;
}

.nav-link:hover {
  font-weight: 700; /* No layout shift because the font was pre-loaded */
}

/* ── Fluid font-weight based on viewport ────────────────────────────── */
/* Get heavier as the viewport gets wider (needs the full wght range) */
@supports (font-variation-settings: normal) {
  h1 {
    font-variation-settings: 'wght' clamp(600, 300 + 30vw, 900);
    /* Mobile: ~600 weight, Desktop: 900 weight */
  }
}
```

:::tip
Variable fonts from Google Fonts are free. Use `Inter`, `Roboto Flex`, `Source Sans 3`, or `Playfair Display` as variable fonts. A single variable font file is usually 10–20% larger than a single static weight but much smaller than loading 3–4 separate static weights. If your design uses more than two weights, a variable font is almost always the right choice.
:::

## Responsive Typography for Dark Mode

System dark mode (`prefers-color-scheme: dark`) requires typography adjustments beyond just color changes — contrast, weight, and size all behave differently on dark backgrounds.

```css
/* ── Base (light mode) typography ────────────────────────────────────── */
:root {
  --text-primary: #0f172a; /* near-black */
  --text-secondary: #475569; /* medium gray */
  --text-muted: #94a3b8; /* light gray */

  /* Light mode: standard weight is fine */
  --body-weight: 400;
  --heading-weight: 700;
}

/* ── Dark mode typography adjustments ───────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f1f5f9; /* near-white — NOT pure white (too harsh) */
    --text-secondary: #94a3b8; /* lighter gray */
    --text-muted: #475569; /* darker for muted text */

    /*
      IMPORTANT: In dark mode, text appears HEAVIER and LARGER than on
      light backgrounds due to the halation effect (light bleed on dark).
      Reduce font weight slightly to compensate.
    */
    --body-weight: 350; /* slightly lighter than 400 */
    --heading-weight: 600; /* slightly lighter than 700 */
  }
}

body {
  color: var(--text-primary);
  font-weight: var(--body-weight);
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: var(--text-primary);
  font-weight: var(--heading-weight);
}

/* For variable fonts: smooth transition between modes */
@supports (font-variation-settings: normal) {
  body {
    font-variation-settings: 'wght' var(--body-weight);
    transition: font-variation-settings 200ms ease;
  }
}
```

:::note
Using pure white (`#ffffff`) on a dark background creates a harsh optical illusion — the white text appears to bloom slightly into the dark background (called halation). This makes it look heavier and slightly blurry. Off-white values like `#f1f5f9` or `#e2e8f0` read as "white" to the eye but avoid the harshness. This is why most professional dark-mode designs use off-white text, not pure white.
:::

## Accessible Typography — WCAG Compliance

Responsive typography must also be accessible. The Web Content Accessibility Guidelines specify minimum contrast ratios that are non-negotiable for professional work.

```css
/* ── Minimum contrast ratios (WCAG 2.1) ─────────────────────────────── */
/*
   WCAG AA (minimum compliance):
   - Normal text (< 18pt / 24px): 4.5:1 contrast ratio
   - Large text (≥ 18pt / 24px bold or 24pt): 3:1 contrast ratio

   WCAG AAA (enhanced compliance):
   - Normal text: 7:1 contrast ratio
   - Large text: 4.5:1 contrast ratio

   Test your contrast: https://webaim.org/resources/contrastchecker/
*/

/* ── Example accessible color pairs ─────────────────────────────────── */
/* These all meet WCAG AA minimum */

/* Dark on white — 18:1 ratio (far exceeds AA) */
body {
  background: #ffffff;
  color: #1a1a2e;
}

/* Medium gray on white — 7:1 ratio (meets AAA) */
.secondary-text {
  color: #595959;
}

/* ❌ FAILS WCAG AA on white background */
.muted-text-bad {
  color: #aaaaaa; /* Only 2.3:1 contrast on white — DO NOT USE for readable text */
}

/* ── Respecting user font size preferences ───────────────────────────── */
/* NEVER override browser font size settings with fixed px on html */
html {
  /* ✅ Don't set font-size here at all, or use a % or rem value */
  font-size: 100%; /* Equivalent to keeping the browser default */
}

/* ── Respecting user motion preferences ─────────────────────────────── */
/* Animated text effects should be disabled if user requests it */
@media (prefers-reduced-motion: reduce) {
  * {
    /* Disable font-variation-settings transitions for users who request it */
    transition: none !important;
    animation: none !important;
  }
}

/* ── Focus styles on text links ──────────────────────────────────────── */
/* Don't remove focus outlines — they're essential for keyboard navigation */
a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 2px;
}
```

:::warning
Removing or overriding `outline: none` on focusable elements without providing an alternative is a serious accessibility failure. Keyboard users and screen reader users depend on visible focus indicators to know where they are on the page. If you dislike the default browser outline, replace it — don't just delete it.
:::

## A Complete Responsive Type System

Putting everything together — here is a production-ready, fully responsive typography system that you can use as a foundation for any project.

```css
/* ════════════════════════════════════════════════════════════════════════
   COMPLETE RESPONSIVE TYPOGRAPHY SYSTEM
   Scale: 375px mobile → 1440px desktop
   Method: clamp() fluid scaling + CSS custom properties
   Accessibility: WCAG AA compliant, respects browser settings
   ════════════════════════════════════════════════════════════════════════ */

/* ── 1. Font loading ──────────────────────────────────────────────────── */
@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/InterVariable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}

/* ── 2. Custom properties ─────────────────────────────────────────────── */
:root {
  /* Font families */
  --font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-serif: 'Playfair Display', Georgia, serif; /* for editorial content */

  /* Fluid type scale: clamp(min, preferred, max) */
  --text-xs: clamp(0.694rem, 0.15vw + 0.65rem, 0.8rem);
  --text-sm: clamp(0.833rem, 0.19vw + 0.78rem, 0.958rem);
  --text-base: clamp(1rem, 0.23vw + 0.94rem, 1.15rem);
  --text-lg: clamp(1.2rem, 0.39vw + 1.09rem, 1.438rem);
  --text-xl: clamp(1.44rem, 0.61vw + 1.25rem, 1.797rem);
  --text-2xl: clamp(1.728rem, 0.91vw + 1.42rem, 2.247rem);
  --text-3xl: clamp(2.074rem, 1.32vw + 1.63rem, 2.809rem);
  --text-4xl: clamp(2.488rem, 1.87vw + 1.87rem, 3.511rem);
  --text-5xl: clamp(2.986rem, 2.61vw + 2.15rem, 4.389rem);
  --text-display: clamp(3.583rem, 3.57vw + 2.47rem, 5.486rem);

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.1;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;
  --leading-loose: 2;

  /* Letter spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* Measure (max line length) */
  --measure-narrow: 45ch;
  --measure-base: 65ch;
  --measure-wide: 80ch;

  /* Colors */
  --color-text: #1e293b;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #f8fafc;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #f1f5f9;
    --color-text-secondary: #94a3b8;
    --color-text-muted: #64748b;
    --color-text-inverse: #0f172a;
  }
}

/* ── 3. Base styles ───────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 100%; /* Respect browser default — DO NOT hardcode px here */
  -webkit-text-size-adjust: 100%; /* Prevent iOS font scaling on orientation change */
  text-size-adjust: 100%;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 400;
  line-height: var(--leading-relaxed);
  color: var(--color-text);
  text-rendering: optimizeSpeed; /* faster than optimizeLegibility at body size */
}

/* ── 4. Heading scale ─────────────────────────────────────────────────── */
h1,
h2,
h3,
h4,
h5,
h6 {
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
  text-wrap: balance;
}

h1 {
  font-size: var(--text-5xl);
  letter-spacing: var(--tracking-tighter);
  font-weight: 800;
}

h2 {
  font-size: var(--text-4xl);
  letter-spacing: -0.03em;
}

h3 {
  font-size: var(--text-3xl);
}
h4 {
  font-size: var(--text-2xl);
}
h5 {
  font-size: var(--text-xl);
}
h6 {
  font-size: var(--text-lg);
}

/* ── 5. Body content ──────────────────────────────────────────────────── */
p {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  max-width: var(--measure-base);
  text-wrap: pretty;
  color: var(--color-text);
}

/* ── 6. Utility classes ───────────────────────────────────────────────── */
.text-xs {
  font-size: var(--text-xs);
}
.text-sm {
  font-size: var(--text-sm);
}
.text-base {
  font-size: var(--text-base);
}
.text-lg {
  font-size: var(--text-lg);
}
.text-xl {
  font-size: var(--text-xl);
}
.text-2xl {
  font-size: var(--text-2xl);
}
.text-display {
  font-size: var(--text-display);
}

.text-secondary {
  color: var(--color-text-secondary);
}
.text-muted {
  color: var(--color-text-muted);
}

.font-light {
  font-weight: 300;
}
.font-normal {
  font-weight: 400;
}
.font-medium {
  font-weight: 500;
}
.font-semibold {
  font-weight: 600;
}
.font-bold {
  font-weight: 700;
}
.font-black {
  font-weight: 900;
}

.leading-tight {
  line-height: var(--leading-tight);
}
.leading-normal {
  line-height: var(--leading-normal);
}
.leading-relaxed {
  line-height: var(--leading-relaxed);
}

.tracking-tight {
  letter-spacing: var(--tracking-tight);
}
.tracking-normal {
  letter-spacing: var(--tracking-normal);
}
.tracking-wide {
  letter-spacing: var(--tracking-wide);
}
.tracking-widest {
  letter-spacing: var(--tracking-widest);
}

.text-balance {
  text-wrap: balance;
}
.text-pretty {
  text-wrap: pretty;
}

/* ── 7. Accessibility ─────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* ── 8. Code and pre ──────────────────────────────────────────────────── */
code {
  font-family: var(--font-mono);
  font-size: 0.9em; /* slightly smaller — mono fonts read large */
  background: rgba(0, 0, 0, 0.06);
  padding: 0.1em 0.35em;
  border-radius: 3px;
}

pre {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  overflow-x: auto;
  padding: 1.5rem;
}

/* ── 9. Blockquote ───────────────────────────────────────────────────── */
blockquote {
  font-size: var(--text-xl);
  font-style: italic;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  border-left: 4px solid currentColor;
  padding-left: 1.5rem;
  max-width: var(--measure-narrow);
  text-wrap: balance;
}

/* ── 10. Labels and captions ─────────────────────────────────────────── */
.label {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

figcaption,
.caption {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
  max-width: var(--measure-base);
  text-wrap: pretty;
}
```

## Quick Reference — Typography Properties Cheatsheet

```text
┌────────────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE TYPOGRAPHY QUICK REFERENCE               │
│                                                                        │
│  UNITS                                                                 │
│  ─────────────────────────────────────────────────────────────────     │
│  rem    → font-size (respects browser preference, no compounding)      │
│  em     → padding, margin (scales with component's own font-size)      │
│  ch     → max-width for measure (character-width based)                │
│  px     → borders, shadows, min/max constraints                        │
│  clamp()→ everything that should scale between min and max             │
│                                                                        │
│  SCALE                                                                 │
│  ─────────────────────────────────────────────────────────────────     │
│  Modular scale options: 1.067 (minor 2nd), 1.125 (major 2nd),         │
│  1.250 (major 3rd), 1.333 (perfect 4th), 1.414 (augmented 4th)        │
│                                                                        │
│  OPTIMAL VALUES                                                        │
│  ─────────────────────────────────────────────────────────────────     │
│  Body font-size: 1rem–1.125rem (16px–18px)                             │
│  Heading line-height: 1.0–1.3                                          │
│  Body line-height: 1.5–1.7                                             │
│  Measure (max-width): 60ch–75ch for body, 20ch–30ch for headlines     │
│  Letter spacing on display type: -0.02em to -0.04em                   │
│  Letter spacing on caps/labels: 0.05em to 0.15em                      │
│                                                                        │
│  DO                             DON'T                                  │
│  ─────────────────────────────  ──────────────────────────────────     │
│  Use clamp() for fluid text     Use bare vw without clamp()            │
│  Use rem for font-size          Set html font-size in px               │
│  Set max-width on paragraphs    Let text run full-width on desktop     │
│  Use text-wrap: balance/pretty  Leave orphaned words in headings       │
│  Preload only critical fonts    Preload all font weights               │
│  Test WCAG contrast             Use gray text below 4.5:1 on white    │
│  Adjust weight in dark mode     Use pure white text on dark bg         │
└────────────────────────────────────────────────────────────────────────┘
```

:::note
Typography is the invisible foundation of every good design. When it's done right, nobody notices — they just find the content easy to read, pleasant to look at, and natural to navigate. When it's done wrong, everything feels slightly off even if users can't say why. The techniques in this guide — fluid scaling with `clamp()`, controlled line length with `ch`, refined tracking, balanced wrapping, and a system built on CSS custom properties — give you everything you need to make typography that's as invisible as it should be.
:::
