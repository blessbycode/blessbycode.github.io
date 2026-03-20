---
title: 'HTML5 Interview Questions'
published: 2026-03-05
draft: false
tags: ['html5', 'interview questions']
toc: false
description: 'A list of most asked interview questions in HTML5.'
icons: ['html-5']
tech: html
---

## What is the `<!DOCTYPE html>` declaration?

It is not an HTML tag but an instruction to the web browser about the version of HTML the page is written in. In HTML5, the declaration is a simple `<!DOCTYPE html>`, which is much shorter than previous versions. It is written on top of the page.

> This declaration also ensures that we are using the latest version of HTML.

## Difference between tags and elements?

Tags are the simple text enclosed in angle brackets (e.g., `<h1>`, `</h1>`) used to denote the start and end of a content block. An element is the complete structure, consisting of the opening tag, the content, and the closing tag (e.g., `<h1>Heading 1</h1>`).

## How many types of elements are there in HTML?

There are two types of elements exists in HTML.

- Block level elements - A block-level element starts on a new line and takes up the full width available. Ex: - `div`, `p`, `h1...h6` etc.
- Inline elements - An inline element only takes up the space necessary for its content and does not start on a new line. Ex: - `span`, `input` etc.

## What are void or self-closing tags?

These are HTML tags that do not require a closing tag, such as `<img>`, `<br>`, `<hr>`, `<meta>`, and `<input>`.

## Explain the difference between `<strong>`, `<b>`, `<em>`, and `<i>` tags.

- `<b>` and `<i>` are for stylistic purposes only (bold and italic appearance, respectively).
- `<strong>` and `<em>` have semantic meaning, indicating strong importance and emphatic stress, respectively. This distinction helps accessibility tools like screen readers and search engines.

## How do you add a comment in HTML file?

To add a **comment** in HTML, wrap it between `<!--` and `-->`.

```html
<!-- This is an HTML comment -->
```

## How do you serve your HTML page in multiple languages?

For serving content in multiple languages and optimizing accessibility and search engine performance, you should use the `lang` attribute on the `<html>` tag.
For example: - `<html lang='en'> ... </html>`

> Most languages follow the two-letter code, such as "en" for English or "es" for Spanish. Some languages also use a code, which might require three to four letters, like "por" for Portuguese.
> For dialects or region-specific content, you can use a hyphen, followed by two letter country code. For instance:
>
> - "en-GB" for British English
> - "es-ES" for Spanish as spoken in Spain
> - "pt-BR" for Brazilian Portuguese
> - "pt-PT" for European Portuguese

## What is the difference between `head` and `body` tags?

While the `<head>` and `<body>` tags are fundamental to every HTML document, they serve distinct purposes and are located in separate areas of the web page.

- **`<head>`** - contains meta-information, such as document title, character encoding, and stylesheets, all of which are essential for page setup but not visible to the user.

  > Head typically links to CSS files or may have inline CSS, contains the document title, any JavaScript reference, character set declaration, and meta tags.

- **`<body>`** - contains the bulk of visible content, including text, images, videos, links, and more.
  > Body holds structural components like headers, navbars, articles, sections, and the footer, along with visual content like images and visible text.

```html
<!-- Example.html -->

<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>
  <body>
    <header>
      <h1>Welcome!</h1>
      <nav>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
    </header>

    <section>
      <h2>Recent Posts</h2>
      <article>
        <h3>Post Title</h3>
        <p>Post content goes here.</p>
      </article>
    </section>

    <footer>
      <p>&copy; 2023 MySite</p>
    </footer>
  </body>
</html>
```

## What are semantic HTML tags and why are they important?

**Semantic HTML tags** provide both structure and meaning to web content. They allow crawlers, browsers, and even assistive technologies to understand content better and present it more effectively. This approach improves accessibility and search engine optimization, making pages easier to maintain and understand.
For example: -

