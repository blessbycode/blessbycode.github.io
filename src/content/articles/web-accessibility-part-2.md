---
title: 'Accessibility in HTML and CSS - Part 2'
published: 2026-01-12
draft: false
description: 'Second installment of the 2-part series about Accessibility in HTML and CSS.'
toc: true
series: 'web accessibility'
tags: ['accessibility']
icons: ['html-5']
tech: 'html'
---

## color Contrast — Legibility for All Vision Types

color contrast is one of the most commonly failed WCAG criteria. Insufficient contrast makes text difficult or impossible to read for people with low vision or color blindness.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                  WCAG CONTRAST REQUIREMENTS                              │
│                                                                          │
│  Text type              WCAG AA (min)    WCAG AAA (enhanced)             │
│  ─────────────────────  ───────────────  ─────────────────────           │
│  Normal text (< 18pt)   4.5 : 1          7 : 1                          │
│  Large text (≥ 18pt     3 : 1            4.5 : 1                        │
│  or 14pt bold)                                                           │
│  UI components &         3 : 1            N/A                            │
│  graphical objects                                                       │
│  Decorative text         No requirement   No requirement                 │
│  Logos / brand text      No requirement   No requirement                 │
│                                                                          │
│  Tools: WebAIM Contrast Checker, browser DevTools, axe, Lighthouse      │
└──────────────────────────────────────────────────────────────────────────┘
```

```css
/* ── Example contrast pairs ─────────────────────────────────────────── */

/* ❌ FAILS WCAG AA: black text on medium gray */
.bad-contrast {
  color: #767676; /* Mid-gray text */
  background: #ffffff; /* White bg */
  /* Contrast ratio: 4.48:1 — just misses AA for normal text */
}

/* ✅ PASSES WCAG AA: dark text on white */
.good-contrast {
  color: #595959; /* Slightly darker gray */
  background: #ffffff; /* White bg */
  /* Contrast ratio: 7:1 — passes AAA */
}

/* ❌ Common mistake: light gray text for "secondary" information */
.secondary-text {
  color: #aaaaaa; /* 2.32:1 on white — fails AA */
}

/* ✅ Fix: use a darker value for secondary text */
.secondary-text {
  color: #767676; /* 4.54:1 on white — passes AA */
}

/* ── color alone must never be the ONLY means of conveying information */

/* ❌ WRONG: using only color to show validation state */
.input-error {
  border-color: red; /* colorblind users may not see the red */
}

/* ✅ RIGHT: color + icon + text + border pattern */
.input-error {
  border: 2px solid #d32f2f; /* red border */
}

.input-error + .error-message::before {
  content: '⚠ '; /* warning icon */
}

/* Error text is also shown below the input separately */

/* ── Focus indicators need sufficient contrast too ──────────────────── */
/* The focus outline itself must have 3:1 contrast against adjacent colors */
:focus-visible {
  outline: 3px solid #0070f3; /* #0070f3 on white = 4.63:1 ✅ */
  outline-offset: 2px;
}

/* ── Forced colors / Windows High Contrast support ──────────────────── */
@media (forced-colors: active) {
  /* Windows High Contrast ignores most CSS colors.
     Use these keywords to opt in to system colors: */
  .custom-button {
    background-color: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonText;
  }

  /* Ensure background images that carry information are still visible */
  .icon-warning {
    forced-color-adjust: none; /* opt out of forced colors for this element */
  }
}
```

:::note
Do not rely solely on color contrast tools — also test with real users and simulation tools. The color Blindness Simulator by Coblis, browser extensions like NoCoffee, and Chrome's accessibility emulation (DevTools > Rendering > Emulate vision deficiencies) help you experience your UI as others do.
:::

## The Visually Hidden Technique — Off-Screen but Accessible

Sometimes you need text that is invisible to sighted users but fully accessible to screen readers. The classic `display: none` hides content from everyone — including AT. The visually-hidden pattern keeps content in the accessibility tree while removing it visually.

```css
/* ── The standard visually-hidden utility class ─────────────────────── */
.visually-hidden,
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Visually hidden but focusable (for skip links) ─────────────────── */
.visually-hidden-focusable:not(:focus):not(:focus-within) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Skip link: hidden until focused ────────────────────────────────── */
.skip-link {
  position: absolute;
  top: -100%; /* Offscreen when not focused */
  left: 1rem;
  z-index: 9999;
  background: #0070f3;
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  border-radius: 0 0 4px 4px;
  font-weight: 600;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 0; /* Slides into view when focused with Tab */
}

