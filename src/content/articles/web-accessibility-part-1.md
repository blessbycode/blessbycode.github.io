---
title: 'Accessibility in HTML and CSS - Part 1'
published: 2026-01-09
draft: false
description: 'Accessibility is not a feature you add at the end of a project — it is a quality you build into every decision from the beginning. A website that excludes people with disabilities is not just ethically wrong; it is a failure of craft. Follow this 2-part article that covers everything you need to know to build web experiences that genuinely work for everyone.'
toc: true
series: 'web accessibility'
tags: ['accessibility']
icons: ['html-5']
tech: 'html'
---

## What Accessibility Means and Who It Helps

Web accessibility means designing and building websites and applications that people with disabilities can perceive, understand, navigate, and interact with. The disabilities that matter in web contexts include visual (blindness, low vision, color blindness), auditory (deafness, hard of hearing), motor (limited hand movement, tremors, paralysis), and cognitive (dyslexia, attention disorders, memory impairments).

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                 THE SPECTRUM OF DISABILITY IN WEB CONTEXT                │
│                                                                          │
│  PERMANENT           TEMPORARY              SITUATIONAL                  │
│  ──────────────────  ──────────────────────  ───────────────────────     │
│  Blindness           Broken arm             Bright sunlight on screen   │
│  Deafness            Ear infection          Noisy environment           │
│  Motor impairment    Post-surgery fatigue   Holding a baby              │
│  Cognitive disorder  Medication effects     Slow internet connection    │
│                                                                          │
│  Designing for permanent disability ALWAYS improves the experience      │
│  for temporary and situational cases too. This is the Curb-Cut Effect.  │
│  Ramps help wheelchair users, parents with strollers, delivery workers. │
└──────────────────────────────────────────────────────────────────────────┘
```

**The scale of the audience:** The WHO estimates that 1.3 billion people — 16% of the global population — live with some form of significant disability. In the United States alone, the Americans with Disabilities Act (ADA) and Section 508 mandate digital accessibility for many organisations. The EU Web Accessibility Directive and EN 301 549 do the same in Europe. Inaccessible websites face legal action with increasing frequency.

:::note
Accessibility benefits far more people than those with permanent disabilities. Captions help someone watching a video in a library without headphones. High contrast helps someone reading outside in bright sunlight. Keyboard navigation helps a power user who prefers not to use a mouse. Good accessibility is just good design.
:::

## WCAG — The Standard You Need to Know

The **Web Content Accessibility Guidelines (WCAG)**, published by the W3C's Web Accessibility Initiative (WAI), are the internationally recognised standard for web accessibility. Every accessibility audit, legal requirement, and professional expectation is built on WCAG.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                    THE FOUR WCAG PRINCIPLES (POUR)                       │
│                                                                          │
│  P — PERCEIVABLE                                                         │
│      Information and UI components must be presentable to users         │
│      in ways they can perceive. You can't hide content from all senses. │
│                                                                          │
│  O — OPERABLE                                                            │
│      UI components and navigation must be operable. Users must be       │
│      able to interact with everything using whatever input they have.   │
│                                                                          │
│  U — UNDERSTANDABLE                                                      │
│      Information and UI operation must be understandable. Content       │
│      and controls must behave predictably and be readable.              │
│                                                                          │
│  R — ROBUST                                                              │
│      Content must be robust enough to be interpreted by assistive       │
│      technologies. Valid, semantic HTML is the foundation.              │
│                                                                          │
│  CONFORMANCE LEVELS:                                                     │
│  Level A   — Minimum. Must do. Serious barriers if absent.              │
│  Level AA  — Standard. Target for most legal requirements.              │
│  Level AAA — Enhanced. Gold standard. Not always achievable everywhere. │
└──────────────────────────────────────────────────────────────────────────┘
```

:::note
WCAG 2.2 (published October 2023) is the current version. WCAG 3.0 is in development with a fundamentally different scoring model. For practical compliance work, target **WCAG 2.2 Level AA** — this is what most legal frameworks require.
:::

