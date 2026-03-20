---
title: 'JSX in React 19 — The Complete Reference '
published: 2026-03-02
draft: false
description: 'Everything you need to know about JSX — how it compiles, every expression pattern, conditional rendering, lists, fragments, refs, context, error boundaries, and every React 19 addition.'
toc: true
tags: ['react', 'jsx']
icons: ['react']
tech: 'react'
---

## What JSX Is and What It Compiles To

JSX is a syntax extension for JavaScript that looks like HTML but compiles to JavaScript function calls. It is not HTML, not a template language, and not executed by the browser directly. Babel (or TypeScript, or SWC with Vite) transforms every JSX expression into calls to React's `jsx()` runtime function before the browser ever sees it.

Understanding the compilation output is the single most important mental model for JSX. Every limitation, every rule, every quirk follows directly from what the compiler produces.

```jsx
// What you write
const element = (
  <div className="listing-card" onClick={handleClick}>
    <h2>{listing.title}</h2>
    <p className="price">${(listing.price / 100).toFixed(2)}</p>
  </div>
);

// What Babel/SWC compiles it to (React 17+ JSX transform, no React import needed)
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';

const element = _jsxs('div', {
  className: 'listing-card',
  onClick: handleClick,
  children: [
    _jsx('h2', { children: listing.title }),
    _jsx('p', {
      className: 'price',
      children: `$${(listing.price / 100).toFixed(2)}`,
    }),
  ],
});
```

`_jsx` takes `(type, props)`. `_jsxs` is the same but for elements with multiple children — it's a performance hint that children is always an array. The `type` is either a string for DOM elements (`'div'`, `'span'`, `'button'`) or a function/class reference for components (`ListingCard`, `PriceTag`).

Every JSX rule follows from this:

- **One root element** — `_jsx` takes one `type`. Two sibling roots would be two separate calls with no parent call to contain them. Use `<>` Fragment to wrap.
- **`className` not `class`** — `class` is a reserved JavaScript keyword; `props.class` would break ES modules.
- **`htmlFor` not `for`** — same reason (`for` is reserved).
- **All attributes camelCase** — because they become JavaScript property names: `onClick`, `onChange`, `tabIndex`, `autoComplete`.
- **Expressions in `{}`** — only expressions (things that evaluate to a value), never statements (`if`, `for`, `while`).
- **Self-closing required for void elements** — `<img />`, `<br />`, `<input />` — not optional like HTML.

## The JSX Transform — Classic vs Automatic

```jsx
// Classic transform (React < 17) — requires `import React from 'react'` in every file
// because JSX compiles to React.createElement()
const el = React.createElement('div', { className: 'card' }, 'Hello');

// Automatic transform (React 17+, default today) — no import needed
// Babel/SWC auto-imports from 'react/jsx-runtime'
import { jsx as _jsx } from 'react/jsx-runtime';
const el = _jsx('div', { className: 'card', children: 'Hello' });
```

```json
// vite.config.ts — ensure automatic transform is used
{
  "plugins": ["@vitejs/plugin-react"],
  "esbuildOptions": { "jsxImportSource": "react" }
}

// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",         // use automatic transform
    "jsxImportSource": "react"  // import from react/jsx-runtime
  }
}
```

## Expressions Inside JSX

The `{}` syntax evaluates any JavaScript expression — anything that produces a value. Statements are not allowed.

```jsx
function ListingDetail({ listing, user, priceHistory }) {
  const isOwner = user?.id === listing.ownerId;
  const priceChange = priceHistory.at(-1) - priceHistory.at(-2);

  return (
    <article className="listing-detail">
      {/* String expressions */}
      <h1>{listing.title}</h1>
      <p>{listing.description.slice(0, 200) + '...'}</p>

      {/* Number expressions */}
      <span className="beds">
        {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}
      </span>

      {/* Template literals */}
      <p className="address">{`${listing.street}, ${listing.suburb} ${listing.postcode}`}</p>

      {/* Method calls */}
      <time dateTime={listing.listedAt}>
        {new Date(listing.listedAt).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </time>

      {/* Arithmetic */}
      <span className="price-psm">
        ${(listing.price / listing.floorAreaM2 / 100).toFixed(0)}/m²
      </span>

      {/* Ternary */}
      <span className={`price-change ${priceChange >= 0 ? 'up' : 'down'}`}>
        {priceChange >= 0 ? '▲' : '▼'} $
        {Math.abs(priceChange / 100).toLocaleString()}
      </span>

      {/* Logical AND — renders nothing when false/null/undefined/0... carefully */}
      {isOwner && <EditButton listingId={listing.id} />}

      {/* Nullish coalescing */}
      <p>{listing.description ?? 'No description provided.'}</p>

      {/* Optional chaining in props */}
      <img
        src={listing.photos?.[0]?.url ?? '/placeholder.jpg'}
        alt={listing.title}
      />

      {/* Object expression for inline style */}
      <div style={{ backgroundColor: listing.statusColor, padding: '4px 8px' }}>
        {listing.status}
      </div>

      {/* Immediately Invoked Function Expression (IIFE) — for complex logic inline */}
      {(() => {
        const days = Math.floor(
          (Date.now() - new Date(listing.listedAt)) / 86400000,
        );
        if (days === 0) return <span>Listed today</span>;
        if (days === 1) return <span>Listed yesterday</span>;
        return <span>Listed {days} days ago</span>;
      })()}

      {/* Array.from to generate a range */}
      <div className="star-rating">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < listing.rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    </article>
  );
}
```

### The `&&` Trap — `0` and `NaN` Render

This is one of the most common bugs in React codebases:

```jsx
// ❌ WRONG — renders "0" to the DOM when count is 0
{
  count && <Badge count={count} />;
}

// ❌ WRONG — renders "NaN" when value is NaN
{
  value && <Chart value={value} />;
}

// ✅ Always use boolean expressions
{
  count > 0 && <Badge count={count} />;
}
{
  count !== 0 && <Badge count={count} />;
}
{
  !!count && <Badge count={count} />;
}
{
  Boolean(count) && <Badge count={count} />;
}

// ✅ Or use ternary with null for the false branch
{
  count ? <Badge count={count} /> : null;
}
```