/* ── Never use these to hide accessible content ─────────────────────── */
/* display: none      — hides from BOTH visual and AT */
/* visibility: hidden — hides from BOTH visual and AT */
/* opacity: 0         — hides visually but MAY still be in AT tree (inconsistent) */
/* hidden attribute   — hides from BOTH visual and AT */
```

```html
<!-- ── Use cases for visually-hidden text ────────────────────────────── -->

<!-- 1. Supplementary context for icon-only buttons -->
<button type="button">
  <svg aria-hidden="true" focusable="false"><!-- close icon --></svg>
  <span class="visually-hidden">Close modal</span>
</button>

<!-- 2. Additional context for links that repeat on a page -->
<!-- If you have "Read more" links, differentiate them with hidden text -->
<article>
  <h3>CSS Grid Mastery</h3>
  <p>A complete guide to CSS Grid layouts...</p>
  <a href="/blog/css-grid">
    Read more
    <span class="visually-hidden">about CSS Grid Mastery</span>
  </a>
</article>

<!-- 3. Announcing required field convention at the top of forms -->
<p>
  Fields marked with
  <abbr title="required" aria-hidden="true">*</abbr>
  <span class="visually-hidden">an asterisk</span>
  are required.
</p>

<!-- 4. Providing table summary information -->
<caption>
  <span class="visually-hidden">
    Table showing quarterly sales figures for 2025. Column headers are quarters;
    rows are product categories.
  </span>
  Quarterly Sales 2025
</caption>

<!-- 5. Labelling landmark regions more specifically -->
<nav aria-label="Breadcrumb">
  <!-- The aria-label is what screen readers use — no visual equivalent needed -->
</nav>
```

## Tables — Structured Data for Everyone

Data tables need explicit structure to be understandable by screen readers. Without it, a table is just a visual grid with no meaning.

```html
<!-- ── Simple data table ─────────────────────────────────────────────── -->
<table>
  <caption>
    Team performance metrics for Q3 2025
    <!-- caption is announced before table content — like a title -->
  </caption>
  <thead>
    <tr>
      <!-- scope="col" tells AT this header applies to its column -->
      <th scope="col">Team member</th>
      <th scope="col">Projects completed</th>
      <th scope="col">Average rating</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <!-- scope="row" for row headers -->
      <th scope="row">Alice Johnson</th>
      <td>12</td>
      <td>4.8</td>
      <td>Active</td>
    </tr>
    <tr>
      <th scope="row">Bob Smith</th>
      <td>9</td>
      <td>4.5</td>
      <td>Active</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Team average</th>
      <td>10.5</td>
      <td>4.65</td>
      <td>—</td>
    </tr>
  </tfoot>
</table>

<!-- ── Complex table with spanning headers ───────────────────────────── -->
<!-- For tables with merged cells, use id/headers to explicitly link cells -->
<table>
  <caption>
    Sales data by region and quarter
  </caption>
  <thead>
    <tr>
      <th scope="col" id="region">Region</th>
      <th scope="colgroup" colspan="2" id="h1-2025">H1 2025</th>
      <th scope="colgroup" colspan="2" id="h2-2025">H2 2025</th>
    </tr>
    <tr>
      <td></td>
      <!-- empty cell for the region column -->
      <th scope="col" id="q1" headers="h1-2025">Q1</th>
      <th scope="col" id="q2" headers="h1-2025">Q2</th>
      <th scope="col" id="q3" headers="h2-2025">Q3</th>
      <th scope="col" id="q4" headers="h2-2025">Q4</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row" id="europe">Europe</th>
      <td headers="europe q1">£240K</td>
      <td headers="europe q2">£280K</td>
      <td headers="europe q3">£310K</td>
      <td headers="europe q4">£390K</td>
    </tr>
  </tbody>
</table>