## Semantic HTML — The Single Most Important Accessibility Decision

Semantic HTML is the use of HTML elements that carry meaning about the content they contain. A `<button>` is not just a styled box — it communicates to assistive technologies that this element is interactive, focusable, and activatable with a keystroke. A `<nav>` tells screen readers this region contains navigation links.

Using the wrong elements — or using no meaningful elements at all — is the single most common and most damaging accessibility mistake.

```html
<!-- ❌ THE WRONG WAY: div soup — looks identical visually, broken for AT -->
<div class="header">
  <div class="nav">
    <div class="nav-item" onclick="navigate('/')">Home</div>
    <div class="nav-item" onclick="navigate('/about')">About</div>
    <div class="nav-item" onclick="navigate('/contact')">Contact</div>
  </div>
</div>

<div class="main">
  <div class="article">
    <div class="heading">Welcome to Our Site</div>
    <div class="paragraph">This is the introduction text.</div>

    <div class="button" onclick="submitForm()">Subscribe</div>
  </div>
</div>

<!--
  Problems:
  - Screen reader can't identify the navigation region
  - Divs are not keyboard-focusable — keyboard users can't activate them
  - No heading hierarchy — screen readers can't jump between sections
  - The "button" has no role — AT doesn't know it's interactive
  - onclick on divs doesn't fire with the keyboard
-->

<!-- ✅ THE RIGHT WAY: semantic HTML that communicates structure and intent -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Welcome to Our Site</h1>
    <p>This is the introduction text.</p>

    <button type="button">Subscribe</button>
  </article>
</main>

<!--
  Benefits:
  ✅ <header> and <nav> are landmark regions — screen readers can jump to them
  ✅ <a> elements are keyboard-focusable and announce as links
  ✅ <h1> establishes the heading hierarchy
  ✅ <button> is keyboard-focusable, announces as button, activates with Enter/Space
  ✅ <main> identifies the primary content — screen readers can skip to it
-->
```

```html
<!-- ── Complete landmark element reference ──────────────────────────── -->

<header>
  <!-- Introductory content for page or section -->
  <nav>
    <!-- Navigation links -->
    <main>
      <!-- Primary content (only ONE per page) -->
      <aside>
        <!-- Complementary content (sidebars, pull quotes) -->
        <footer>
          <!-- Footer for page or section -->
          <article>
            <!-- Self-contained, independently distributable content -->
            <section>
              <!-- Thematic grouping — should have a heading -->
              <address>
                <!-- Contact information for nearest article/body -->

                <!-- These elements have implicit ARIA roles:
  <header>  → role="banner"
  <nav>     → role="navigation"
  <main>    → role="main"
  <aside>   → role="complementary"
  <footer>  → role="contentinfo"
-->
              </address>
            </section>
          </article>
        </footer>
      </aside>
    </main>
  </nav>
</header>
```

:::tip
If you use more than one `<nav>` element (main nav, breadcrumb, footer nav), give each a unique `aria-label` so screen reader users can distinguish between them. `<nav aria-label="Main navigation">` vs `<nav aria-label="Breadcrumb">`.
:::

## Headings — Giving Screen Reader Users a Table of Contents

Headings are the primary navigation tool for screen reader users. A survey by WebAIM found that 67.7% of screen reader users navigate web pages by jumping between headings. A broken heading hierarchy is like a book with chapter numbers in random order.