- `<p>`: A paragraph.
- `<h1> - <h6>`: Headings, with 1 (highest) to 6 (lowest) levels.
- `<ul> / <ol>`: Unordered or ordered list.
- `<li>`: List item inside a list.
- `<a>`: Anchor, used for links.
- `<img>`: An image.
- `<figure> / <figcaption>`: For a figure such as an image, with accompanying caption.
- `<header>`: To contain introductory and navigational information about a section of the page.
- `<article>`: To house a self-contained composition that can logically be independently recreated outside of the page without losing its meaning.
- `<section>`:  A flexible container for holding content that shares a common informational theme or purpose.
- `<main>`: To contain the main content of the app.
- `<footer>`: To hold information that should appear at the end of a section of content and contain additional information about the section.

```html
<!-- Before using Semantic Elements -->

<div class="nav">
  <div class="logo">
    <a href="#">Logo</a>
  </div>
  <div class="nav-links">
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </div>
</div>
<div class="main-wrapper">
  <div class="image">
    <img src="image.jpg" alt="A beautiful landscape" />
  </div>
  <div class="content">
    <h3>Welcome</h3>
    <p>Some welcome text here.</p>
  </div>
</div>
<div class="footer">
  <p>© 2022 Company Name</p>
</div>
```

---

```html
<!-- After using Semantic Elements -->

<header>
  <div class="logo">
    <a href="#">Logo</a>
  </div>
  <nav>
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </nav>
</header>

<main>
  <figure>
    <img src="image.jpg" alt="A beautiful landscape" />
    <figcaption>A beautiful landscape</figcaption>
  </figure>
  <section>
    <h1>Welcome</h1>
    <p>Some welcome text here.</p>
  </section>
</main>

<footer>
  <p>© 2022 Company Name</p>
</footer>
```

> Semantic tags help developers even before crawlers and browsers. They are easy to understand. If used in correct manner, even a beginner can understand the layout and structure of your app.

## What is the purpose of the `alt` attribute on images?

The `alt` attribute provides alternative information for an image if a user cannot view it. The `alt` attribute should be used to describe any images except those which only serve a decorative purpose, in which case it should be left empty.

> - Decorative images should have an empty `alt` attribute.
> - Web crawlers use `alt` tags to understand image content, so they are considered important for Search Engine Optimization (SEO).
> - Put the `.` at the end of `alt` tag to improve accessibility.

## Can a web page contain multiple `<header>` and `<footer>` elements?

Yes, of course. The `<header>` and `<footer>` tags are designed to serve their respective purposes in relation to whatever their parent “section” may be. So not only can the page `<body>` contain a header and a footer, but so can every `<article>` and `<section>` element.

> In fact, a `<header>` should be present for all of these, although a `<footer>` is not always necessary.

## Where and why is the `rel="noopener"` attribute used?

The `rel="noopener"` is an attribute used in `<a>` elements (hyperlinks). It prevents pages from having a `window.opener` property, which would otherwise point to the page from where the link was opened and would allow the page opened from the hyperlink to manipulate the page where the hyperlink is.

> `rel="noopener"` is applied to hyperlinks and prevents opened links from manipulating the source page.

## How do you embed audio and video in HTML5?

The `<audio>` and `<video>` tags allow media integration directly, removing the need for third-party plugins. Using the `<source>` tag enables providing multiple file formats for improved cross-browser compatibility.

## Explain the `<canvas>` and `<svg>` elements.

- `<canvas>`: Used for rendering dynamic, script-based bitmap graphics, ideal for games and visualizations.
- `<svg>`: An XML-based format for scalable, resolution-independent vector graphics.

## What are some of the HTML5 APIs?

HTML5 introduced various **JavaScript APIs** that allow developers to build rich, dynamic, and interactive web applications without the need for external plugins.