<!-- ── NEVER use tables for layout ───────────────────────────────────── -->
<!-- Tables communicate data structure. Using them for layout means
     screen readers announce "table, 3 columns, 2 rows" for every
     navigation bar or footer. Use CSS Grid and Flexbox for layout. -->
```

## Motion and Animation — Respecting Vestibular Disorders

Animations and motion on web pages can cause nausea, dizziness, and headaches for people with vestibular disorders. WCAG 2.3.3 (Level AAA) provides guidance, but respecting user preferences is a WCAG 2.1 Level AA expectation via `prefers-reduced-motion`.

```css
/* ── The prefers-reduced-motion media query ─────────────────────────── */
/*
  Some users configure their OS to reduce motion:
  - macOS: System Settings > Accessibility > Display > Reduce Motion
  - Windows: Settings > Accessibility > Visual Effects > Animation Effects
  - iOS: Settings > Accessibility > Motion > Reduce Motion
  - Android: Settings > Accessibility > Remove Animations

  When set, prefers-reduced-motion: reduce is active.
  Never override this user preference.
*/

/* ── Strategy 1: disable animations for reduced-motion users ──────────── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ── Strategy 2: opt-in approach (better than opt-out) ─────────────── */
/* Define animations only when the user hasn't requested reduced motion */
/* This ensures no animation by default, only add it when explicitly OK */

.animated-element {
  /* Base styles — no animation */
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: no-preference) {
  /* Only animate when the user hasn't asked for reduced motion */
  .animated-element {
    animation: slideIn 0.4s ease-out;
  }
}

/* ── Safe alternative: use opacity instead of motion ────────────────── */
/* Fading is generally safe — motion is what causes issues */
@media (prefers-reduced-motion: reduce) {
  .modal {
    /* Remove the slide-in animation */
    animation: none;
    /* But keep the fade — opacity changes are generally well-tolerated */
    transition: opacity 0.2s ease;
  }
}

/* ── Parallax: always provide a way to disable ──────────────────────── */
.parallax-section {
  /* Default: has parallax scroll effect */
  background-attachment: fixed;
}

@media (prefers-reduced-motion: reduce) {
  .parallax-section {
    background-attachment: scroll; /* disable parallax entirely */
  }
}

/* ── Infinite animations: especially important to stop ──────────────── */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
    /* Provide an alternative visual indicator if needed */
  }
}
```

:::warning
Parallax scrolling effects, auto-playing carousels, and large-scale motion animations can trigger serious medical episodes in users with vestibular disorders. These conditions affect roughly 35% of adults over 40. Always respect `prefers-reduced-motion`. If you must have auto-playing animations, provide a pause/stop control — this is WCAG 2.2.2 Level A.
:::

## Responsive Design and Reflow — WCAG 1.4.10

WCAG 1.4.10 (Reflow, Level AA) requires that content can be presented in a single column without horizontal scrolling at 320px wide (equivalent to 400% zoom on a 1280px display). Low-vision users commonly zoom in to 200–400%.

```css
/* ── Mobile-first, flexible layouts ─────────────────────────────────── */

/* ✅ Flexible units — scale with user's font preference and zoom */
.container {
  max-width: 1200px;
  width: 90%; /* not 1200px fixed */
  margin: 0 auto;
}