```html
<!-- ❌ WRONG: Using heading levels for visual size, not structure -->
<h1>Our Products</h1>
<h3>Electronics</h3>
<!-- jumped from h1 to h3 — h2 skipped! -->
<h5>Laptops</h5>
<!-- h5 under h3 without h4 -->
<h2>Contact Us</h2>
<!-- h2 after h5 — hierarchy destroyed -->

<!-- ❌ WRONG: Using a div styled to look like a heading -->
<div class="looks-like-h2">Section Title</div>
<!-- Screen reader skips this entirely — not a heading to assistive tech -->

<!-- ✅ RIGHT: Logical, sequential heading hierarchy -->
<h1>Our Products</h1>
<!-- Page title — one per page -->
<h2>Electronics</h2>
<!-- Top-level category -->
<h3>Laptops</h3>
<!-- Sub-category -->
<h4>Gaming Laptops</h4>
<!-- Sub-sub-category -->
<h3>Phones</h3>
<h4>Android</h4>
<h4>iPhone</h4>
<h2>Clothing</h2>
<h3>Men's</h3>
<h3>Women's</h3>

<!--
  Rules:
  1. Only ONE <h1> per page — the primary topic/title
  2. Never skip heading levels going DOWN (h1 → h3 is wrong)
  3. You CAN skip levels going BACK UP (going from h4 back to h2 is fine)
  4. Headings describe content — choose level based on structure, not appearance
  5. Use CSS to make any heading level look however you want
-->
```

:::warning
The "only one h1 per page" rule is WCAG best practice and widely expected, though HTML technically allows multiple h1 elements inside sectioning elements. In practice, use one h1 and build your hierarchy with h2–h6. Every automated accessibility auditing tool will flag multiple h1 elements.
:::

## Images and Alt Text — Making Visual Content Accessible

Every `<img>` element needs a decision about its alt text. The decision isn't always "write a description" — it depends on the image's purpose.

```html
<!-- ── Rule 1: Informative images — describe what matters ──────────── -->
<!-- ❌ Bad alt text: too vague -->
<img src="chart.png" alt="chart" />
<img src="team.jpg" alt="photo" />

<!-- ❌ Redundant alt text: starts with "Image of" / "Photo of" -->
<img src="dog.jpg" alt="Image of a golden retriever" />
<!-- Screen readers already announce "image" — alt text repeats it:
     "image, image of a golden retriever" — redundant! -->

<!-- ✅ Good: concise, specific, communicates the meaningful content -->
<img
  src="sales-chart.png"
  alt="Bar chart showing 40% revenue increase from Q1 to Q4 2025"
/>
<img
  src="team.jpg"
  alt="The five-person engineering team at the 2025 company retreat"
/>

<!-- ── Rule 2: Decorative images — empty alt to hide from AT ──────────── -->
<!-- If an image is purely decorative (adds no information), use alt="" -->
<!-- AT will skip the image entirely — no announcement of "image, blank" -->
<img src="divider-line.png" alt="" />
<img src="background-wave.svg" alt="" />

<!-- ── Rule 3: Functional images (buttons/links) — describe the ACTION ── -->
<!-- ❌ Bad: describes the image, not its purpose -->
<a href="/cart"><img src="cart-icon.png" alt="shopping cart icon" /></a>
<!-- Screen reader: "link, shopping cart icon" — what does this link DO? -->

<!-- ✅ Good: describes what the link/button does -->
<a href="/cart"
  ><img src="cart-icon.png" alt="View shopping cart (3 items)"
/></a>
<button><img src="search-icon.png" alt="Search" /></button>

<!-- ── Rule 4: Complex images — use longdesc or figure/figcaption ──────── -->
<figure>
  <img
    src="complex-diagram.png"
    alt="Network architecture diagram — see caption for full description"
    aria-describedby="diagram-desc"
  />
  <figcaption id="diagram-desc">
    The diagram shows three layers: client devices connecting to a load
    balancer, which distributes traffic to three application servers, each
    connected to a shared PostgreSQL database cluster with primary and two read
    replicas.
  </figcaption>
</figure>

<!-- ── Rule 5: SVG images — use role and title ──────────────────────────── -->
<!-- Inline SVG: add title and aria-labelledby -->
<svg role="img" aria-labelledby="svg-title" viewBox="0 0 100 100">
  <title id="svg-title">Upward trending revenue graph for Q3 2025</title>
  <!-- svg content -->
</svg>

<!-- Decorative SVG: hide from AT completely -->
<svg aria-hidden="true" focusable="false">
  <!-- purely decorative content -->
</svg>
```