The reason: `false`, `null`, `undefined`, and `''` are valid JSX non-renderable values. But `0` and `NaN` are falsy JavaScript values that React renders as text nodes.

## Conditional Rendering — Every Pattern

```jsx
function ListingCard({ listing, user, isLoading, error }) {
  // ── Pattern 1: Guard clause before return ──────────────────────────
  // The cleanest pattern for loading/error states — removes all conditional
  // complexity from the return JSX
  if (isLoading) return <ListingCardSkeleton />;
  if (error)
    return (
      <ErrorMessage
        message={error.message}
        onRetry={() => window.location.reload()}
      />
    );
  if (!listing) return null;

  // ── Pattern 2: Ternary ─────────────────────────────────────────────
  // Best for: binary states, toggling between two components
  return (
    <article>
      {listing.isFeatured ? (
        <FeaturedBadge tier={listing.featuredTier} />
      ) : (
        <span className="standard-badge">Standard</span>
      )}

      {/* Nested ternary — use sparingly, extract when 3+ levels deep */}
      <span className="status">
        {listing.status === 'sold'
          ? 'Sold'
          : listing.status === 'under_offer'
            ? 'Under Offer'
            : 'For Sale'}
      </span>

      {/* ── Pattern 3: Logical AND — for optional content ─────────── */}
      {listing.virtualTourUrl && (
        <a href={listing.virtualTourUrl} className="virtual-tour-link">
          Virtual Tour ↗
        </a>
      )}

      {user?.role === 'agent' && listing.agentNotes && (
        <div className="agent-notes">
          <strong>Agent notes:</strong> {listing.agentNotes}
        </div>
      )}

      {/* ── Pattern 4: switch via object map ─────────────────────── */}
      {/* Better than switch/case for JSX — avoids IIFE awkwardness */}
      {{
        sale: <ForSaleTag price={listing.price} />,
        rent: <ForRentTag weekly={listing.weeklyRent} />,
        lease: <ForLeaseTag term={listing.leaseTerm} />,
        sold: <SoldTag soldAt={listing.soldAt} />,
        under_offer: <UnderOfferTag />,
      }[listing.listingType] ?? <span>{listing.listingType}</span>}

      {/* ── Pattern 5: Extract to a variable above return ─────────── */}
      {/* Keeps the JSX tree clean for complex conditions */}
      <PriceSection listing={listing} />
    </article>
  );
}

// Extract complex conditions into a component — single responsibility
function PriceSection({ listing }) {
  const displayPrice = (() => {
    if (listing.priceOnApplication) return 'Price on Application';
    if (listing.priceRange) {
      const [low, high] = listing.priceRange;
      return `$${(low / 100).toLocaleString()} – $${(high / 100).toLocaleString()}`;
    }
    return `$${(listing.price / 100).toLocaleString()}`;
  })();

  return (
    <div className="price-section">
      <span className="price">{displayPrice}</span>
      {!listing.priceOnApplication && listing.listingType === 'sale' && (
        <span className="price-guide">Price Guide</span>
      )}
    </div>
  );
}
```

## Lists and Keys — The Complete Picture

```jsx
function ListingGrid({ listings, savedIds, onSave }) {
  // ── Basic list with key ────────────────────────────────────────────
  // key must be: stable, unique among siblings, predictable
  return (
    <div className="listing-grid">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id} // ✅ database ID — stable and unique
          listing={listing}
          isSaved={savedIds.has(listing.id)}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

// ── Keys on Fragments when the component returns multiple elements ──
function ListingRow({ listing }) {
  return (
    <>
      {/* Each sibling in a list needs a key */}
      {listing.photos.map((photo, i) => (
        // Fragment with key — the short <> syntax can't carry a key
        <React.Fragment key={photo.id}>
          <img src={photo.url} alt={`${listing.title} — photo ${i + 1}`} />
          {photo.caption && <p className="caption">{photo.caption}</p>}
        </React.Fragment>
      ))}
    </>
  );
}

// ── Why index keys are dangerous ───────────────────────────────────
// With index keys, React reuses DOM nodes by position
// Deleting item at index 0 shifts all other items,
// causing them to re-render with wrong state (input values, focus, animations)

// ❌ Dangerous when list is reordered, filtered, or items deleted
{
  listings.map((listing, index) => (
    <ListingCard key={index} listing={listing} />
  ));
}

// ✅ Only safe when list is purely static and never reordered
{
  ['For Sale', 'For Rent', 'Sold'].map((label, i) => (
    <span key={i} className="tag">
      {label}
    </span>
  ));
}

// ── Filtering, sorting inside render ──────────────────────────────
function FilteredListings({ listings, filters }) {
  // Compute derived list inline — React's reconciler handles the diff
  const displayed = listings
    .filter((l) => {
      if (filters.type !== 'all' && l.listingType !== filters.type)
        return false;
      if (filters.minBeds && l.bedrooms < filters.minBeds) return false;
      if (filters.maxPrice && l.price > filters.maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'price_asc') return a.price - b.price;
      if (filters.sort === 'price_desc') return b.price - a.price;
      return new Date(b.listedAt) - new Date(a.listedAt);
    });

  return (
    <section>
      <p className="results-count">{displayed.length} properties</p>
      {displayed.length === 0 ? (
        <EmptyState filters={filters} />
      ) : (
        displayed.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))
      )}
    </section>
  );
}

// ── Nested lists with unique keys ─────────────────────────────────
function AgentPortfolio({ agents }) {
  return (
    <div>
      {agents.map((agent) => (
        <section key={agent.id} className="agent-section">
          <h3>{agent.name}</h3>
          <div className="agent-listings">
            {agent.listings.map((listing) => (
              // Key is unique within this agent's listings
              // Two different agents can both have a listing with key "L001"
              // — that's fine, keys are scoped to their parent list
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

## Props — Every Pattern

```jsx
// ── Spread props — forward all props to a child ────────────────────
// Common for wrapper components
function Button({ variant = 'primary', size = 'md', children, ...rest }) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      {...rest} // forwards onClick, disabled, type, aria-*, data-*, etc.
    >
      {children}
    </button>
  );
}