- **Geolocation API** : Allows users to share their physical location (latitude and longitude) with web applications, using JavaScript's `navigator.geolocation` object.
- **Web Storage API (localStorage and sessionStorage)** : Provides methods for storing data on the client side more persistently and with more capacity than cookies. `localStorage` retains data across browser sessions, while `sessionStorage` only lasts for the duration of the page session.
- **Canvas API** : Provides a JavaScript API for drawing 2D graphics and animations on a web page using the `<canvas>` element.
- **Drag and Drop API** : Allows elements to be dragged and dropped within a web page.
- **Web Workers API** : Enables scripts to run in background threads, separate from the main browser UI thread. This prevents performance-intensive operations from freezing the user interface.
- **WebSockets API** : Provides a persistent, bidirectional communication channel between a client and a server over a single socket, enabling real-time applications.
- **Audio and Video APIs** : The `<audio>` and `<video>` tags have an associated API (specifically the [HTMLMediaElement API](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Video_and_audio_APIs)) that allows programmatic control over media playback (e.g., play, pause, volume) using JavaScript.
- **Fetch API** : A modern interface for fetching resources across the network, often seen as a replacement for the older `XMLHttpRequest` for handling AJAX requests.

## What is HTML5 Web Storage? Explain `localStorage` and `sessionStorage`.

With HTML5, web pages can store data locally within the user’s browser. The data is stored in name/value pairs, and a web page can only access data stored by itself.

- **`localStorage`** : - Data stored through `localStorage` is permanent: it does not expire and remains stored on the user’s computer until a web app deletes it or the user asks the browser to delete it. - In `localStorage`, the same scripts from the same origin can't access each other's `sessionStorage` when opened in different tabs.
- **`sessionStorage`** :
  - `sessionStorage` has the same lifetime as the top-level window or browser tab in which the data got stored. When the tab is permanently closed, any data stored through `sessionStorage` is deleted.
  - `sessionStorage` is also scoped on a per-window basis. Two browser tabs with documents from the same origin have separate `sessionStorage` data.

> The storage limit is far larger (at least 5MB) than with cookies and its faster.
> The data is never transferred to the server and can only be used if the client specifically asks for it.

## What are `defer` and `async` attributes on a `<script>` tag?

The `defer` attribute downloads the script while the document is still parsing but waits until the document has finished parsing before executing it, equivalent to executing inside a `DOMContentLoaded` event listener. `defer` scripts will execute in order.
The `async` attribute downloads the script during parsing the document but will pause the parser to execute the script before it has fully finished parsing. `async` scripts will not necessarily execute in order.
If neither attribute is present, the script is downloaded and executed synchronously, and will halt parsing of the document until it has finished executing (default behavior). Scripts are downloaded and executed in the order they are encountered.
:::note
Both attributes must only be used if the script has a `src` attribute (i.e. not an inline script).
:::

```html
<script src="myscript.js"></script>
<script src="myscript.js" defer></script>
<script src="myscript.js" async></script>
```

> - Placing a `defer` script in the `<head>` allows the browser to download the script while the page is still parsing, and is therefore a better option than placing the script before the end of the body.
> - If the scripts rely on each other, use `defer`.
> - If the script is independent, use `async`.
> - Use `defer` if the DOM must be ready and the contents are not placed within a `DOMContentLoaded` listener.

## What is DOM?

The DOM (Document Object Model) is a cross-platform API that treats HTML and XML documents as a tree structure consisting of nodes. These nodes (such as elements and text nodes) are objects that can be programmatically manipulated and any visible changes made to them are reflected live in the document. In a browser, this API is available to JavaScript where DOM nodes can be manipulated to change their styles, contents, placement in the document, or interacted with through event listeners.
The DOM was designed to be independent of any particular programming language, making the structural representation of the document available from a single, consistent API.

> - The DOM is constructed progressively in the browser as a page loads, which is why scripts are often placed at the bottom of a page, in the `<head>` with a `defer` attribute, or inside a `DOMContentLoaded` event listener. Scripts that manipulate DOM nodes should be run after the DOM has been constructed to avoid errors.
> - `document.getElementById()` and `document.querySelector()` are common functions for selecting DOM nodes.
> - Setting the `innerHTML` property to a new value runs the string through the HTML parser, offering an easy way to append dynamic HTML content to a node.