:::tip
The best alt text passes the "replacement test" — if you removed the image and replaced it with only the alt text, would a reader still get all the important information the image conveyed? If yes, the alt text is good. If no, it needs more detail (or less, if it's decorative).
:::

## Links and Buttons — The Interactive Element Rules

Links and buttons are the two fundamental interactive controls on the web. Using them correctly — and using the right one for each job — is critical for keyboard and screen reader users.

```html
<!-- ── LINKS vs BUTTONS: which to use when ───────────────────────────── -->
<!--
  Use <a href="..."> when:
  - Navigating to a URL (same page, different page, external)
  - The action changes the URL in the browser
  - Right-clicking should show "Open in new tab"

  Use <button> when:
  - Triggering an action that doesn't navigate (submit form, toggle modal, etc.)
  - The interaction stays on the same page
  - Opening/closing something (modal, dropdown, accordion)
-->

<!-- ❌ WRONG: link with no href (just JavaScript onclick) -->
<a onclick="doSomething()">Click me</a>
<!-- This is not keyboard accessible and has no href — bad practice -->

<!-- ❌ WRONG: button used for navigation -->
<button onclick="window.location='/about'">About Us</button>
<!-- Right-click won't let you open in new tab, no href to share/bookmark -->

<!-- ✅ RIGHT: meaningful link destinations -->
<a href="/about">About Us</a>
<a href="#main-content">Skip to main content</a>

<!-- ✅ RIGHT: button for actions -->
<button
  type="button"
  id="open-modal-btn"
  aria-controls="modal"
  aria-expanded="false"
>
  Open settings
</button>

<!-- ── Link text must be meaningful out of context ───────────────────── -->
<!-- Screen reader users frequently navigate by listing all links on a page.
     If every link says "click here" or "read more", the list is useless. -->

<!-- ❌ BAD: meaningless link text -->
<p>Check out our new blog post. <a href="/blog/new-post">Click here</a>.</p>
<p>Download the report. <a href="/report.pdf">Read more</a>.</p>

<!-- ✅ GOOD: descriptive link text -->
<p>Check out our <a href="/blog/new-post">latest blog post on CSS Grid</a>.</p>
<p><a href="/report.pdf">Download the 2025 Annual Report (PDF, 2.4MB)</a>.</p>

<!-- ── New tab / external links ──────────────────────────────────────── -->
<!-- Always warn users when a link opens in a new tab -->
<!-- ❌ BAD: surprise new tab, no warning -->
<a href="https://external.com" target="_blank">External Site</a>

<!-- ✅ GOOD: warn screen readers AND sighted users -->
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
  External Site
  <span class="visually-hidden">(opens in a new tab)</span>
  <!-- OR: use an icon with aria-label -->
</a>

<!-- ── Buttons need descriptive labels ──────────────────────────────── -->
<!-- When a button contains only an icon, it MUST have an accessible label -->
<!-- ❌ BAD: icon-only button with no label -->
<button type="button">
  <svg><!-- heart icon --></svg>
</button>

<!-- ✅ GOOD: aria-label provides the accessible name -->
<button type="button" aria-label="Add to favourites">
  <svg aria-hidden="true" focusable="false"><!-- heart icon --></svg>
</button>

<!-- ✅ GOOD: visually hidden text -->
<button type="button">
  <svg aria-hidden="true" focusable="false"><!-- heart icon --></svg>
  <span class="visually-hidden">Add to favourites</span>
</button>
```

:::warning
Never use `<div>` or `<span>` as interactive elements without adding `role`, `tabindex`, and full keyboard event handling. This is called "reinventing the wheel badly." A native `<button>` gives you: keyboard focus for free, Enter and Space activation for free, the correct `role="button"` ARIA role for free, and correct `:focus` styling for free. The equivalent `<div>` requires you to manually implement all of that — and developers almost always miss something.
:::

## Forms — The Most Complex Accessibility Challenge

Forms are where many users with disabilities face the biggest barriers. Properly built forms are also where you can make the largest positive impact.

```html
<!-- ── Labels: every input needs an explicit label ─────────────────── -->

<!-- ❌ WRONG: placeholder is NOT a label -->
<input type="email" placeholder="Enter your email" />
<!-- Placeholders disappear when users type, have low contrast, aren't read
     reliably by all AT, and don't persist in the UI -->

<!-- ❌ WRONG: visual label not programmatically associated -->
<p>Email address</p>
<input type="email" />
<!-- The paragraph and input are unrelated to AT — label association requires
     the for/id relationship or nesting inside <label> -->

<!-- ✅ RIGHT METHOD 1: for/id association (most common) -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" autocomplete="email" />

<!-- ✅ RIGHT METHOD 2: wrapping label (no id needed) -->
<label>
  Email address
  <input type="email" name="email" autocomplete="email" />
</label>

<!-- ✅ RIGHT METHOD 3: aria-labelledby (when label is an existing element) -->
<h2 id="billing-title">Billing Address</h2>
<input type="text" aria-labelledby="billing-title" />

<!-- ── Complete accessible form example ─────────────────────────────── -->
<form action="/register" method="post" novalidate>
  <fieldset>
    <legend>Personal Information</legend>
    <!-- fieldset + legend groups related inputs and the legend becomes
         the group label read before each input name -->

    <div class="field">
      <label for="first-name">
        First name
        <abbr title="required" aria-hidden="true">*</abbr>
      </label>
      <input
        type="text"
        id="first-name"
        name="firstName"
        autocomplete="given-name"
        required
        aria-required="true"
        aria-describedby="first-name-hint"
      />
      <span id="first-name-hint" class="hint"> As it appears on your ID </span>
    </div>

    <div class="field">
      <label for="email">Email address</label>
      <input
        type="email"
        id="email"
        name="email"
        autocomplete="email"
        required
        aria-required="true"
        aria-invalid="false"
        aria-describedby="email-error"
      />
      <span id="email-error" role="alert" class="error" hidden>
        <!-- Role="alert" causes AT to announce this immediately when shown -->
        Please enter a valid email address.
      </span>
    </div>

    <div class="field">
      <label for="password">
        Password
        <abbr title="required" aria-hidden="true">*</abbr>
      </label>
      <input
        type="password"
        id="password"
        name="password"
        autocomplete="new-password"
        required
        aria-required="true"
        aria-describedby="password-requirements"
      />
      <ul id="password-requirements" class="hint">
        <li>At least 8 characters</li>
        <li>One uppercase letter</li>
        <li>One number</li>
      </ul>
    </div>
  </fieldset>

  <fieldset>
    <legend>Notification Preferences</legend>

    <!-- For checkboxes/radios: each needs a label, group needs a legend -->
    <div class="radio-group">
      <label>
        <input type="radio" name="notifications" value="all" checked />
        All notifications
      </label>
      <label>
        <input type="radio" name="notifications" value="important" />
        Important only
      </label>
      <label>
        <input type="radio" name="notifications" value="none" />
        None
      </label>
    </div>
  </fieldset>

  <!-- Error summary — show at top of form on submission failure -->
  <div role="alert" aria-live="polite" id="error-summary" tabindex="-1" hidden>
    <h2>There are 2 errors in this form</h2>
    <ul>
      <li><a href="#email">Email address is required</a></li>
      <li><a href="#password">Password must be at least 8 characters</a></li>
    </ul>
  </div>

  <button type="submit">Create account</button>
</form>
```

:::tip
When form validation fails, move focus to the error summary at the top. Users need to know errors occurred, even if they're navigating by keyboard far from the submit button. Use `errorSummary.focus()` after revealing it, and include links in the summary that jump directly to each errored field.
:::

## ARIA — When HTML Semantics Aren't Enough

ARIA (Accessible Rich Internet Applications) attributes allow you to supplement or override the semantic information communicated to assistive technologies. Use them to fill gaps where native HTML doesn't have a semantic equivalent.

```html
<!-- ── The first rule of ARIA: don't use ARIA if native HTML works ───── -->
<!--
  NEVER:                               INSTEAD:
  <div role="button">                  <button>
  <span role="heading" aria-level="2"> <h2>
  <div role="list">                    <ul> or <ol>
  <a role="link" href="...">           <a href="...">
  <input role="textbox">               <input type="text">
-->

<!-- ── ARIA roles: define what an element IS ────────────────────────── -->

<!-- Dialog / Modal -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Confirm deletion</h2>
  <p id="dialog-desc">
    Are you sure you want to delete this item? This action cannot be undone.
  </p>
  <button type="button">Cancel</button>
  <button type="button">Delete</button>
</div>

<!-- Status / Live region -->
<div role="status" aria-live="polite">
  <!-- Content here is announced by screen readers when it changes -->
  <!-- "polite" = waits for user to finish current task -->
  <!-- "assertive" = interrupts immediately — use only for critical errors -->
</div>

<!-- Alert — for urgent messages -->
<div role="alert">
  <!-- Announced immediately — use for errors, time-sensitive updates -->
</div>

<!-- ── ARIA states and properties ────────────────────────────────────── -->

<!-- aria-expanded: communicates open/closed state of controls -->
<button
  type="button"
  aria-expanded="false"
  aria-controls="dropdown-menu"
  id="dropdown-btn"
>
  Options
</button>
<ul id="dropdown-menu" hidden>
  <li><a href="/edit">Edit</a></li>
  <li><a href="/delete">Delete</a></li>
</ul>

<!-- When opened, JavaScript updates: -->
<!-- button.setAttribute('aria-expanded', 'true') -->
<!-- menu.removeAttribute('hidden') -->

<!-- aria-haspopup: indicates a popup will appear -->
<button type="button" aria-haspopup="menu" aria-controls="user-menu">
  Account ▾
</button>

<!-- aria-current: marks current item in navigation/pagination -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<!-- aria-label vs aria-labelledby ─────────────────────────────────────  -->

<!-- aria-label: provides a label string directly -->
<button type="button" aria-label="Close navigation menu">×</button>

<!-- aria-labelledby: references another element's text as the label -->
<h2 id="products-heading">Featured Products</h2>
<section aria-labelledby="products-heading">
  <!-- The section is now "labelled by" the h2 -->
</section>

<!-- aria-describedby: references supplementary description text -->
<input type="password" aria-describedby="pw-help" />
<span id="pw-help">Minimum 8 characters, one uppercase, one number</span>

<!-- ── aria-live regions: dynamic content announcements ──────────────── -->
<div aria-live="polite" aria-atomic="true" class="status-message">
  <!-- aria-atomic="true": announce the entire region, not just changed parts -->
  <!-- Changes here are announced to screen readers automatically -->
</div>

<!-- Practical: search results count -->
<p aria-live="polite" aria-atomic="true">
  Showing 24 of 156 results for "wireless headphones"
</p>
<!-- When this text updates, screen readers announce the new count -->
```

> ARIA is powerful but dangerous when misused. Incorrect ARIA is worse than no ARIA — it actively breaks the assistive technology experience. The five rules of ARIA use:
>
> 1. Don't use ARIA if a native HTML element works
> 2. Don't change native semantics unless you absolutely must
> 3. All interactive ARIA controls must be keyboard accessible
> 4. Never hide focusable elements with `aria-hidden="true"`
> 5. Interactive elements must have an accessible name

## Keyboard Accessibility — The Foundation of Operability

If a user can't operate your interface with only a keyboard, it fails WCAG 2.1 criterion 2.1.1 (Level A) — the minimum level of compliance. All functionality must be available without a mouse.

```html
<!-- ── Focus management essentials ──────────────────────────────────── -->

<!-- Tab order follows the DOM order by default.
     Only interactive elements receive focus by default:
     <a href>, <button>, <input>, <select>, <textarea>, <details> -->

<!-- tabindex values and what they mean: -->

<!-- tabindex="0": add element to the natural tab order -->
<!-- Use when a non-interactive element must receive focus for a reason -->
<div role="tabpanel" tabindex="0">
  Tab panel content that needs to be focusable
</div>

<!-- tabindex="-1": focusable via JavaScript, NOT in tab order -->
<!-- Use for elements that receive programmatic focus (modals, drawers) -->
<div id="modal" tabindex="-1">
  <!-- Focus sent here with: document.getElementById('modal').focus() -->
</div>

<!-- tabindex="1" and above: AVOID — creates a separate tab order that
     overrides the natural DOM order, causing confusing navigation -->

<!-- ── Skip navigation link ────────────────────────────────────────── -->
<!-- Every page must have a way to skip repetitive navigation.
     WCAG 2.4.1 (Level A) requires bypass blocks. -->
<body>
  <!-- Skip link is the FIRST focusable element on every page -->
  <a href="#main-content" class="skip-link"> Skip to main content </a>

  <header>
    <nav><!-- Long navigation --></nav>
  </header>

  <main id="main-content" tabindex="-1">
    <!-- tabindex="-1" on main allows it to receive programmatic focus
         from the skip link's href="#main-content" -->
    <h1>Page Title</h1>
  </main>
</body>

<!-- ── Focus trap for modals ─────────────────────────────────────────── -->
<!-- When a modal is open, focus must stay INSIDE it.
     Pressing Tab should cycle through the modal's focusable elements only.
     Focus must return to the trigger when the modal closes. -->

<!-- Implementing this correctly requires JavaScript.
     The pattern:
     1. When modal opens: save reference to the triggering element
     2. Set focus to the first focusable element inside the modal
     3. Trap Tab/Shift+Tab to stay inside the modal
     4. When modal closes: return focus to the saved trigger element
     5. Pressing Escape should close the modal
-->
```

```css
/* ── NEVER do this — it destroys keyboard accessibility ─────────────── */
:focus {
  outline: none; /* ❌ Removes focus indicator — keyboard users are blind */
}

*:focus {
  outline: 0; /* ❌ Same problem, different syntax */
}

/* ── DO THIS instead: style focus rings beautifully ─────────────────── */

/* Remove default outline ONLY when replacing it with something better */
:focus {
  outline: none; /* Remove browser default */
  /* Add your own focus style immediately below */
}

/* ✅ Custom focus style that looks intentional, not accidental */
:focus-visible {
  outline: 3px solid #0070f3;
  outline-offset: 2px;
  border-radius: 3px;
}

/* ── :focus-visible is better than :focus for styling ──────────────── */
/*
  :focus         → shows for ALL focus (including mouse clicks)
  :focus-visible → shows ONLY when focus came from keyboard/non-mouse input

  Using :focus-visible means:
  - Mouse users: no visible focus ring on click (they don't need it)
  - Keyboard users: always see where focus is (they need it)
*/

/* ── Context-sensitive focus styles ─────────────────────────────────── */
/* Different elements benefit from different focus treatments */

a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

button:focus-visible {
  outline: 2px solid #0070f3;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 112, 243, 0.2); /* extra glow */
}

input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid #0070f3;
  outline-offset: 0;
  border-color: #0070f3;
}

/* High contrast mode: ensure outlines work in Windows High Contrast */
@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid ButtonText; /* uses system color */
  }
}
```

:::warning
The `outline: none` antipattern is so widespread that WCAG specifically calls it out. Keyboard users — including many people who can see perfectly well but have motor impairments preventing mouse use — depend on visible focus indicators to know where they are on the page. Removing outlines without a visible replacement is a WCAG Level A failure that can result in legal liability.
:::