// ── Prop types and defaults with destructuring ─────────────────────
function PriceTag({
  priceCents,
  currency = 'AUD',
  showGuide = true,
  className = '',
  'data-testid': testId, // renaming reserved-ish attributes
}) {
  const formatted = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(priceCents / 100);

  return (
    <div className={`price-tag ${className}`} data-testid={testId}>
      <span className="price-tag__amount">{formatted}</span>
      {showGuide && <span className="price-tag__guide">Price Guide</span>}
    </div>
  );
}

// ── Children patterns ──────────────────────────────────────────────
function Card({ children, header, footer, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {header && <div className="card__header">{header}</div>}
      <div className="card__body">{children}</div>
      {footer && <div className="card__footer">{footer}</div>}
    </div>
  );
}

// Usage — JSX as props
<Card
  header={<h2>3 bed house in Paddington</h2>}
  footer={<ContactAgentButton agentId="a123" />}
>
  <p>Charming terrace with original features...</p>
  <PriceTag priceCents={189500000} />
</Card>;

// ── Render props pattern — function as children ────────────────────
function DataProvider({ query, children }) {
  const { data, loading, error } = useQuery(query);
  return children({ data, loading, error }); // function call inside JSX
}

// Usage
<DataProvider query={LISTINGS_QUERY}>
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    return <ListingGrid listings={data.listings} />;
  }}
</DataProvider>;

// ── Component as prop ─────────────────────────────────────────────
function Modal({ trigger: Trigger, content: Content }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Trigger onClick={() => setIsOpen(true)} />
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <Content onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

// Usage — pass component references, not JSX elements
<Modal
  trigger={({ onClick }) => <button onClick={onClick}>Book Inspection</button>}
  content={({ onClose }) => (
    <InspectionForm listingId="L001" onClose={onClose} />
  )}
/>;
```

## JSX and TypeScript

TypeScript adds type safety to both props and JSX element types.

```tsx
// Types for all component props
import type {
  ReactNode,
  ReactElement,
  ComponentPropsWithoutRef,
  CSSProperties,
} from 'react';

// ── Typed prop interfaces ──────────────────────────────────────────
interface Listing {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  floorAreaM2?: number;
  landAreaM2?: number;
  photos: Array<{ id: string; url: string; caption?: string }>;
  status: 'sale' | 'rent' | 'sold' | 'under_offer';
  listingType: 'house' | 'apartment' | 'townhouse' | 'land';
  listedAt: string; // ISO 8601
  description?: string;
}

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  variant?: 'compact' | 'full';
  className?: string;
}

// ── ReactNode vs ReactElement vs JSX.Element ───────────────────────
// ReactNode = anything that can be rendered: string, number, ReactElement,
//             null, undefined, boolean, array, Fragment
// ReactElement = a React element object (the result of calling jsx() or <Comp/>)
// JSX.Element = alias for ReactElement — prefer ReactNode for props

interface ContainerProps {
  children: ReactNode; // anything renderable — most permissive
  header?: ReactNode; // optional renderable content
  icon?: ReactElement; // must be a React element (not a string)
}

// ── Extending HTML element props ──────────────────────────────────
// ComponentPropsWithoutRef gives you all native HTML props without the ref
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  // Inherits: onClick, disabled, type, className, aria-*, data-*, etc.
}