.card-grid {
  display: grid;
  /* Auto-fill with minimum 280px columns — reflows to 1 column at narrow widths */
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ❌ Fixed widths that cause horizontal scroll on zoom */
.bad-layout {
  width: 1200px; /* won't reflow — horizontal scroll at high zoom */
  font-size: 14px; /* fixed — ignores user's font preferences */
}

/* ── Text should wrap, not overflow ─────────────────────────────────── */
p,
li,
td,
th,
label,
button {
  overflow-wrap: break-word; /* prevent text from overflowing containers */
  word-break: break-word;
}

/* ── Minimum touch target size ──────────────────────────────────────── */
/* WCAG 2.5.5 (Level AAA): 44×44px minimum touch target
   WCAG 2.5.8 (Level AA in WCAG 2.2): 24×24px minimum */
button,
a,
[role='button'],
input[type='checkbox'],
input[type='radio'] {
  min-height: 44px;
  min-width: 44px;
  /* Ensure adequate spacing so adjacent targets don't overlap */
}

/* For small visual elements, use padding to extend the hit area */
.small-icon-button {
  padding: 12px; /* extends the clickable area beyond the visual element */
}

/* ── Never disable zoom ──────────────────────────────────────────────── */
/*
  ❌ NEVER USE THIS IN <meta viewport>:
  <meta name="viewport" content="user-scalable=no">
  <meta name="viewport" content="maximum-scale=1">

  These prevent users from zooming — a WCAG 1.4.4 Level AA failure.
  Many low-vision users NEED to zoom. Period.
*/

/* ✅ Correct viewport meta tag: -->
/* <meta name="viewport" content="width=device-width, initial-scale=1"> */
```

## Language and Readability

Declaring the correct language and ensuring text is readable are underappreciated but important accessibility requirements.

```html
<!-- ── Always declare the page language ─────────────────────────────── -->
<!-- WCAG 3.1.1 (Level A): Language of Page -->
<!-- Screen readers use this to select the correct pronunciation engine -->
<html lang="en">
  <!-- English -->
  <html lang="en-GB">
    <!-- British English — more specific -->
    <html lang="fr">
      <!-- French -->
      <html lang="ar" dir="rtl">
        <!-- Arabic — right-to-left direction -->

        <!-- ── Mark language changes within content ──────────────────────────── -->
        <!-- WCAG 3.1.2 (Level AA): Language of Parts -->
        <p>
          The French phrase for good morning is
          <span lang="fr">Bonjour</span>, and the Japanese is
          <span lang="ja">おはようございます</span>.
        </p>

        <!-- ── Abbreviations need expansion ─────────────────────────────────── -->
        <abbr title="World Wide Web Consortium">W3C</abbr>
        <abbr title="Web Content Accessibility Guidelines">WCAG</abbr>

        <!-- On first use of an abbreviation, also spell it out inline:
     "The World Wide Web Consortium (W3C) publishes WCAG." -->

        <!-- ── Reading direction ─────────────────────────────────────────────── -->
        <!-- For mixed-direction content (RTL language with LTR code) -->
        <p lang="ar" dir="rtl">
          متغير يُسمى
          <code dir="ltr">userName</code>
          يُستخدم لتخزين الاسم.
        </p>
      </html>
    </html>
  </html>
</html>
```

```css
/* ── Readable line length ────────────────────────────────────────────── */
/* WCAG 1.4.8 (Level AAA): Visual Presentation */
/* Optimal measure: 45–75 characters per line */
p,
li,
td {
  max-width: 70ch; /* ch unit: width of the "0" character */
}

/* ── Text spacing: users must be able to override it without content loss */
/* WCAG 1.4.12 (Level AA): Text Spacing */
/* Your layout must not break when these are applied: */
/* line-height: 1.5 × font-size */
/* letter-spacing: 0.12 × font-size */
/* word-spacing: 0.16 × font-size */
/* paragraph spacing: 2 × font-size */

/* Test this with the Text Spacing Bookmarklet by Steve Faulkner */
body {
  line-height: 1.5; /* meet this minimum */
}
p + p {
  margin-top: 1em; /* ensure paragraph spacing is robust */
}
```

## Testing Accessibility — Tools and Techniques

Building accessible websites requires testing at multiple levels. No single tool catches everything.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                     ACCESSIBILITY TESTING LAYERS                         │
│                                                                          │
│  1. AUTOMATED TOOLS (catch ~30–40% of issues)                           │
│     axe DevTools (browser extension — best free tool)                   │
│     Lighthouse (built into Chrome DevTools)                             │
│     WAVE (browser extension — great visual output)                      │
│     IBM Equal Access Checker                                            │
│                                                                          │
│  2. SEMI-AUTOMATED / MANUAL TOOLS                                        │
│     Accessibility Insights for Web (Microsoft — free, excellent)        │
│     axe-core in your CI/CD pipeline (jest-axe, cypress-axe)             │
│     HTML validators (validator.w3.org)                                  │
│                                                                          │
│  3. MANUAL KEYBOARD TESTING                                              │
│     Tab through every interactive element                               │
│     Test Shift+Tab (reverse direction)                                  │
│     Activate buttons/links with Enter and Space                         │
│     Use arrow keys for component navigation (menus, tabs, sliders)      │
│     Verify focus is always visible                                      │
│     Verify modals trap focus correctly                                  │
│                                                                          │
│  4. SCREEN READER TESTING                                                │
│     macOS/iOS: VoiceOver (built-in — free)                              │
│     Windows: NVDA (free) + Chrome or Firefox                            │
│     Windows: JAWS (industry standard — paid)                            │
│     Android: TalkBack (built-in — free)                                 │
│                                                                          │
│  5. USER TESTING with people with disabilities                           │
│     No tool replaces real users. Aim to include disabled users         │
│     in usability testing for every major product release.               │
└──────────────────────────────────────────────────────────────────────────┘
```

```javascript
// ── Integrating axe-core in automated tests (Jest + React) ───────────
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('NavigationMenu has no accessibility violations', async () => {
  const { container } = render(<NavigationMenu />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// ── Integrating axe in Cypress E2E tests ─────────────────────────────
// cypress/support/commands.js
import 'cypress-axe';

// In your spec file:
it('Home page has no accessibility violations', () => {
  cy.visit('/');
  cy.injectAxe();
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: true },
      'image-alt': { enabled: true },
    },
  });
});
```

:::important
Aim to run automated axe tests on every page in your test suite in CI/CD. This catches regressions instantly. However, remember that automated tools catch only 30–40% of accessibility issues. The remaining 60–70% require manual keyboard testing and screen reader testing. Schedule regular manual audits.
:::

## A Complete Accessible Component — Putting It All Together

```html
<!-- ── Fully accessible disclosure / accordion component ─────────────── -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accessible Accordion</title>
    <style>
      /* Skip link */
      .skip-link {
        position: absolute;
        top: -100%;
        left: 1rem;
        background: #0070f3;
        color: #fff;
        padding: 0.5rem 1rem;
        text-decoration: none;
        border-radius: 0 0 4px 4px;
        z-index: 100;
      }
      .skip-link:focus {
        top: 0;
      }

      /* Focus styles */
      :focus-visible {
        outline: 3px solid #0070f3;
        outline-offset: 2px;
      }

      /* Accordion styles */
      .accordion {
        max-width: 700px;
        margin: 2rem auto;
      }

      .accordion-trigger {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        color: #1e293b;
      }

      /* Visual indicator for expanded state */
      .accordion-trigger[aria-expanded='true'] {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        background: #eff6ff;
        border-color: #bfdbfe;
      }

      .accordion-trigger[aria-expanded='true'] .icon {
        transform: rotate(180deg);
      }

      .accordion-panel {
        border: 1px solid #e2e8f0;
        border-top: none;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
        padding: 1.25rem;
      }

      .accordion-panel[hidden] {
        display: none;
      }

      .accordion-item + .accordion-item {
        margin-top: 0.5rem;
      }
    </style>
  </head>
  <body>
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <main id="main-content" tabindex="-1">
      <h1>Frequently Asked Questions</h1>

      <div class="accordion">
        <div class="accordion-item">
          <!--
          aria-expanded: communicates open/closed state to AT
          aria-controls: links the trigger to the panel it controls
          type="button": prevents accidental form submission
        -->
          <button
            type="button"
            class="accordion-trigger"
            aria-expanded="false"
            aria-controls="panel-1"
            id="trigger-1"
          >
            What is web accessibility?
            <span class="icon" aria-hidden="true">▼</span>
          </button>

          <!--
          aria-labelledby: announces panel with trigger's text as its label
          hidden: hides from both visual and AT (correct way to show/hide)
          role="region": landmark so users can navigate directly to it
        -->
          <div id="panel-1" role="region" aria-labelledby="trigger-1" hidden>
            <p>
              Web accessibility means designing websites and applications that
              people with disabilities can use. It encompasses visual, motor,
              auditory, and cognitive accessibility.
            </p>
          </div>
        </div>

        <div class="accordion-item">
          <button
            type="button"
            class="accordion-trigger"
            aria-expanded="false"
            aria-controls="panel-2"
            id="trigger-2"
          >
            Why is accessibility important?
            <span class="icon" aria-hidden="true">▼</span>
          </button>

          <div id="panel-2" role="region" aria-labelledby="trigger-2" hidden>
            <p>
              Accessibility matters for ethical, legal, and business reasons.
              Over 1 billion people have disabilities. Legal requirements exist
              in many countries. Accessible sites also rank better in search
              engines and work better for everyone.
            </p>
          </div>
        </div>
      </div>
    </main>

    <script>
      // Accordion keyboard and interaction logic
      document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
          const panel = document.getElementById(
            trigger.getAttribute('aria-controls'),
          );

          // Toggle
          trigger.setAttribute('aria-expanded', String(!isExpanded));
          panel.hidden = isExpanded;
        });

        // Keyboard support: already handled by button (Enter/Space activate it)
        // For accordion specifically, add Up/Down arrow navigation between triggers
        trigger.addEventListener('keydown', (e) => {
          const triggers = [...document.querySelectorAll('.accordion-trigger')];
          const index = triggers.indexOf(trigger);

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            triggers[(index + 1) % triggers.length].focus();
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            triggers[(index - 1 + triggers.length) % triggers.length].focus();
          }
          if (e.key === 'Home') {
            e.preventDefault();
            triggers[0].focus();
          }
          if (e.key === 'End') {
            e.preventDefault();
            triggers[triggers.length - 1].focus();
          }
        });
      });
    </script>
  </body>
</html>
```

## Quick Reference — Accessibility Checklist

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                  ACCESSIBILITY QUICK CHECKLIST                           │
│                                                                          │
│  STRUCTURE                                                               │
│  □ One <h1> per page, logical heading hierarchy (no skipped levels)     │
│  □ Landmark elements used correctly (<header>, <nav>, <main>, etc.)     │
│  □ Multiple <nav>s have unique aria-label values                        │
│  □ Skip-to-main-content link is the first focusable element             │
│  □ Page language declared with lang attribute on <html>                 │
│                                                                          │
│  IMAGES & MEDIA                                                          │
│  □ Informative images have meaningful alt text                          │
│  □ Decorative images have empty alt="" or aria-hidden="true"            │
│  □ Icon buttons have aria-label or visually-hidden text                 │
│  □ Videos have captions; audio has transcripts                          │
│                                                                          │
│  FORMS                                                                   │
│  □ Every input has a programmatically associated label                  │
│  □ Related inputs grouped with fieldset + legend                        │
│  □ Error messages linked to inputs with aria-describedby                │
│  □ Required fields marked with aria-required="true"                     │
│  □ Error summary shown and focused on validation failure                │
│  □ Autocomplete attributes used for personal data fields                │
│                                                                          │
│  KEYBOARD                                                                │
│  □ All functionality operable by keyboard alone                         │
│  □ Focus indicator is visible on all interactive elements               │
│  □ Tab order follows logical reading order                              │
│  □ No focus trap outside of modals/dialogs                              │
│  □ Modals trap focus correctly and return focus on close                │
│  □ No tabindex values greater than 0                                    │
│                                                                          │
│  color & CONTRAST                                                       │
│  □ Normal text: 4.5:1 contrast ratio minimum                           │
│  □ Large text (18pt+ or 14pt+ bold): 3:1 contrast minimum              │
│  □ UI components (borders, icons): 3:1 contrast minimum                │
│  □ Information never conveyed by color alone                           │
│  □ Focus indicator has sufficient contrast                              │
│                                                                          │
│  MOTION & TIMING                                                         │
│  □ prefers-reduced-motion respected — animations disabled/reduced       │
│  □ No content flashes more than 3 times per second                     │
│  □ Auto-playing media has pause/stop control                            │
│  □ Session time-outs warn users before expiring                        │
│                                                                          │
│  CONTENT                                                                 │
│  □ Link text is meaningful out of context                               │
│  □ Buttons describe their action                                        │
│  □ Error messages describe the error AND how to fix it                 │
│  □ Pages have descriptive, unique <title> elements                     │
│  □ viewport meta does NOT include user-scalable=no or maximum-scale=1  │
└──────────────────────────────────────────────────────────────────────────┘
```

:::note
Accessibility is not a compliance checkbox — it is the measure of how many people can actually use what you build. Every semantic element you use, every contrast ratio you check, every focus indicator you style, and every form label you associate is a decision to include someone rather than exclude them. The web was built on the radical idea that information should be available to everyone. Build like you believe it.
:::