function Button({
  variant = 'primary',
  loading,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={loading || disabled}
      className={`btn btn--${variant} ${loading ? 'btn--loading' : ''}`}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
}

// ── Discriminated union props ──────────────────────────────────────
type PriceDisplayProps =
  | { type: 'fixed'; priceCents: number }
  | { type: 'range'; lowCents: number; highCents: number }
  | { type: 'poa' }; // price on application — no price needed;

function PriceDisplay(props: PriceDisplayProps) {
  if (props.type === 'poa') return <span>Price on Application</span>;
  if (props.type === 'range') {
    return (
      <span>
        ${(props.lowCents / 100).toLocaleString()} – $
        {(props.highCents / 100).toLocaleString()}
      </span>
    );
  }
  return <span>${(props.priceCents / 100).toLocaleString()}</span>;
}

// ── Generic components ────────────────────────────────────────────
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
  placeholder?: string;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder,
}: SelectProps<T>) {
  return (
    <select
      value={value ? getValue(value) : ''}
      onChange={(e) => {
        const selected = options.find((o) => getValue(o) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Usage — TypeScript infers T as Suburb
<Select
  options={suburbs}
  value={selectedSuburb}
  onChange={setSelectedSuburb}
  getLabel={(s) => s.name}
  getValue={(s) => s.id}
  placeholder="Select suburb..."
/>;
```

## Fragments — Avoiding Unnecessary DOM Nodes

```jsx
// ── Short syntax — no props allowed ───────────────────────────────
function PropertySpecs({ listing }) {
  return (
    <>
      <dt>Bedrooms</dt>
      <dd>{listing.bedrooms}</dd>
      <dt>Bathrooms</dt>
      <dd>{listing.bathrooms}</dd>
      <dt>Car spaces</dt>
      <dd>{listing.carSpaces}</dd>
      {listing.floorAreaM2 && (
        <>
          <dt>Floor area</dt>
          <dd>{listing.floorAreaM2} m²</dd>
        </>
      )}
    </>
  );
}

// ── Long syntax — required when you need a key ─────────────────────
function FeatureList({ features }) {
  return (
    <dl>
      {features.map((feature) => (
        // key is a prop on Fragment, but not passed to children
        <React.Fragment key={feature.id}>
          <dt>{feature.category}</dt>
          <dd>{feature.description}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

// ── Real-world use: table rows ─────────────────────────────────────
// <tr> must be a direct child of <tbody>/<thead>/<tfoot>
// A wrapping <div> around multiple <tr> elements would break the table DOM
function AgentTableRow({ agent }) {
  return (
    <>
      <tr className="agent-row" key={agent.id}>
        <td>{agent.name}</td>
        <td>{agent.agency}</td>
        <td>{agent.activeListings}</td>
      </tr>
      {agent.isExpanded &&
        agent.recentListings.map((listing) => (
          <tr key={listing.id} className="listing-sub-row">
            <td colSpan={2}>{listing.title}</td>
            <td>${(listing.price / 100).toLocaleString()}</td>
          </tr>
        ))}
    </>
  );
}
```

## Events and Event Handling

```jsx
// ── Synthetic event types ──────────────────────────────────────────
function SearchBar({ onSearch, onClear }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // React.ChangeEvent<HTMLInputElement> — for onChange on input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // React.FormEvent<HTMLFormElement> — for onSubmit on form
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();   // prevent page reload
    if (query.trim()) onSearch(query.trim());
  };

  // React.KeyboardEvent<HTMLInputElement> — for keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      onClear();
      inputRef.current?.blur();
    }
    if (e.key === 'ArrowDown') {
      // Focus first suggestion
      e.preventDefault();
      document.querySelector<HTMLLIElement>('.suggestion-item')?.focus();
    }
  };

  // React.MouseEvent<HTMLButtonElement> — for click events
  const handleClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();   // prevent bubbling to parent
    setQuery('');
    onClear();
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar" role="search">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Suburb, postcode, or address..."
        aria-label="Search properties"
        autoComplete="off"
        autoCapitalize="none"
      />
      {query && (
        <button
          type="button"
          onClick={handleClearClick}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      <button type="submit" aria-label="Submit search">
        Search
      </button>
    </form>
  );
}

// ── Event delegation — handler at parent, target checked ──────────
// More efficient than attaching handlers to every child
function PhotoGallery({ photos, onPhotoAction }) {
  const handleGalleryClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as Element).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;

    const action = btn.dataset.action;
    const photoId = btn.dataset.photoId;

    if (action && photoId) {
      onPhotoAction(action, photoId);
    }
  };

  return (
    <div className="photo-gallery" onClick={handleGalleryClick}>
      {photos.map(photo => (
        <div key={photo.id} className="photo-item">
          <img src={photo.url} alt={photo.caption} />
          <div className="photo-controls">
            <button data-action="set-primary" data-photo-id={photo.id}>
              Set as primary
            </button>
            <button data-action="delete" data-photo-id={photo.id}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Refs — `useRef`, `forwardRef`, and React 19's `ref` Prop

### `useRef` for DOM Access

```jsx
function PhotoUploader({ onUpload }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef   = useRef<HTMLDivElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = (files: FileList) => {
    const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);

    // Scroll the preview area to show new images
    requestAnimationFrame(() => {
      previewRef.current?.scrollTo({ left: previewRef.current.scrollWidth, behavior: 'smooth' });
    });

    onUpload(files);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="photo-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => e.target.files && handleFiles(e.target.files)}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <button type="button" onClick={openFilePicker}>
        Add photos
      </button>

      <div ref={previewRef} className="photo-previews">
        {previews.map((url, i) => (
          <img key={url} src={url} alt={`Preview ${i + 1}`} className="preview-thumb" />
        ))}
      </div>
    </div>
  );
}
```

### `forwardRef` — Before React 19

```jsx
// forwardRef was the mechanism for forwarding refs to child DOM elements
const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  function PriceInput({ currency = 'AUD', onPriceChange, ...rest }, ref) {
    return (
      <div className="price-input-wrapper">
        <span className="currency-symbol">{currency === 'AUD' ? '$' : '€'}</span>
        <input
          ref={ref}         // forwarded ref attaches to the actual DOM element
          type="number"
          min={0}
          step={1000}
          onChange={e => onPriceChange(Number(e.target.value) * 100)}
          {...rest}
        />
      </div>
    );
  }
);

// Usage — parent can call ref.current.focus() on the input inside PriceInput
const priceRef = useRef<HTMLInputElement>(null);
<PriceInput ref={priceRef} currency="AUD" onPriceChange={setPrice} />
```

### React 19 — `ref` Is Now a Regular Prop

In React 19, `forwardRef` is no longer needed. Function components receive `ref` directly as a prop. `forwardRef` still works but is deprecated.

```jsx
// React 19 — ref is just a prop, no forwardRef wrapper needed
function PriceInput({ currency = 'AUD', onPriceChange, ref, ...rest }) {
  return (
    <div className="price-input-wrapper">
      <span className="currency-symbol">$</span>
      <input
        ref={ref}     // ref passed straight through
        type="number"
        min={0}
        step={1000}
        onChange={e => onPriceChange(Number(e.target.value) * 100)}
        {...rest}
      />
    </div>
  );
}

// Usage is identical — the simplification is in the component definition
const priceRef = useRef<HTMLInputElement>(null);
<PriceInput ref={priceRef} onPriceChange={setPrice} />

// TypeScript — ref type in component props
import type { Ref } from 'react';
interface PriceInputProps {
  currency?:      string;
  onPriceChange:  (cents: number) => void;
  ref?:           Ref<HTMLInputElement>;   // React 19: ref in the interface
}
```

## React 19 — New JSX Features

### `use()` — Reading Promises and Context in Render

React 19 introduces `use(promise)` — you can await a Promise inside a component body during render, and React Suspense handles the loading state. Unlike `async/await`, `use()` can be called conditionally.

```jsx
import { use, Suspense, createContext } from 'react';

// ── use() with a Promise ───────────────────────────────────────────
// The component suspends until the promise resolves
// The nearest <Suspense> boundary shows its fallback in the meantime
function ListingDetailContent({ listingPromise }) {
  // Suspends here until listingPromise resolves
  const listing = use(listingPromise);

  return (
    <article className="listing-detail">
      <h1>{listing.title}</h1>
      <PriceTag priceCents={listing.price} />
      <PropertySpecs listing={listing} />
    </article>
  );
}

// Parent — pass a promise (typically created by a data library or fetch)
function ListingPage({ id }) {
  // Create the promise once — don't create it inside a component that re-renders
  const listingPromise = fetchListing(id); // returns Promise<Listing>

  return (
    <Suspense fallback={<ListingDetailSkeleton />}>
      <ListingDetailContent listingPromise={listingPromise} />
    </Suspense>
  );
}

// ── use() called conditionally (unlike hooks — this is legal) ─────
function ListingNotes({ listing, isAgent, notesPromise }) {
  if (!isAgent) return null; // early return before use() — this is allowed

  // use() after a conditional — this is NEW in React 19
  // You cannot call useEffect/useState after a conditional, but use() is different
  const notes = use(notesPromise);

  return (
    <aside className="agent-notes">
      <h3>Agent Notes</h3>
      <p>{notes.text}</p>
    </aside>
  );
}

// ── use() with Context ────────────────────────────────────────────
// use(Context) is the React 19 equivalent of useContext — but callable conditionally
const ThemeContext = (createContext < 'light') | ('dark' > 'light');

function ThemedCard({ listing, showPremiumStyle }) {
  if (!showPremiumStyle) return <StandardCard listing={listing} />;

  // use() after a conditional — still valid
  const theme = use(ThemeContext);

  return (
    <div className={`premium-card premium-card--${theme}`}>
      <ListingCard listing={listing} />
    </div>
  );
}
```

### Server Components in JSX

React 19's RSC (React Server Components) allow components to be async functions that run only on the server.

```jsx
// app/listings/[id]/page.tsx (Next.js App Router — Server Component by default)
// This component runs on the server — no bundle sent to the browser

async function ListingPage({ params }: { params: { id: string } }) {
  // Direct database access — no API route needed
  // This await runs on the server, not the client
  const listing = await db.listing.findUnique({
    where:   { id: params.id },
    include: { agent: true, photos: true },
  });

  if (!listing) notFound();

  return (
    <main className="listing-page">
      {/* Server Component — rendered to HTML, zero JS */}
      <ListingHeader listing={listing} />

      {/* Streaming: shows skeleton, then resolves independently */}
      <Suspense fallback={<SimilarListingsSkeleton />}>
        <SimilarListings  suburb={listing.suburb} currentId={listing.id} />
      </Suspense>

      {/* Client Component — 'use client' at the top of the file */}
      <SaveButton listingId={listing.id} />

      {/* Server Component — pass serializable data only */}
      <AgentCard agent={listing.agent} />
    </main>
  );
}

// Client component — must be in a separate file with 'use client'
'use client';
function SaveButton({ listingId }: { listingId: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => setSaved(s => !s)}
      className={`save-btn ${saved ? 'saved' : ''}`}
      aria-pressed={saved}
    >
      {saved ? '♥ Saved' : '♡ Save'}
    </button>
  );
}
```

### Server Actions in JSX

```jsx
'use client';
import { useActionState, useOptimistic } from 'react';
import { saveListingAction, submitEnquiry } from './actions';

// ── useActionState (React 19) — form with server action ───────────
function EnquiryForm({ listingId, agentId }) {
  const [state, formAction, isPending] = useActionState(submitEnquiry, {
    success: false,
    error: null,
  });

  return (
    <form action={formAction} className="enquiry-form">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="agentId" value={agentId} />

      <label>
        Your name
        <input name="name" type="text" required disabled={isPending} />
      </label>

      <label>
        Email
        <input name="email" type="email" required disabled={isPending} />
      </label>

      <label>
        Phone
        <input name="phone" type="tel" disabled={isPending} />
      </label>

      <label>
        Message
        <textarea
          name="message"
          rows={4}
          required
          disabled={isPending}
          defaultValue="I'd like to arrange an inspection."
        />
      </label>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="form-success" role="status">
          Enquiry sent! The agent will contact you shortly.
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn btn--primary">
        {isPending ? 'Sending...' : 'Send enquiry'}
      </button>
    </form>
  );
}

// ── useOptimistic — immediate UI feedback before server confirms ───
function SaveListingButton({ listingId, initialSaved }) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(initialSaved);

  const handleSave = async () => {
    // Update UI immediately — before server responds
    setOptimisticSaved(!optimisticSaved);
    // Server action runs — UI shows optimistic state during await
    await saveListingAction(listingId);
    // If action succeeds, optimistic state becomes real
    // If action fails, React reverts to the previous state
  };

  return (
    <button
      onClick={handleSave}
      className={`save-btn ${optimisticSaved ? 'saved' : ''}`}
      aria-label={optimisticSaved ? 'Unsave listing' : 'Save listing'}
    >
      {optimisticSaved ? '♥' : '♡'}
    </button>
  );
}
```

### Metadata in JSX (React 19)

React 19 allows `<title>`, `<meta>`, `<link>`, and `<style>` tags inside component JSX — React hoists them to `<head>` automatically.

```jsx
// No more next/head or react-helmet — React 19 handles this natively
function ListingDetailPage({ listing }) {
  return (
    <>
      {/* React hoists these to <head> automatically */}
      <title>{listing.title} — PropVault</title>
      <meta name="description" content={listing.description?.slice(0, 160)} />
      <meta property="og:title" content={listing.title} />
      <meta property="og:image" content={listing.photos[0]?.url} />
      <meta property="og:type" content="website" />
      <link
        rel="canonical"
        href={`https://propvault.com/listings/${listing.slug}`}
      />

      {/* Scoped stylesheet — React deduplicates, hoists to <head> */}
      <style href="listing-page-styles" precedence="component">{`
        .listing-hero { aspect-ratio: 16 / 9; }
        .listing-price { font-size: clamp(1.5rem, 4vw, 2.5rem); }
      `}</style>

      <main className="listing-detail">
        <ListingHero photos={listing.photos} />
        <ListingInfo listing={listing} />
      </main>
    </>
  );
}
```

## Error Boundaries — Catching JSX Runtime Errors

```jsx
import { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError:     boolean;
  error:        Error | null;
  errorInfo:    React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children:   ReactNode;
  fallback?:  (error: Error, reset: () => void) => ReactNode;
  onError?:   (error: Error, info: React.ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    // Report to monitoring service
    console.error('Boundary caught:', error, errorInfo);
  }

  reset = () => this.setState({ hasError: false, error: null, errorInfo: null });

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button onClick={this.reset} className="btn btn--secondary">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Using react-error-boundary (library) — with hooks ─────────────
import { ErrorBoundary as REB } from 'react-error-boundary';

function ListingGridPage() {
  return (
    <REB
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-state">
          <p>Failed to load listings: {error.message}</p>
          <button onClick={resetErrorBoundary}>Reload</button>
        </div>
      )}
      onError={(error, info) => reportToSentry(error, info)}
    >
      <Suspense fallback={<ListingGridSkeleton />}>
        <ListingGrid />
      </Suspense>
    </REB>
  );
}
```

## Context and `createContext`

```jsx
import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

// ── Define context type and create context ─────────────────────────
interface SearchFilters {
  suburb:     string;
  minBeds:    number;
  maxPrice:   number | null;
  type:       'all' | 'house' | 'apartment' | 'townhouse';
  sort:       'newest' | 'price_asc' | 'price_desc';
}

interface SearchContextValue {
  filters:    SearchFilters;
  setFilter:  <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  resetFilters: () => void;
  isFiltered: boolean;
}

const DEFAULT_FILTERS: SearchFilters = {
  suburb:   '',
  minBeds:  0,
  maxPrice: null,
  type:     'all',
  sort:     'newest',
};

const SearchContext = createContext<SearchContextValue | null>(null);

// ── Provider component ─────────────────────────────────────────────
function SearchProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // Memoize value object — prevents unnecessary re-renders of consumers
  // when the Provider itself re-renders for unrelated reasons
  const value = useMemo<SearchContextValue>(() => ({
    filters,
    setFilter: (key, val) => setFilters(prev => ({ ...prev, [key]: val })),
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    isFiltered: JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS),
  }), [filters]);

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

// ── Custom hook — always use this, never useContext directly ───────
function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}

// ── Consumer components ────────────────────────────────────────────
function SuburbFilter() {
  const { filters, setFilter } = useSearch();

  return (
    <input
      type="text"
      value={filters.suburb}
      onChange={e => setFilter('suburb', e.target.value)}
      placeholder="Suburb or postcode"
      className="suburb-filter"
    />
  );
}

function BedroomFilter() {
  const { filters, setFilter } = useSearch();
  const options = [0, 1, 2, 3, 4, 5] as const;

  return (
    <div className="bedroom-filter" role="group" aria-label="Minimum bedrooms">
      {options.map(n => (
        <button
          key={n}
          type="button"
          className={`bed-btn ${filters.minBeds === n ? 'active' : ''}`}
          onClick={() => setFilter('minBeds', n)}
          aria-pressed={filters.minBeds === n}
        >
          {n === 0 ? 'Any' : `${n}+`}
        </button>
      ))}
    </div>
  );
}

function ActiveFilterBadges() {
  const { filters, setFilter, resetFilters, isFiltered } = useSearch();

  if (!isFiltered) return null;

  return (
    <div className="active-filters">
      {filters.suburb && (
        <span className="filter-badge">
          {filters.suburb}
          <button onClick={() => setFilter('suburb', '')} aria-label="Remove suburb filter">×</button>
        </span>
      )}
      {filters.minBeds > 0 && (
        <span className="filter-badge">
          {filters.minBeds}+ beds
          <button onClick={() => setFilter('minBeds', 0)} aria-label="Remove bedroom filter">×</button>
        </span>
      )}
      <button className="clear-all" onClick={resetFilters}>
        Clear all
      </button>
    </div>
  );
}

// ── Composing the page ─────────────────────────────────────────────
function SearchPage() {
  return (
    <SearchProvider>
      <div className="search-page">
        <aside className="search-filters">
          <SuburbFilter />
          <BedroomFilter />
          <ActiveFilterBadges />
        </aside>
        <main>
          {/* ListingResults also consumes SearchContext via useSearch() */}
          <ListingResults />
        </main>
      </div>
    </SearchProvider>
  );
}
```

## JSX and Accessibility

Semantic HTML is the foundation. JSX makes it easy to write wrong markup — and equally easy to write right markup.

```jsx
function ListingSearch({ onSearch }) {
  return (
    // ── Landmark roles via semantic HTML ──────────────────────────
    <main>
      <header>
        <h1>Find your next property</h1>
      </header>

      {/* form not div — announces as form landmark, enables Enter key submit */}
      <form onSubmit={onSearch} role="search" aria-label="Property search">
        <label htmlFor="location-input">Location</label>
        <input
          id="location-input"
          type="search"
          autoComplete="address-level2"
          aria-describedby="location-hint"
        />
        <span id="location-hint" className="hint">
          Try "Surry Hills" or "2010"
        </span>

        {/* Icon-only button must have accessible name */}
        <button type="submit" aria-label="Search properties">
          <SearchIcon aria-hidden="true" />
        </button>
      </form>

      {/* nav not div — announces as navigation landmark */}
      <nav aria-label="Property type filter">
        <ul role="list">
          {['All', 'House', 'Apartment', 'Townhouse'].map((type) => (
            <li key={type}>
              <a
                href={`/search?type=${type.toLowerCase()}`}
                aria-current={type === 'All' ? 'page' : undefined}
              >
                {type}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}

function ListingCard({ listing, onSave, isSaved }) {
  return (
    // article — self-contained unit of content
    <article
      className="listing-card"
      aria-label={`${listing.title}, $${(listing.price / 100).toLocaleString()}`}
    >
      {/* Image alt text */}
      <img
        src={listing.photos[0]?.url}
        alt={listing.photos[0]?.caption ?? `${listing.title} — exterior view`}
        loading="lazy"
        decoding="async"
      />

      <div className="listing-card__body">
        {/* Heading hierarchy — don't skip levels */}
        <h2 className="listing-card__title">
          {/* Link around the heading — the whole title is the link target */}
          <a href={`/listings/${listing.slug}`}>{listing.title}</a>
        </h2>

        <p>{listing.address}</p>

        {/* dl/dt/dd for key-value data */}
        <dl className="property-specs">
          <dt>Bedrooms</dt> <dd>{listing.bedrooms}</dd>
          <dt>Bathrooms</dt> <dd>{listing.bathrooms}</dd>
          <dt>Parking</dt> <dd>{listing.carSpaces}</dd>
        </dl>

        {/* Toggle button with aria-pressed */}
        <button
          type="button"
          onClick={() => onSave(listing.id)}
          aria-pressed={isSaved}
          aria-label={
            isSaved ? `Unsave ${listing.title}` : `Save ${listing.title}`
          }
          className={`save-btn ${isSaved ? 'save-btn--saved' : ''}`}
        >
          <span aria-hidden="true">{isSaved ? '♥' : '♡'}</span>
          <span className="sr-only">{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </article>
  );
}

// ── Live regions for dynamic content ──────────────────────────────
function SearchResults({ results, isLoading }) {
  return (
    <>
      {/* aria-live="polite" announces count changes to screen readers */}
      <p aria-live="polite" aria-atomic="true" className="results-count">
        {isLoading ? 'Loading...' : `${results.length} properties found`}
      </p>

      {/* role="status" = implicit aria-live="polite" */}
      {isLoading && <p role="status">Searching properties...</p>}

      <div className="results-grid">
        {results.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </>
  );
}
```

## JSX Anti-Patterns and How to Fix Them

```jsx
// ─────────────────────────────────────────────────────────────────
// ❌ Anti-pattern: inline object creation in JSX props
// Creates a new object on every render — breaks memo, useEffect deps
<ListingGrid style={{ display: 'grid' }} filters={{ type: 'house' }} />

// ✅ Extract to constant outside the component
const GRID_STYLE = { display: 'grid', gap: '1rem' };
// Or use CSS classes instead
<ListingGrid className="listing-grid" />

// ─────────────────────────────────────────────────────────────────
// ❌ Anti-pattern: inline arrow function creating new ref on every render
<ListingCard onClick={() => handleSave(listing.id)} />
// Every render creates a new function — breaks React.memo on ListingCard

// ✅ Use useCallback when the child is memoized
const handleSaveClick = useCallback(() => handleSave(listing.id), [listing.id, handleSave]);
<ListingCard onClick={handleSaveClick} />

// ─────────────────────────────────────────────────────────────────
// ❌ Anti-pattern: deeply nested JSX logic
function ListingPage({ listing }) {
  return (
    <div>
      {listing && listing.status !== 'deleted' ? (
        listing.photos && listing.photos.length > 0 ? (
          <div>
            {listing.photos.map(p => p.url ? (
              <img key={p.id} src={p.url} />
            ) : null)}
          </div>
        ) : <NoPhotosPlaceholder />
      ) : <NotFound />}
    </div>
  );
}

// ✅ Extract to named components + guard clauses
function ListingPhotos({ photos }) {
  if (!photos?.length) return <NoPhotosPlaceholder />;
  return (
    <div>
      {photos.filter(p => p.url).map(p => (
        <img key={p.id} src={p.url} alt={p.caption} />
      ))}
    </div>
  );
}
function ListingPage({ listing }) {
  if (!listing || listing.status === 'deleted') return <NotFound />;
  return <ListingPhotos photos={listing.photos} />;
}

// ─────────────────────────────────────────────────────────────────
// ❌ Anti-pattern: mutating props
function BadCard({ listing }) {
  listing.price = listing.price * 1.1;  // ❌ never mutate props
  return <div>{listing.price}</div>;
}

// ✅ Derive new values, never mutate
function GoodCard({ listing }) {
  const displayPrice = listing.price * 1.1;
  return <div>{displayPrice}</div>;
}

// ─────────────────────────────────────────────────────────────────
// ❌ Anti-pattern: storing JSX in state
const [content, setContent] = useState(<ListingCard listing={x} />);
// JSX is not serializable, loses reactivity, can't be updated

// ✅ Store data in state, render JSX from it
const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
return selectedListing ? <ListingCard listing={selectedListing} /> : null;

// ─────────────────────────────────────────────────────────────────
// ❌ Anti-pattern: dangerouslySetInnerHTML with unsanitised user content
<div dangerouslySetInnerHTML={{ __html: userDescription }} />  // XSS vulnerability

// ✅ Sanitise first with DOMPurify or use a markdown renderer
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userDescription);
<div dangerouslySetInnerHTML={{ __html: clean }} />

// Or even better — render as plain text, or use a markdown library
<p>{userDescription}</p>
```

## Complete Component — PropVault Property Listing Page

```tsx
// pages/listings/[slug].tsx — a complete, real-world listing page

'use client'; // for the interactive parts

import {
  use,
  Suspense,
  useRef,
  useState,
  useCallback,
  useOptimistic,
  type Ref,
} from 'react';
import type { Listing, Agent, Photo } from '@/types';

// ── Sub-components ─────────────────────────────────────────────────

function PhotoCarousel({
  photos,
  ref,
}: {
  photos: Photo[];
  ref?: Ref<HTMLDivElement>;
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((index: number) => {
    setActive(index);
    trackRef.current?.children[index]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, []);

  return (
    <div
      className="carousel"
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Listing photos"
    >
      <div className="carousel__track" ref={trackRef}>
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className={`carousel__slide ${i === active ? 'active' : ''}`}
            aria-label={`Photo ${i + 1} of ${photos.length}`}
            aria-hidden={i !== active}
            role="group"
            aria-roledescription="slide"
          >
            <img
              src={photo.url}
              alt={photo.caption ?? `Property photo ${i + 1}`}
            />
          </div>
        ))}
      </div>

      <div className="carousel__dots" role="tablist" aria-label="Select photo">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            role="tab"
            aria-selected={i === active}
            aria-label={`Photo ${i + 1}`}
            className={`dot ${i === active ? 'dot--active' : ''}`}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>

      <button
        className="carousel__prev"
        onClick={() => scrollTo(Math.max(0, active - 1))}
        disabled={active === 0}
        aria-label="Previous photo"
      >
        ‹
      </button>
      <button
        className="carousel__next"
        onClick={() => scrollTo(Math.min(photos.length - 1, active + 1))}
        disabled={active === photos.length - 1}
        aria-label="Next photo"
      >
        ›
      </button>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────
function ListingDetailClient({
  listingPromise,
}: {
  listingPromise: Promise<Listing & { agent: Agent }>;
}) {
  // React 19: use() to read the promise — suspends until resolved
  const listing = use(listingPromise);

  const [optimisticSaved, setOptimisticSaved] = useOptimistic(listing.isSaved);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    setOptimisticSaved(!optimisticSaved);
    try {
      await fetch(`/api/listings/${listing.id}/save`, { method: 'POST' });
    } catch {
      // Error: revert happens automatically via React's optimistic hook
    }
  };

  const specsMap: Record<string, string | number> = {
    Bedrooms: listing.bedrooms,
    Bathrooms: listing.bathrooms,
    'Car spaces': listing.carSpaces,
    ...(listing.floorAreaM2 && { 'Floor area': `${listing.floorAreaM2} m²` }),
    ...(listing.landAreaM2 && { 'Land area': `${listing.landAreaM2} m²` }),
    'Property type': listing.propertyType,
  };

  return (
    <>
      {/* React 19: metadata hoisted to <head> */}
      <title>{listing.title} — PropVault</title>
      <meta name="description" content={listing.description?.slice(0, 160)} />
      <meta property="og:image" content={listing.photos[0]?.url} />
      <link
        rel="canonical"
        href={`https://propvault.com.au/listings/${listing.slug}`}
      />

      <main className="listing-page">
        <PhotoCarousel ref={carouselRef} photos={listing.photos} />

        <div className="listing-page__content">
          <header className="listing-header">
            {listing.isFeatured && (
              <span className="badge badge--featured">Featured</span>
            )}
            {
              {
                sale: <span className="badge badge--sale">For Sale</span>,
                rent: <span className="badge badge--rent">For Rent</span>,
                sold: <span className="badge badge--sold">Sold</span>,
                under_offer: (
                  <span className="badge badge--offer">Under Offer</span>
                ),
              }[listing.status]
            }

            <h1 className="listing-title">{listing.title}</h1>
            <p className="listing-address">{listing.fullAddress}</p>

            <div className="listing-price-row">
              {listing.priceOnApplication ? (
                <span className="price">Price on Application</span>
              ) : (
                <span className="price">
                  ${(listing.price / 100).toLocaleString()}
                </span>
              )}
              {listing.weeklyRent && listing.status === 'rent' && (
                <span className="weekly-rent">
                  ${(listing.weeklyRent / 100).toLocaleString()} pw
                </span>
              )}
              <button
                onClick={handleSave}
                aria-pressed={optimisticSaved}
                aria-label={
                  optimisticSaved ? 'Unsave this listing' : 'Save this listing'
                }
                className={`save-btn ${optimisticSaved ? 'save-btn--saved' : ''}`}
              >
                <span aria-hidden="true">{optimisticSaved ? '♥' : '♡'}</span>
              </button>
            </div>
          </header>

          <section aria-label="Property specifications">
            <h2 className="sr-only">Property details</h2>
            <dl className="specs-grid">
              {Object.entries(specsMap).map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </React.Fragment>
              ))}
            </dl>
          </section>

          {listing.description && (
            <section aria-label="Description">
              <h2>About this property</h2>
              <p className="listing-description">{listing.description}</p>
            </section>
          )}

          {listing.features.length > 0 && (
            <section aria-label="Property features">
              <h2>Features</h2>
              <ul className="features-list" role="list">
                {listing.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="agent-section" aria-label="Listing agent">
            <h2>Listed by</h2>
            <article className="agent-card" aria-label={listing.agent.name}>
              {listing.agent.avatar ? (
                <img
                  src={listing.agent.avatar}
                  alt=""
                  aria-hidden="true"
                  className="agent-avatar"
                />
              ) : (
                <div
                  className="agent-avatar agent-avatar--initials"
                  aria-hidden="true"
                >
                  {listing.agent.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
              )}
              <div className="agent-info">
                <strong className="agent-name">{listing.agent.name}</strong>
                <span className="agent-agency">{listing.agent.agencyName}</span>
                <a href={`tel:${listing.agent.phone}`} className="agent-phone">
                  {listing.agent.phone}
                </a>
              </div>
            </article>

            <Suspense fallback={<EnquiryFormSkeleton />}>
              <EnquiryForm listingId={listing.id} agentId={listing.agent.id} />
            </Suspense>
          </section>
        </div>
      </main>
    </>
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const listingPromise = fetchListing(params.slug);

  return (
    <SearchProvider>
      <Suspense fallback={<ListingDetailSkeleton />}>
        <ListingDetailClient listingPromise={listingPromise} />
      </Suspense>
    </SearchProvider>
  );
}
```

## Common JSX Anti-Patterns Reference

| Anti-Pattern                                  | Problem                                  | Fix                                     |
| --------------------------------------------- | ---------------------------------------- | --------------------------------------- |
| `{count && <Badge />}`                        | Renders `0` when count is zero           | `{count > 0 && <Badge />}`              |
| Inline object in props `style={{ }}`          | New reference every render               | Extract to constant or use className    |
| Key as array index for reorderable lists      | Wrong component reuse on reorder/delete  | Use stable ID from data                 |
| JSX stored in state                           | Not serializable, loses reactivity       | Store data, render JSX from it          |
| Missing `key` on list items                   | React reconciler warns, wrong reuse      | Add `key={item.id}`                     |
| `forwardRef` in React 19                      | Deprecated — extra boilerplate           | `ref` is now a regular prop             |
| `dangerouslySetInnerHTML` with raw user input | XSS vulnerability                        | Sanitise with DOMPurify first           |
| Deep ternary nesting                          | Unreadable                               | Extract to component or variable        |
| `React.createElement` syntax by hand          | Verbose, error-prone                     | Use JSX syntax                          |
| `import React from 'react'` in every file     | Unnecessary with automatic JSX transform | Remove — `jsx-runtime` is auto-imported |
| Mutating props                                | Breaks React's one-way data flow         | Derive new values, never mutate         |
| Skipping heading levels (`h1` → `h3`)         | Breaks accessibility tree                | Maintain heading hierarchy              |

## The Mental Model of JSX

JSX is not HTML in JavaScript. It is a shorthand for function calls — specifically calls to `React.jsx(type, props, key)`. Every JSX element creates a plain JavaScript object describing what should be on screen. React's reconciler compares these objects to the previous render's objects, finds the differences, and applies minimal DOM mutations.

The compilation target explains every constraint. The one-root requirement exists because a function can only return one value. The `className`/`htmlFor` naming exists because these become JavaScript object property names. The requirement for expressions in `{}` exists because curly braces open a JavaScript expression context inside the compilation output.

React 19 extends JSX in three directions. `use()` brings async data reading into render without `useEffect` waterfall. The `ref` prop elimination removes the `forwardRef` indirection. Native metadata support removes the dependency on third-party head management libraries. Each addition follows the same principle as JSX itself: reduce the distance between what you intend and what you write.
