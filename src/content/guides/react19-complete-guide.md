---
title: 'React 19 — The Guide '
published: 2026-03-19
draft: false
description: 'Everything you need to know about new primitives, the Actions model, Server Components, the compiler, form handling, optimistic updates, and the complete architectural shift of React version 19.'
toc: true
tags: ['react', 'jsx']
icons: ['react']
tech: 'react'
---

## What React 19 Represents

React 19 is not a collection of incremental improvements. It is a rearchitecture of how React handles the boundary between server and client, how it thinks about asynchronous state, and how it eliminates categories of manual coordination that developers have been writing by hand for years.

The headline changes cluster around three themes. First, **Actions** — a new model for mutations that replaces the `useState` + `useEffect` + manual loading/error coordination pattern with a single, composable primitive. Second, **Server Components** becoming stable — components that run only on the server and stream HTML to the client, reducing JavaScript bundle size and eliminating client-side data fetching for entire categories of UI. Third, **the React Compiler** (previously React Forget) — a build-time transform that automatically inserts memoization so developers no longer need to manually write `useMemo`, `useCallback`, or `React.memo` for performance.

Each of these addresses a genuine pain point that React developers have worked around for years. Actions replace the pattern of `const [loading, setLoading] = useState(false); const [error, setError] = useState(null)` before every mutation. Server Components replace the pattern of fetching data in `useEffect` after a skeleton screen renders. The Compiler replaces the pattern of profiling render trees to find missing `memo` calls.

```
React Evolution Timeline:

React 16.8  → Hooks (useState, useEffect, useContext)
React 17    → JSX transform (no import needed)
React 18    → Concurrent features (Suspense, useTransition, startTransition)
React 19    → Actions, Server Components (stable), Compiler, new hooks
              use(), useActionState(), useFormStatus(),
              useOptimistic(), Asset Loading APIs
```

## React 19 New APIs — Complete Reference

Before examining each API in depth, here is the complete inventory of what is new in React 19:

| API                         | Category     | Replaces / Improves                           |
| --------------------------- | ------------ | --------------------------------------------- |
| `use(promise)`              | Hook         | `useEffect` + `useState` for async data       |
| `use(context)`              | Hook         | `useContext` (now callable conditionally)     |
| `useActionState()`          | Hook         | `useState` + manual loading/error for forms   |
| `useFormStatus()`           | Hook         | Prop drilling form status down to inputs      |
| `useOptimistic()`           | Hook         | Manual optimistic state patterns              |
| `<form action={fn}>`        | API          | `onSubmit` + manual `preventDefault`          |
| Server Components           | Architecture | Client-side data fetching for static content  |
| Server Actions              | Architecture | API routes for form mutations                 |
| `<DocumentHead>` metadata   | API          | `react-helmet` / manual `<head>` management   |
| Asset preloading APIs       | API          | Manual `<link>` injection in `<head>`         |
| React Compiler              | Tooling      | Manual `useMemo`, `useCallback`, `React.memo` |
| Error boundary improvements | API          | Uncaught promise rejections in Suspense       |
| Custom element support      | API          | Web component interop                         |

## The Actions Model

The most fundamental change in React 19 is the **Actions** model. An Action is any function passed to a transition that may be asynchronous. React tracks the pending state of the action, handles errors, and coordinates optimistic updates — all automatically.

Before React 19, every mutation required the same scaffolding:

```jsx
// React 18 — the pattern every developer has written hundreds of times
function ContactForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      await submitEnquiry(new FormData(e.target));
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={isPending}>
        {isPending ? 'Sending...' : 'Send Enquiry'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

React 19 collapses this entire pattern into `useActionState`:

```jsx
// React 19 — Actions model
import { useActionState } from 'react';

function ContactForm({ propertyId }) {
  const [state, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      // This function IS the action
      // Return value becomes the new state
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');

      try {
        await enquiriesApi.create(propertyId, { name, email, message });
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    { success: false, error: null }, // initial state
  );

  return (
    <form action={submitAction}>
      <input name="name" placeholder="Your name" required />
      <input name="email" type="email" required />
      <textarea name="message" rows={4} required />
      <SubmitButton />
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Enquiry sent!</p>}
    </form>
  );
}
```

### `useActionState` — Deep Dive

```jsx
import { useActionState } from 'react';

// Signature:
// const [state, action, isPending] = useActionState(actionFn, initialState, permalink?)

// actionFn receives: (previousState, formData | any)
// Returns: the new state (any serializable value)
// React tracks isPending automatically while the action is running
// Errors thrown from actionFn are caught by the nearest error boundary

// The three return values:
// state      — current state (starts as initialState, updates after each action)
// action     — function to pass to <form action={...}> or call directly
// isPending  — true while an action is in progress

// Example with validation and multiple error types
function PropertyEnquiryForm({ propertyId, agentName }) {
  const [state, formAction, isPending] = useActionState(
    async (prev, formData) => {
      const data = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim(),
        phone: formData.get('phone')?.trim(),
        message: formData.get('message')?.trim(),
        type: formData.get('type'),
        propertyId,
      };

      // Client-side validation before hitting the server
      const errors = {};
      if (!data.name || data.name.length < 2)
        errors.name = 'Name must be at least 2 characters';
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        errors.email = 'Valid email required';
      if (!data.message || data.message.length < 10)
        errors.message = 'Message must be at least 10 characters';
      if (Object.keys(errors).length)
        return { errors, success: false, submitted: false };

      try {
        await enquiriesApi.create(propertyId, data);
        return { errors: {}, success: true, submitted: true };
      } catch (err) {
        if (err.response?.status === 429) {
          return {
            errors: {
              form: 'Too many enquiries. Please wait before trying again.',
            },
            success: false,
            submitted: false,
          };
        }
        return {
          errors: { form: err.message },
          success: false,
          submitted: false,
        };
      }
    },
    { errors: {}, success: false, submitted: false },
  );

  if (state.submitted) {
    return (
      <div className="enquiry-success">
        <h3>Enquiry Sent!</h3>
        <p>{agentName} will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="enquiry-form">
      <div className="form-field">
        <label htmlFor="name">Full Name</label>
        <input id="name" name="name" type="text" required />
        {state.errors.name && (
          <span className="field-error">{state.errors.name}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="email">Email Address</label>
        <input id="email" name="email" type="email" required />
        {state.errors.email && (
          <span className="field-error">{state.errors.email}</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" />
      </div>

      <div className="form-field">
        <label htmlFor="type">Enquiry Type</label>
        <select id="type" name="type">
          <option value="general">General Enquiry</option>
          <option value="inspection">Request Inspection</option>
          <option value="offer">Make an Offer</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={4} required />
        {state.errors.message && (
          <span className="field-error">{state.errors.message}</span>
        )}
      </div>

      {state.errors.form && <p className="form-error">{state.errors.form}</p>}

      {/* SubmitButton reads isPending from the nearest form — no prop drilling */}
      <SubmitButton />
    </form>
  );
}
```

### `useFormStatus` — Form-Aware Children

`useFormStatus` reads the status of the parent `<form>` without the parent explicitly passing props. This is the React 19 solution to the prop-drilling problem in form components.

```jsx
import { useFormStatus } from 'react-dom';

// This component reads the form's state without receiving any props
function SubmitButton({
  children = 'Submit',
  pendingChildren = 'Submitting...',
}) {
  // useFormStatus must be called inside a component that is a child of a <form>
  // It cannot be called in the same component that renders the <form>
  const { pending, data, method, action } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`submit-btn ${pending ? 'submit-btn--pending' : ''}`}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingChildren}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Works anywhere inside the form — inputs can also read form status
function SmartInput({ name, label, type = 'text', ...props }) {
  const { pending } = useFormStatus();

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        disabled={pending} // auto-disabled while form is submitting
        {...props}
      />
    </div>
  );
}

// Usage — SubmitButton and SmartInput get form state automatically
function EnquiryForm({ action }) {
  return (
    <form action={action}>
      <SmartInput name="name" label="Name" />
      <SmartInput name="email" label="Email" type="email" />
      <SmartInput name="phone" label="Phone" type="tel" />
      <SubmitButton>Send Enquiry</SubmitButton>
    </form>
  );
}
```

### `useOptimistic` — Instant UI Updates

`useOptimistic` displays an optimistic (predicted) state while an async action is in progress, automatically reverting to the real state when the action completes or fails.

```jsx
import { useOptimistic, useActionState } from 'react';

function PropertySaveButton({ propertyId, initialSaved }) {
  // useOptimistic takes: (realState, updateFn)
  // updateFn: (currentOptimisticState, optimisticUpdate) => nextOptimisticState
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    initialSaved,
    (current, update) => update, // update replaces current
  );

  const [, toggleSave, isPending] = useActionState(async () => {
    // Apply optimistic update immediately — before the API call
    setOptimisticSaved(!optimisticSaved);

    try {
      const result = await propertiesApi.save(propertyId);
      return result.saved;
    } catch (err) {
      // On error, useOptimistic automatically rolls back to initialSaved
      throw err;
    }
  }, initialSaved);

  return (
    <button
      onClick={() => toggleSave()}
      className={`save-btn ${optimisticSaved ? 'saved' : ''}`}
      disabled={isPending}
      aria-label={optimisticSaved ? 'Remove from saved' : 'Save property'}
    >
      {optimisticSaved ? '♥ Saved' : '♡ Save'}
    </button>
  );
}

// More complex optimistic update — comments list
function PropertyCommentsList({ propertyId, comments }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (currentComments, newComment) => [
      ...currentComments,
      {
        ...newComment,
        _id: 'temp-' + Date.now(), // temporary ID until server responds
        pending: true, // flag for visual indicator
        createdAt: new Date().toISOString(),
      },
    ],
  );

  const [state, postComment] = useActionState(async (prev, formData) => {
    const text = formData.get('comment');
    if (!text?.trim()) return prev;

    // Add optimistically before API call
    addOptimisticComment({ text, author: 'You' });

    try {
      await commentsApi.create(propertyId, { text });
      return { ...prev, submitted: true };
    } catch (err) {
      return { ...prev, error: err.message };
    }
  }, {});

  return (
    <div className="comments-section">
      <ul className="comments-list">
        {optimisticComments.map((comment) => (
          <li
            key={comment._id}
            className={`comment ${comment.pending ? 'comment--pending' : ''}`}
          >
            <span>{comment.text}</span>
            {comment.pending && (
              <span className="pending-indicator">Sending...</span>
            )}
          </li>
        ))}
      </ul>

      <form action={postComment} className="comment-form">
        <input name="comment" placeholder="Add a note..." required />
        <SubmitButton>Post</SubmitButton>
      </form>
    </div>
  );
}
```

## The `use()` Hook — Reading Promises and Context

`use()` is a new primitive that can read the value of a Promise or a Context — and unlike all other hooks, it can be called conditionally.

### `use(promise)` — Suspense-Integrated Data Reading

```jsx
import { use, Suspense } from 'react';

// The promise is created outside the component — usually passed as a prop
// or created in a parent component / Server Component

// ✅ use() integrates with Suspense — the component suspends until the promise resolves
function PropertyDetails({ propertyPromise }) {
  // use() suspends this component while the promise is pending
  // The nearest <Suspense> boundary shows its fallback during that time
  const property = use(propertyPromise);

  return (
    <div className="property-details">
      <h1>{property.title}</h1>
      <p>{property.address.displayText}</p>
      <p>{property.description}</p>
    </div>
  );
}

// Parent starts the fetch immediately — before the child renders
function PropertyPage({ slug }) {
  // The promise is created immediately when PropertyPage renders
  // PropertyDetails doesn't need to wait for itself to mount before fetching
  // This is the "render-as-you-fetch" pattern — eliminates fetch waterfalls
  const propertyPromise = propertiesApi.getBySlug(slug);

  return (
    <Suspense fallback={<PropertyDetailSkeleton />}>
      <PropertyDetails propertyPromise={propertyPromise} />
    </Suspense>
  );
}

// Multiple parallel data fetches — no waterfall
function PropertyPage({ slug }) {
  // Both fetches start simultaneously
  const propertyPromise = propertiesApi.getBySlug(slug);
  const similarPromise = propertiesApi.getSimilar(slug, 6);

  return (
    <>
      <Suspense fallback={<PropertyDetailSkeleton />}>
        <PropertyDetails propertyPromise={propertyPromise} />
      </Suspense>

      <Suspense fallback={<SimilarPropertiesSkeleton />}>
        <SimilarProperties similarPromise={similarPromise} />
      </Suspense>
    </>
  );
}
```

### `use(context)` — Conditional Context Reading

```jsx
import { use, createContext } from 'react';

const ThemeContext = createContext('light');
const AuthContext = createContext(null);

// use(Context) works inside conditions and loops — unlike useContext
function ConditionalComponent({ showExtra }) {
  // This was IMPOSSIBLE with useContext — hooks can't be in conditions
  // React 19: use() can be called conditionally
  if (showExtra) {
    const theme = use(ThemeContext);
    return <div className={`extra extra--${theme}`}>Extra content</div>;
  }

  return <div>Regular content</div>;
}

// use() and useContext are equivalent for unconditional use
// use() is strictly more powerful — prefer it for new code
function Header() {
  const user = use(AuthContext);
  const theme = use(ThemeContext);

  return (
    <header className={`header header--${theme}`}>
      {user ? `Welcome, ${user.name}` : 'Sign in'}
    </header>
  );
}
```

### `use()` vs `useEffect` — The Waterfall Comparison

```jsx
// React 18 — fetch waterfall pattern
// Component mounts → skeleton renders → useEffect fires → fetch starts → data arrives → render
function PropertyCard_Old({ slug }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertiesApi.getBySlug(slug).then((p) => {
      setProperty(p);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <Skeleton />;
  return <Card property={property} />;
}

// React 19 — render-as-you-fetch
// Fetch starts immediately → Suspense shows skeleton → data arrives → render
function PropertyCard_New({ slug }) {
  // Promise created before this component even renders
  // (passed from parent or created at module level for static slugs)
  const property = use(propertiesPromise);
  return <Card property={property} />;
}
```

| Pattern                   | First Byte Delay         | Data Waterfalls            | Error Handling         | Stale Data          |
| ------------------------- | ------------------------ | -------------------------- | ---------------------- | ------------------- |
| `useEffect` + `useState`  | High — waits for mount   | Common — nested effects    | Manual try/catch       | Manual refetch      |
| `use(promise)`            | Low — fetch starts early | None — parallel by default | Nearest error boundary | Re-create promise   |
| React Query (still valid) | Low with prefetch        | None                       | Built-in               | Automatic staleness |
| Server Component (RSC)    | Zero client JS           | N/A — server               | Server-side            | SSR lifecycle       |

## Document Metadata — Native `<title>`, `<meta>`, `<link>`

React 19 allows rendering metadata tags directly in components. React hoists them to `<head>` automatically, regardless of where in the component tree they are rendered. This eliminates `react-helmet` and manual head management.

```jsx
// React 19 — render metadata directly in components
// React hoists these to <head> automatically
function PropertyDetailPage({ property }) {
  return (
    <>
      {/* Metadata — React hoists to <head> */}
      <title>{property.title} — PropVault</title>

      <meta
        name="description"
        content={`${property.specs.bedrooms} bed, ${property.specs.bathrooms} bath ${property.propertyType} in ${property.address.suburb}. ${property.price.displayText}.`}
      />

      <meta property="og:title" content={property.title} />
      <meta property="og:image" content={property.primaryImage} />
      <meta
        property="og:description"
        content={`${property.address.displayText} — ${property.price.displayText}`}
      />
      <meta property="og:type" content="website" />

      {/* Canonical link */}
      <link
        rel="canonical"
        href={`https://propvault.com.au/properties/${property.slug}`}
      />

      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: property.title,
          description: property.description,
          url: `https://propvault.com.au/properties/${property.slug}`,
          price: property.price.amount,
          priceCurrency: 'AUD',
          address: {
            '@type': 'PostalAddress',
            streetAddress: property.address.line1,
            addressLocality: property.address.suburb,
            addressRegion: property.address.state,
            postalCode: property.address.postcode,
          },
        })}
      </script>

      {/* The actual page content */}
      <PropertyDetailView property={property} />
    </>
  );
}
```

### Deduplication — Multiple Components, One Tag

```jsx
// If multiple components render the same metadata, React deduplicates
// The most specific (deepest in the tree) wins for title
// For meta tags, React uses the `name` prop as the dedup key

// RootLayout renders default metadata
function RootLayout() {
  return (
    <>
      <title>PropVault — Australian Real Estate</title>
      <meta name="theme-color" content="#1a1209" />
      <Outlet />
    </>
  );
}

// PropertyPage overrides the title — React uses this one
function PropertyDetailPage({ property }) {
  return (
    <>
      <title>{property.title} — PropVault</title>
      {/* meta name="theme-color" is NOT re-rendered → deduplication keeps RootLayout's */}
      <PropertyDetailView />
    </>
  );
}
```

## Asset Loading APIs

React 19 provides APIs for preloading scripts, stylesheets, and fonts to improve performance. These work both in Server Components and Client Components.

```jsx
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

// In a component that knows a heavy resource will be needed soon
function PropertyCard({ property }) {
  // Preconnect to image CDN when the card renders
  preconnect('https://images.propvault.com.au');

  // Prefetch DNS for the API
  prefetchDNS('api.propvault.com.au');

  return <article>...</article>;
}

// In a layout that knows a font will be needed
function RootLayout() {
  // Preload critical font — React adds <link rel="preload"> to <head>
  preload(
    'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXBYf9lW4e.woff2',
    {
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  );

  return <div>{/* ... */}</div>;
}

// preinit — load and execute a script / stylesheet immediately
function CheckoutPage() {
  // Ensure a payment library is loaded before the user sees the payment form
  preinit('https://js.stripe.com/v3/', { as: 'script' });
  preinit('https://checkout.stripe.com/pay.css', { as: 'style' });

  return <PaymentForm />;
}
```

## React Server Components (RSC) — Stable in React 19

Server Components run exclusively on the server. They can directly access databases, file systems, and server-only APIs. They produce HTML that streams to the client. They do not contribute JavaScript to the client bundle.

```
Client-Server Component Split:

  Server (no JS sent to client)       Client (JS bundle)
  ─────────────────────────────────   ───────────────────────────────
  PropertyListRSC                     PropertyCard
    - Reads MongoDB directly            - Handles save button click
    - No useEffect needed               - Manages enquiry form
    - Zero bundle contribution          - Handles image gallery swipe
  AgentProfileRSC
    - Fetches agent + their listings
    - Renders to HTML on server
  PropertySearchResultsRSC
    - Aggregation pipeline
    - Returns rendered HTML
```

### Server Component vs Client Component

```jsx
// Server Component — default in React 19 / Next.js App Router
// File: app/properties/[slug]/page.jsx (Next.js App Router convention)

import { notFound } from 'next/navigation';
import { propertiesDb } from '@/lib/db'; // direct DB access — safe, server-only

// async is valid in Server Components — top-level await
async function PropertyPage({ params }) {
  // Direct database access — no API round-trip
  const property = await propertiesDb.findBySlug(params.slug);
  if (!property) notFound();

  // These fetches run in parallel — no useEffect waterfall
  const [similar, agent] = await Promise.all([
    propertiesDb.findSimilar(property._id, 6),
    agentsDb.findById(property.agent),
  ]);

  return (
    <div className="property-page">
      {/* Server-rendered — no JS in bundle */}
      <PropertyGallery images={property.images} />
      <PropertyInfo property={property} agent={agent} />
      <SimilarProperties properties={similar} />

      {/* Client Component — needs interactivity */}
      <EnquiryFormClient
        propertyId={property._id.toString()}
        agentName={agent.firstName}
      />
      <SaveButtonClient propertyId={property._id.toString()} />
    </div>
  );
}

export default PropertyPage;
```

```jsx
// Client Component — must opt in with 'use client'
// File: components/EnquiryFormClient.jsx

'use client';

import { useActionState } from 'react';

// This runs on the client — has access to browser APIs, event handlers
export function EnquiryFormClient({ propertyId, agentName }) {
  const [state, submitAction, isPending] = useActionState(
    async (prev, formData) => {
      // Still calls the API — client components cannot access DB directly
      const res = await enquiriesApi.create(
        propertyId,
        Object.fromEntries(formData),
      );
      return res.success ? { submitted: true } : { error: res.error };
    },
    {},
  );

  return (
    <form action={submitAction}>
      {/* ... form fields */}
      <SubmitButton />
    </form>
  );
}
```

### Server Actions — Direct Function Calls Across the Network

Server Actions are functions that run on the server but can be called from client components. React handles the serialization, network call, and response automatically.

```jsx
// app/actions/property.actions.js — Server Actions file
'use server';

import { propertiesDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// This function runs on the server — called from any client component
export async function savePropertyAction(propertyId) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');

  const isSaved = user.savedProperties.includes(propertyId);

  await usersDb.findByIdAndUpdate(
    user._id,
    isSaved
      ? { $pull: { savedProperties: propertyId } }
      : { $addToSet: { savedProperties: propertyId } },
  );

  // Invalidate the cached page so the save count updates
  revalidatePath(`/properties`);

  return { saved: !isSaved };
}

// Server Action for creating enquiries
export async function createEnquiryAction(formData) {
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    propertyId: formData.get('propertyId'),
  };

  await enquiriesDb.create(data);
  await emailService.notifyAgent(data);

  return { success: true };
}
```

```jsx
// Client component calling a Server Action
'use client';

import { useActionState } from 'react';
import { savePropertyAction } from '@/app/actions/property.actions';

function SaveButton({ propertyId, isSaved: initialSaved }) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    initialSaved,
    (_, update) => update,
  );

  const [, toggleSave] = useActionState(async (prev, formData) => {
    setOptimisticSaved(!optimisticSaved);
    return savePropertyAction(propertyId);
  }, {});

  return (
    <form action={toggleSave}>
      <SubmitButton>{optimisticSaved ? '♥ Saved' : '♡ Save'}</SubmitButton>
    </form>
  );
}
```

### RSC vs Client Component Decision Guide

| Question                                              | Answer → | Component Type          |
| ----------------------------------------------------- | -------- | ----------------------- |
| Does it need `useState` or `useEffect`?               | Yes      | Client (`'use client'`) |
| Does it handle browser events (click, input)?         | Yes      | Client                  |
| Does it use browser APIs (localStorage, geolocation)? | Yes      | Client                  |
| Does it need animation libraries?                     | Yes      | Client                  |
| Does it only render data with no interactivity?       | Yes      | Server                  |
| Does it fetch data from DB/filesystem?                | Yes      | Server                  |
| Does it use environment secrets?                      | Yes      | Server                  |
| Does it need to be SEO-crawlable?                     | Yes      | Server (or SSR)         |
| Is it a layout, header, or static section?            | Yes      | Server                  |

## The React Compiler

The React Compiler (previously React Forget) automatically memoizes components, hooks, and values. It analyzes the dependency graph of your code at build time and inserts `React.memo`, `useMemo`, and `useCallback` where they are needed — and only where they are needed.

```jsx
// Before React Compiler — manual memoization
import { memo, useMemo, useCallback } from 'react';

const PropertyCard = memo(function PropertyCard({ property, onSave }) {
  const formattedPrice = useMemo(
    () =>
      property.price.amount
        ? `$${property.price.amount.toLocaleString('en-AU')}`
        : (property.price.displayText ?? 'Contact Agent'),
    [property.price],
  );

  const handleSave = useCallback(() => {
    onSave(property._id);
  }, [onSave, property._id]);

  return (
    <article className="property-card">
      <h3>{property.title}</h3>
      <p>{formattedPrice}</p>
      <button onClick={handleSave}>Save</button>
    </article>
  );
});

// After React Compiler — write natural code, compiler handles memoization
// The compiler transforms this into the equivalent of the above automatically
function PropertyCard({ property, onSave }) {
  const formattedPrice = property.price.amount
    ? `$${property.price.amount.toLocaleString('en-AU')}`
    : (property.price.displayText ?? 'Contact Agent');

  return (
    <article className="property-card">
      <h3>{property.title}</h3>
      <p>{formattedPrice}</p>
      <button onClick={() => onSave(property._id)}>Save</button>
    </article>
  );
}
// The compiler sees: formattedPrice only changes when property.price changes
// onSave only changes when onSave changes
// It inserts the correct memoization automatically
```

### Enabling the Compiler

```javascript
// babel.config.js
const ReactCompilerConfig = {
  /* ... */
};

module.exports = {
  plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
};

// vite.config.js (using @vitejs/plugin-react)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
  ],
});

// next.config.js
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};
```

### What the Compiler Requires — Rules of React

The compiler only works on code that follows the Rules of React. Violations cause the compiler to skip memoizing that component (it opts out gracefully rather than breaking).

```jsx
// ❌ Mutating props or state — compiler cannot optimize
function BadComponent({ items }) {
  items.push('new item'); // mutating a prop — breaks compiler
  return (
    <ul>
      {items.map((i) => (
        <li>{i}</li>
      ))}
    </ul>
  );
}

// ✅ Immutable — compiler can optimize
function GoodComponent({ items }) {
  const allItems = [...items, 'new item']; // new array — safe
  return (
    <ul>
      {allItems.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

// ❌ Calling hooks conditionally — not allowed regardless of compiler
function BadHooksComponent({ isLoggedIn }) {
  if (isLoggedIn) {
    const [x] = useState(0); // conditional hook — invalid
  }
}

// ✅ Hooks always at top level
function GoodHooksComponent({ isLoggedIn }) {
  const [x] = useState(0);
  if (!isLoggedIn) return null;
  return <div>{x}</div>;
}
```

## Error Handling Improvements

React 19 improves how errors are surfaced. Previously, errors caught by error boundaries were reported twice to `console.error`. React 19 reduces this and adds new options for error handling.

```jsx
import { createRoot } from 'react-dom/client';

// React 19 root creation with error handling options
const root = createRoot(document.getElementById('root'), {
  // Called for errors not caught by error boundaries
  onUncaughtError: (error, errorInfo) => {
    errorMonitoringService.report(error, {
      componentStack: errorInfo.componentStack,
      type: 'uncaught',
    });
  },

  // Called for errors caught by error boundaries
  onCaughtError: (error, errorInfo) => {
    errorMonitoringService.report(error, {
      componentStack: errorInfo.componentStack,
      type: 'caught',
      boundary: errorInfo.errorBoundary,
    });
  },

  // Called for recoverable errors — React retried and succeeded
  onRecoverableError: (error, errorInfo) => {
    console.warn('Recoverable error:', error);
  },
});

root.render(<App />);
```

```jsx
// Enhanced error boundary with React 19's improved reset
import { ErrorBoundary } from 'react-error-boundary';

function PropertyPageErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-boundary">
          <h2>Unable to load property</h2>
          <p>{error.message}</p>
          <button onClick={resetErrorBoundary}>Try Again</button>
          <a href="/properties">Browse All Properties</a>
        </div>
      )}
      onError={(error, info) => {
        errorService.report(error, info);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Custom Elements / Web Components Support

React 19 fixes longstanding issues with Web Components interoperability. Properties are now passed correctly to custom elements.

```jsx
// React 18 — custom element props treated as HTML attributes (strings only)
// Custom elements couldn't receive objects or functions

// React 19 — passes non-string props as properties, not attributes
function PropertyMap({ coordinates, onMarkerClick }) {
  // These are now correctly received as properties by the web component
  return (
    <propvault-map
      center={coordinates} // Object — passed as property
      zoom={14} // Number — passed as property
      onmarkerclick={onMarkerClick} // Function — passed as property
      theme="light" // String — passed as attribute (unchanged)
    />
  );
}
```

## Project — PropVault React 19

**PropVault** is a real estate listing platform rebuilt entirely with React 19 primitives — Server Components for property listings, Actions for enquiries and saves, Server Actions for mutations, and the Compiler for automatic optimization.

### Architecture

```
propvault-react19/
├── app/                         ← Next.js 15 App Router (Server Components by default)
│   ├── layout.jsx               ← Root layout (Server Component)
│   ├── page.jsx                 ← Home page (Server Component)
│   ├── properties/
│   │   ├── page.jsx             ← Listing search (Server Component)
│   │   ├── [slug]/
│   │   │   └── page.jsx         ← Property detail (Server Component)
│   ├── agents/
│   │   └── [id]/
│   │       └── page.jsx         ← Agent profile (Server Component)
│   ├── account/
│   │   ├── saved/
│   │   │   └── page.jsx         ← Saved properties
│   │   └── enquiries/
│   │       └── page.jsx         ← Enquiry history
│   └── actions/
│       ├── property.actions.js  ← Server Actions (mutations)
│       └── enquiry.actions.js
├── components/
│   ├── server/                  ← Pure Server Components
│   │   ├── PropertyList.jsx
│   │   ├── AgentCard.jsx
│   │   └── FeaturedBanner.jsx
│   └── client/                  ← Client Components ('use client')
│       ├── EnquiryForm.jsx
│       ├── SaveButton.jsx
│       ├── SearchFilters.jsx
│       ├── ImageGallery.jsx
│       └── MapView.jsx
├── lib/
│   ├── db.js                    ← Mongoose connection
│   ├── auth.js                  ← Auth utilities
│   └── api.js                   ← Client-side API calls
└── models/                      ← Mongoose models (shared)
```

### Root Layout — Server Component with Metadata

```jsx
// app/layout.jsx — Server Component

import { preload, preconnect } from 'react-dom';
import { getCurrentUser } from '@/lib/auth';
import { NavbarClient } from '@/components/client/NavbarClient';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://propvault.com.au'),
  title: {
    default: 'PropVault — Australian Real Estate',
    template: '%s — PropVault',
  },
  description:
    'Find houses, apartments, and land for sale or rent across Australia.',
  openGraph: {
    type: 'website',
    siteName: 'PropVault',
    locale: 'en_AU',
  },
};

export default async function RootLayout({ children }) {
  // Read auth state server-side — no loading spinner
  const user = await getCurrentUser();

  // Preload critical assets
  preconnect('https://images.propvault.com.au');
  preload('/fonts/playfair-display-v37.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });

  return (
    <html lang="en-AU">
      <body>
        {/* NavbarClient needs interactivity — mobile menu, dropdowns */}
        <NavbarClient user={user} />
        <main>{children}</main>
        <footer className="footer">
          <p>© 2025 PropVault Pty Ltd. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
```

### Property Listing Page — Server Component

```jsx
// app/properties/page.jsx — Server Component
// Receives URL search params directly — no useSearchParams hook needed

import { Suspense } from 'react';
import { propertiesDb } from '@/lib/db';
import { PropertyGrid } from '@/components/server/PropertyGrid';
import { SearchFiltersClient } from '@/components/client/SearchFiltersClient';
import { PropertyGridSkeleton } from '@/components/server/PropertyGridSkeleton';

export const metadata = {
  title: 'Property Search',
  description:
    'Search houses, apartments, and land for sale and rent across Australia.',
};

// searchParams is provided automatically by Next.js — no URL parsing code
export default async function PropertiesPage({ searchParams }) {
  const {
    suburb,
    city,
    state: stateParam,
    type,
    listingType = 'sale',
    minPrice,
    maxPrice,
    minBeds,
    minBaths,
    sort = 'newest',
    page = '1',
    search,
    lat,
    lng,
    radius,
  } = searchParams;

  const filters = {
    ...(suburb && { 'address.suburb': new RegExp(suburb, 'i') }),
    ...(city && { 'address.city': new RegExp(city, 'i') }),
    ...(stateParam && { 'address.state': stateParam }),
    ...(type && { propertyType: type }),
    listingType,
    isActive: true,
    status: 'active',
    ...(minPrice || maxPrice
      ? {
          'price.amount': {
            ...(minPrice && { $gte: Number(minPrice) }),
            ...(maxPrice && { $lte: Number(maxPrice) }),
          },
        }
      : {}),
    ...(minBeds && { 'specs.bedrooms': { $gte: Number(minBeds) } }),
    ...(minBaths && { 'specs.bathrooms': { $gte: Number(minBaths) } }),
  };

  const sortMap = {
    newest: { listedAt: -1 },
    price_asc: { 'price.amount': 1 },
    price_desc: { 'price.amount': -1 },
    beds_desc: { 'specs.bedrooms': -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limit = 20;

  // Direct DB access in Server Component — no HTTP round-trip
  const [properties, total] = await Promise.all([
    propertiesDb
      .find(filters)
      .sort(sortMap[sort] ?? { listedAt: -1 })
      .skip((pageNum - 1) * limit)
      .limit(limit)
      .populate('agent', 'firstName lastName avatar agencyName')
      .lean({ virtuals: true }),
    propertiesDb.countDocuments(filters),
  ]);

  return (
    <div className="properties-page">
      <title>
        {suburb
          ? `Properties in ${suburb} — PropVault`
          : 'Property Search — PropVault'}
      </title>

      <div className="properties-layout">
        {/* Client component — handles filter changes, updates URL */}
        <SearchFiltersClient initialFilters={searchParams} totalCount={total} />

        <div className="results-area">
          <div className="results-header">
            <h1>
              {suburb
                ? `Properties in ${suburb}`
                : city
                  ? `Properties in ${city}`
                  : 'All Properties'}
            </h1>
            <p className="results-count">{total} properties found</p>
          </div>

          {/* Suspense boundary for streaming */}
          <Suspense fallback={<PropertyGridSkeleton count={limit} />}>
            <PropertyGrid
              properties={properties}
              pagination={{
                page: pageNum,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
              }}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

### Property Detail Page — Server Component

```jsx
// app/properties/[slug]/page.jsx

import { notFound } from 'next/navigation';
import { Suspense } from 'next';
import { propertiesDb, agentsDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PropertyGalleryClient } from '@/components/client/PropertyGalleryClient';
import { SaveButtonClient } from '@/components/client/SaveButtonClient';
import { EnquiryFormClient } from '@/components/client/EnquiryFormClient';
import { MapViewClient } from '@/components/client/MapViewClient';
import { SimilarProperties } from '@/components/server/SimilarProperties';
import { SimilarPropertiesSkeleton } from '@/components/server/SimilarPropertiesSkeleton';

// Generate metadata from the property data
export async function generateMetadata({ params }) {
  const property = await propertiesDb.findOne({ slug: params.slug }).lean();
  if (!property) return { title: 'Property Not Found' };

  return {
    title: property.title,
    description: `${property.specs.bedrooms} bed, ${property.specs.bathrooms} bath in ${property.address.suburb}. ${property.price.displayText ?? ''}`,
    openGraph: {
      title: property.title,
      description: property.address.displayText,
      images: property.primaryImage ? [{ url: property.primaryImage }] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }) {
  // Parallel data fetching — Server Component allows direct DB access
  const [property, user] = await Promise.all([
    propertiesDb
      .findOne({ slug: params.slug, isActive: true })
      .populate(
        'agent',
        'firstName lastName email phone mobile avatar bio agencyName agencyLogo licenceNumber stats',
      )
      .lean({ virtuals: true }),
    getCurrentUser(),
  ]);

  if (!property) notFound();

  const isSaved =
    user?.savedProperties?.includes(property._id.toString()) ?? false;

  // Increment view count asynchronously — does not block render
  propertiesDb
    .findByIdAndUpdate(property._id, { $inc: { 'stats.views': 1 } })
    .exec();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description?.slice(0, 200),
    url: `https://propvault.com.au/properties/${property.slug}`,
    numberOfRooms: property.specs.bedrooms,
    floorSize: property.specs.floorSizeM2
      ? {
          '@type': 'QuantitativeValue',
          value: property.specs.floorSizeM2,
          unitCode: 'MTK',
        }
      : undefined,
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      <div className="property-detail-page">
        {/* Image gallery — client component for swipe/modal */}
        <PropertyGalleryClient
          images={property.images}
          title={property.title}
        />

        <div className="property-detail-layout">
          <div className="property-detail-main">
            {/* Hero info — pure server render */}
            <div className="property-hero">
              <div className="property-hero__header">
                <div>
                  <span
                    className={`listing-badge listing-badge--${property.listingType}`}
                  >
                    For {property.listingType === 'sale' ? 'Sale' : 'Rent'}
                  </span>
                  {property.isFeatured && (
                    <span className="featured-badge">Featured</span>
                  )}
                </div>

                {/* Save button — client component for interactivity */}
                <SaveButtonClient
                  propertyId={property._id.toString()}
                  isSaved={isSaved}
                  requiresAuth={!user}
                />
              </div>

              <h1 className="property-hero__title">{property.title}</h1>
              <p className="property-hero__address">
                {property.address.displayText}
              </p>

              <div className="property-hero__price">
                <span className="price-main">
                  {property.price.displayText ??
                    (property.price.amount
                      ? `$${property.price.amount.toLocaleString('en-AU')}`
                      : 'Contact Agent')}
                </span>
                {property.listingType === 'rent' &&
                  property.price.rentPerWeek && (
                    <span className="price-detail">
                      ${property.price.rentPerWeek.toLocaleString()} per week
                    </span>
                  )}
              </div>
            </div>

            {/* Property specs — static, server rendered */}
            <div className="property-specs-grid">
              {property.specs.bedrooms > 0 && (
                <div className="spec-item">
                  <span className="spec-icon">🛏</span>
                  <span className="spec-value">{property.specs.bedrooms}</span>
                  <span className="spec-label">Bedrooms</span>
                </div>
              )}
              {property.specs.bathrooms > 0 && (
                <div className="spec-item">
                  <span className="spec-icon">🚿</span>
                  <span className="spec-value">{property.specs.bathrooms}</span>
                  <span className="spec-label">Bathrooms</span>
                </div>
              )}
              {property.specs.carSpaces > 0 && (
                <div className="spec-item">
                  <span className="spec-icon">🚗</span>
                  <span className="spec-value">{property.specs.carSpaces}</span>
                  <span className="spec-label">Car Spaces</span>
                </div>
              )}
              {property.specs.landSizeM2 && (
                <div className="spec-item">
                  <span className="spec-icon">📐</span>
                  <span className="spec-value">
                    {property.specs.landSizeM2.toLocaleString()}
                  </span>
                  <span className="spec-label">Land m²</span>
                </div>
              )}
              {property.specs.floorSizeM2 && (
                <div className="spec-item">
                  <span className="spec-icon">🏠</span>
                  <span className="spec-value">
                    {property.specs.floorSizeM2.toLocaleString()}
                  </span>
                  <span className="spec-label">Floor m²</span>
                </div>
              )}
              {property.specs.yearBuilt && (
                <div className="spec-item">
                  <span className="spec-icon">🗓</span>
                  <span className="spec-value">{property.specs.yearBuilt}</span>
                  <span className="spec-label">Year Built</span>
                </div>
              )}
            </div>

            {/* Description */}
            <section className="property-description">
              <h2>About This Property</h2>
              <p>{property.description}</p>
            </section>

            {/* Features */}
            {(property.features?.indoor?.length > 0 ||
              property.features?.outdoor?.length > 0) && (
              <section className="property-features">
                <h2>Features</h2>
                {property.features.indoor?.length > 0 && (
                  <div className="feature-group">
                    <h3>Indoor</h3>
                    <ul className="feature-list">
                      {property.features.indoor.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {property.features.outdoor?.length > 0 && (
                  <div className="feature-group">
                    <h3>Outdoor</h3>
                    <ul className="feature-list">
                      {property.features.outdoor.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Map — client component (browser Leaflet/MapboxGL) */}
            <section className="property-map">
              <h2>Location</h2>
              <MapViewClient
                coordinates={property.location.coordinates}
                address={property.address.displayText}
              />
            </section>

            {/* Similar properties — streamed in via Suspense */}
            <section className="similar-properties">
              <h2>Similar Properties</h2>
              <Suspense fallback={<SimilarPropertiesSkeleton />}>
                <SimilarProperties
                  currentId={property._id.toString()}
                  suburb={property.address.suburb}
                  propertyType={property.propertyType}
                  limit={3}
                />
              </Suspense>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="property-detail-sidebar">
            {/* Agent card — server rendered */}
            <div className="agent-card">
              <img
                src={property.agent.avatar ?? '/images/agent-placeholder.jpg'}
                alt={`${property.agent.firstName} ${property.agent.lastName}`}
                className="agent-card__avatar"
              />
              <div className="agent-card__info">
                <h3>
                  {property.agent.firstName} {property.agent.lastName}
                </h3>
                <p className="agent-agency">{property.agent.agencyName}</p>
                {property.agent.stats && (
                  <p className="agent-stats">
                    {property.agent.stats.activeListings} active listings ·
                    {property.agent.stats.soldProperties} sold
                  </p>
                )}
              </div>

              <div className="agent-contact">
                {property.agent.mobile && (
                  <a
                    href={`tel:${property.agent.mobile}`}
                    className="btn btn--ghost"
                  >
                    📞 {property.agent.mobile}
                  </a>
                )}
              </div>
            </div>

            {/* Enquiry form — client component (needs form interactivity) */}
            <EnquiryFormClient
              propertyId={property._id.toString()}
              agentName={property.agent.firstName}
            />
          </aside>
        </div>
      </div>
    </>
  );
}
```

### Save Button — Client Component with Server Action

```jsx
// components/client/SaveButtonClient.jsx
'use client';

import { useActionState, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { savePropertyAction } from '@/app/actions/property.actions';

export function SaveButtonClient({ propertyId, isSaved, requiresAuth }) {
  const router = useRouter();

  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    isSaved,
    (_, next) => next,
  );

  const [state, toggleSave, isPending] = useActionState(
    async (prev) => {
      if (requiresAuth) {
        router.push(`/login?returnUrl=/properties`);
        return prev;
      }

      setOptimisticSaved(!optimisticSaved);

      try {
        const result = await savePropertyAction(propertyId);
        return { saved: result.saved };
      } catch {
        setOptimisticSaved(optimisticSaved); // rollback
        return { ...prev, error: 'Failed to save. Please try again.' };
      }
    },
    { saved: isSaved },
  );

  return (
    <form>
      <button
        formAction={toggleSave}
        className={`save-btn ${optimisticSaved ? 'save-btn--saved' : ''}`}
        disabled={isPending}
        aria-label={
          optimisticSaved
            ? 'Remove from saved properties'
            : 'Save this property'
        }
      >
        <span className="save-btn__icon">{optimisticSaved ? '♥' : '♡'}</span>
        <span className="save-btn__text">
          {optimisticSaved ? 'Saved' : 'Save'}
        </span>
      </button>
      {state.error && <p className="save-error">{state.error}</p>}
    </form>
  );
}
```

### Search Filters — Client Component Syncing URL State

```jsx
// components/client/SearchFiltersClient.jsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';

const PROPERTY_TYPES = [
  'house',
  'apartment',
  'townhouse',
  'villa',
  'land',
  'commercial',
];

export function SearchFiltersClient({ initialFilters, totalCount }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key, value) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  const current = {
    listingType: searchParams.get('listingType') ?? 'sale',
    type: searchParams.get('type'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    minBeds: searchParams.get('minBeds'),
    minBaths: searchParams.get('minBaths'),
  };

  return (
    <aside
      className={`filter-panel ${isPending ? 'filter-panel--updating' : ''}`}
    >
      <div className="filter-panel__header">
        <h2>Filters</h2>
        <span className="results-count">{totalCount} found</span>
        <button onClick={clearAll}>Clear all</button>
      </div>

      {/* Listing Type */}
      <div className="filter-group">
        <p className="filter-label">Listing Type</p>
        <div className="listing-type-tabs">
          {['sale', 'rent', 'lease'].map((t) => (
            <button
              key={t}
              className={`tab-btn ${current.listingType === t ? 'active' : ''}`}
              onClick={() => updateFilter('listingType', t)}
            >
              {t === 'sale' ? 'Buy' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div className="filter-group">
        <p className="filter-label">Property Type</p>
        <div className="type-grid">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t}
              className={`type-btn ${current.type === t ? 'active' : ''}`}
              onClick={() =>
                updateFilter('type', current.type === t ? null : t)
              }
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <p className="filter-label">Price Range</p>
        <div className="range-inputs">
          <input
            type="number"
            placeholder="Min $"
            defaultValue={current.minPrice ?? ''}
            onBlur={(e) => updateFilter('minPrice', e.target.value || null)}
          />
          <span>—</span>
          <input
            type="number"
            placeholder="Max $"
            defaultValue={current.maxPrice ?? ''}
            onBlur={(e) => updateFilter('maxPrice', e.target.value || null)}
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="filter-group">
        <p className="filter-label">Bedrooms</p>
        <div className="count-selector">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`count-btn ${Number(current.minBeds) === n ? 'active' : ''}`}
              onClick={() => updateFilter('minBeds', n || null)}
            >
              {n === 0 ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div className="filter-group">
        <p className="filter-label">Bathrooms</p>
        <div className="count-selector">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              className={`count-btn ${Number(current.minBaths) === n ? 'active' : ''}`}
              onClick={() => updateFilter('minBaths', n || null)}
            >
              {n === 0 ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      {isPending && (
        <div className="filter-updating" aria-live="polite">
          Updating...
        </div>
      )}
    </aside>
  );
}
```

### Enquiry Form — Client Component with Actions

```jsx
// components/client/EnquiryFormClient.jsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createEnquiryAction } from '@/app/actions/enquiry.actions';

// Individual field component — reads form status without props
function FormField({ name, label, type = 'text', required, rows }) {
  const { pending } = useFormStatus();

  if (rows) {
    return (
      <div className="form-field">
        <label htmlFor={name}>
          {label}
          {required && ' *'}
        </label>
        <textarea
          id={name}
          name={name}
          rows={rows}
          disabled={pending}
          required={required}
        />
      </div>
    );
  }

  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && ' *'}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        disabled={pending}
        required={required}
      />
    </div>
  );
}

function FormSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`submit-btn ${pending ? 'submit-btn--loading' : ''}`}
    >
      {pending ? (
        <>
          <span className="spinner" />
          Sending Enquiry...
        </>
      ) : (
        'Send Enquiry'
      )}
    </button>
  );
}

export function EnquiryFormClient({ propertyId, agentName }) {
  const action = createEnquiryAction.bind(null, propertyId);

  const [state, formAction, isPending] = useActionState(
    async (prev, formData) => {
      // Validate
      const name = formData.get('name')?.trim();
      const email = formData.get('email')?.trim();
      const message = formData.get('message')?.trim();

      const errors = {};
      if (!name || name.length < 2) errors.name = 'Please enter your full name';
      if (!email || !email.includes('@'))
        errors.email = 'Please enter a valid email address';
      if (!message || message.length < 10)
        errors.message = 'Message must be at least 10 characters';

      if (Object.keys(errors).length) {
        return { ...prev, errors, submitted: false };
      }

      try {
        await action(formData);
        return { submitted: true, errors: {} };
      } catch (err) {
        return {
          submitted: false,
          errors: { form: 'Failed to send enquiry. Please try again.' },
        };
      }
    },
    { submitted: false, errors: {} },
  );

  if (state.submitted) {
    return (
      <div className="enquiry-success" role="alert">
        <div className="success-icon">✓</div>
        <h3>Enquiry Sent!</h3>
        <p>{agentName} will contact you shortly.</p>
        <p className="success-note">Check your email for a confirmation.</p>
      </div>
    );
  }

  return (
    <div className="enquiry-form-card">
      <h3 className="enquiry-form-title">Enquire About This Property</h3>

      {state.errors.form && (
        <div className="form-error-banner" role="alert">
          {state.errors.form}
        </div>
      )}

      <form action={formAction} noValidate>
        <FormField name="name" label="Full Name" required />
        {state.errors.name && (
          <p className="field-error">{state.errors.name}</p>
        )}

        <FormField name="email" label="Email Address" type="email" required />
        {state.errors.email && (
          <p className="field-error">{state.errors.email}</p>
        )}

        <FormField name="phone" label="Phone (optional)" type="tel" />

        <div className="form-field">
          <label htmlFor="type">Enquiry Type</label>
          <select id="type" name="type" disabled={isPending}>
            <option value="general">General Enquiry</option>
            <option value="inspection">Request Inspection</option>
            <option value="offer">Make an Offer</option>
          </select>
        </div>

        <FormField name="message" label="Message" rows={4} required />
        {state.errors.message && (
          <p className="field-error">{state.errors.message}</p>
        )}

        <FormSubmitButton />
      </form>
    </div>
  );
}
```

### Similar Properties — Streaming Server Component

```jsx
// components/server/SimilarProperties.jsx — Server Component
// This component is rendered in a Suspense boundary — it streams in after the main content

import { propertiesDb } from '@/lib/db';
import { PropertyCardServer } from './PropertyCardServer';

export async function SimilarProperties({
  currentId,
  suburb,
  propertyType,
  limit = 3,
}) {
  // This can be slow — it's in a Suspense boundary so it doesn't block the page
  const similar = await propertiesDb
    .find({
      _id: { $ne: currentId },
      isActive: true,
      status: 'active',
      propertyType,
      'address.suburb': suburb,
    })
    .limit(limit)
    .sort({ listedAt: -1 })
    .select('title slug primaryImage address specs price listedAt agent')
    .populate('agent', 'firstName lastName agencyName')
    .lean({ virtuals: true });

  if (!similar.length) return null;

  return (
    <div className="similar-grid">
      {similar.map((property) => (
        <PropertyCardServer key={property._id.toString()} property={property} />
      ))}
    </div>
  );
}

// components/server/PropertyCardServer.jsx — pure Server Component (no interactivity)
export function PropertyCardServer({ property }) {
  return (
    <article className="property-card">
      <a href={`/properties/${property.slug}`} className="property-card__link">
        <div className="property-card__image-wrap">
          <img
            src={property.primaryImage ?? '/images/property-placeholder.jpg'}
            alt={property.title}
            loading="lazy"
            width={400}
            height={300}
          />
          <span
            className={`listing-badge listing-badge--${property.listingType}`}
          >
            For {property.listingType === 'sale' ? 'Sale' : 'Rent'}
          </span>
        </div>

        <div className="property-card__body">
          <p className="property-price">
            {property.price?.displayText ??
              (property.price?.amount
                ? `$${property.price.amount.toLocaleString('en-AU')}`
                : 'Contact Agent')}
          </p>
          <h3 className="property-title">{property.title}</h3>
          <p className="property-address">{property.address?.displayText}</p>

          <div className="property-specs">
            {property.specs?.bedrooms > 0 && (
              <span>🛏 {property.specs.bedrooms}</span>
            )}
            {property.specs?.bathrooms > 0 && (
              <span>🚿 {property.specs.bathrooms}</span>
            )}
            {property.specs?.carSpaces > 0 && (
              <span>🚗 {property.specs.carSpaces}</span>
            )}
          </div>

          <div className="property-card__footer">
            <span>
              {property.agent?.firstName} {property.agent?.lastName}
            </span>
            <span>{property.daysOnMarket}d ago</span>
          </div>
        </div>
      </a>
    </article>
  );
}
```

### Agent Profile Page — Server Component

```jsx
// app/agents/[id]/page.jsx

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { agentsDb } from '@/lib/db';
import { propertiesDb } from '@/lib/db';
import { PropertyCardServer } from '@/components/server/PropertyCardServer';
import { PropertyGridSkeleton } from '@/components/server/PropertyGridSkeleton';

export async function generateMetadata({ params }) {
  const agent = await agentsDb.findById(params.id).lean();
  if (!agent) return {};
  return {
    title: `${agent.firstName} ${agent.lastName} — ${agent.agencyName}`,
    description:
      agent.bio?.slice(0, 160) ??
      `Contact ${agent.firstName} for real estate in ${agent.agencyName}`,
  };
}

export default async function AgentProfilePage({ params }) {
  const [agent, activeListings] = await Promise.all([
    agentsDb
      .findById(params.id)
      .populate('user', 'email')
      .lean({ virtuals: true }),
    propertiesDb
      .find({ agent: params.id, isActive: true, status: 'active' })
      .sort({ listedAt: -1 })
      .limit(12)
      .select('title slug primaryImage address specs price listedAt')
      .lean({ virtuals: true }),
  ]);

  if (!agent || !agent.isActive) notFound();

  return (
    <div className="agent-profile-page">
      <title>
        {agent.firstName} {agent.lastName} — PropVault
      </title>

      {/* Agent hero */}
      <section className="agent-hero">
        <div className="agent-hero__inner">
          <img
            src={agent.avatar ?? '/images/agent-placeholder.jpg'}
            alt={`${agent.firstName} ${agent.lastName}`}
            className="agent-hero__avatar"
            width={120}
            height={120}
          />
          <div className="agent-hero__info">
            <div className="agent-hero__name-row">
              <h1>
                {agent.firstName} {agent.lastName}
              </h1>
              {agent.isVerified && (
                <span className="verified-badge">✓ Verified</span>
              )}
            </div>
            <p className="agent-agency">{agent.agencyName}</p>
            {agent.specialisations?.length > 0 && (
              <div className="agent-tags">
                {agent.specialisations.map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="agent-contact-btns">
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="btn btn--primary">
                Call Agent
              </a>
            )}
            {agent.mobile && (
              <a href={`sms:${agent.mobile}`} className="btn btn--ghost">
                Text Agent
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Agent stats */}
      <section className="agent-stats-bar">
        <div className="stat-item">
          <span className="stat-value">{agent.stats.activeListings}</span>
          <span className="stat-label">Active Listings</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{agent.stats.soldProperties}</span>
          <span className="stat-label">Properties Sold</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{agent.stats.averageDaysOnMarket}</span>
          <span className="stat-label">Avg Days on Market</span>
        </div>
        {agent.stats.averageRating > 0 && (
          <div className="stat-item">
            <span className="stat-value">
              {agent.stats.averageRating.toFixed(1)}
            </span>
            <span className="stat-label">
              Average Rating ({agent.stats.reviewCount} reviews)
            </span>
          </div>
        )}
      </section>

      {/* Bio */}
      {agent.bio && (
        <section className="agent-bio">
          <h2>About {agent.firstName}</h2>
          <p>{agent.bio}</p>
          {agent.languages?.length > 0 && (
            <p className="agent-languages">
              <strong>Languages: </strong>
              {agent.languages.join(', ')}
            </p>
          )}
        </section>
      )}

      {/* Active listings */}
      <section className="agent-listings">
        <h2>{agent.firstName}&apos;s Active Listings</h2>
        {activeListings.length === 0 ? (
          <p className="empty-state">No active listings at this time.</p>
        ) : (
          <div className="property-grid">
            {activeListings.map((property) => (
              <PropertyCardServer
                key={property._id.toString()}
                property={property}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

## React 19 and React Query — Still Relevant Together

React 19's `use(promise)` handles basic data fetching cases. React Query remains relevant for:

```jsx
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';

// React Query is still the right tool for:
// 1. Client-side search with caching (filters change frequently)
// 2. Infinite scroll lists
// 3. Polling (live auction prices, inspection slot availability)
// 4. Complex cache invalidation across mutations
// 5. Background refetch on focus/reconnect

// Example: Client-side property search with caching
// The server renders an initial result, the client takes over for filtering
function ClientSearchWidget() {
  const [filters, setFilters] = useState({ listingType: 'sale', page: 1 });

  // React Query handles: dedup, caching, background refresh, loading states
  // use(promise) doesn't — for interactive, client-side search, React Query wins
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.search(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData, // keeps previous page visible during navigation
  });

  return <SearchWidget data={data} onFilter={setFilters} />;
}

// React 19 use() is better for:
// 1. Static/SSR data passed from server to client
// 2. Simple one-time fetches without caching needs
// 3. Server Component data waterfalls
// 4. Data that doesn't need to refetch

// The two coexist — RSC fetches fresh server data, React Query manages client interactions
```

## Migration from React 18 to React 19

### Automated Migration

```bash
# React 19 codemods handle most migrations automatically
npx codemod@latest react/19/replace-act-wrap-await
npx codemod@latest react/19/replace-string-ref
npx codemod@latest react/19/replace-use-form-state
```

### Breaking Changes

```jsx
// 1. ref as a prop (no more forwardRef)
// React 18 — required forwardRef
const Input18 = forwardRef(({ label, ...props }, ref) => (
  <div>
    <label>{label}</label>
    <input ref={ref} {...props} />
  </div>
));

// React 19 — ref is a regular prop
function Input19({ label, ref, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
    </div>
  );
}
// forwardRef still works but is deprecated — use ref-as-prop going forward
```

```jsx
// 2. useFormState → useActionState (renamed)
// React 18 / early React 19 RC
import { useFormState } from 'react-dom'; // deprecated
const [state, action] = useFormState(actionFn, initialState);

// React 19
import { useActionState } from 'react';
const [state, action, isPending] = useActionState(actionFn, initialState);
// Note: isPending is now the third return value
```

```jsx
// 3. Context — no longer needs a .Provider wrapper
// React 18
const ThemeContext = createContext('light');
function App() {
  return (
    <ThemeContext.Provider value="dark">
      {' '}
      {/* .Provider required */}
      <Content />
    </ThemeContext.Provider>
  );
}

// React 19
function App() {
  return (
    <ThemeContext value="dark">
      {' '}
      {/* .Provider is gone — use Context directly */}
      <Content />
    </ThemeContext>
  );
}
// ThemeContext.Provider still works but is deprecated
```

```jsx
// 4. String refs — removed entirely
// React 18 (deprecated)
class OldComponent extends React.Component {
  render() {
    return <input ref="myInput" />; // string ref — removed in v19
  }
}

// React 19 — use callback ref or useRef
function NewComponent() {
  const inputRef = useRef(null);
  return <input ref={inputRef} />;
}
```

```jsx
// 5. ReactDOM.render — removed (was deprecated in React 18)
// React 17
ReactDOM.render(<App />, document.getElementById('root'));

// React 18+
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')).render(<App />);
```

### Migration Priority Table

| Breaking Change                   | Severity    | Automated Fix?       |
| --------------------------------- | ----------- | -------------------- |
| `ReactDOM.render` removed         | Breaking    | ✅ Codemod available |
| String refs removed               | Breaking    | ✅ Codemod available |
| `react-test-renderer` changes     | Breaking    | ⚠️ Manual            |
| `useFormState` → `useActionState` | Deprecation | ✅ Codemod available |
| `forwardRef` deprecated           | Deprecation | ✅ Gradual           |
| `Context.Provider` deprecated     | Deprecation | ✅ Gradual           |
| `act` warnings changes            | Behavior    | ✅ Codemod available |
| Hydration error diffs             | Behavior    | ❌ Manual review     |

## Common Patterns and Anti-Patterns in React 19

### Anti-Patterns

```jsx
// ❌ Creating promises inside useActionState — recreated every render
function BadForm() {
  const [state, action] = useActionState(
    async (prev, formData) => {
      // This is fine — async in action is correct
      const result = await api.submit(formData);
      return result;
    },
    {}
  );
}

// ❌ Using use() for data that needs caching/refetching
function BadSearchResults({ query }) {
  // Promise created every render — no caching, no dedup
  const results = use(searchApi.search(query));
  return <ResultsList items={results} />;
}
// ✅ Use React Query for interactive search with caching

// ❌ Calling useFormStatus in the same component as the form
function BadFormComponent() {
  const { pending } = useFormStatus();  // ❌ Returns empty values — wrong component level
  return (
    <form action={myAction}>
      <button disabled={pending}>Submit</button>  {/* pending is always false here */}
    </form>
  );
}

// ✅ Call useFormStatus in a child component of the form
function SubmitBtn() {
  const { pending } = useFormStatus();  // ✅ Reads parent form's status
  return <button disabled={pending}>Submit</button>;
}
function GoodFormComponent() {
  return (
    <form action={myAction}>
      <SubmitBtn />  {/* SubmitBtn is a child — useFormStatus works */}
    </form>
  );
}

// ❌ Mixing Server Actions and client-only libraries directly
// 'use server' files cannot import browser APIs
// app/actions/bad.action.js
'use server';
import { useLocalStorage } from 'react-use';  // ❌ Browser hook in server file
export async function badAction() { ... }

// ✅ Server Actions are pure Node.js — no browser APIs
'use server';
import { db } from '@/lib/db';  // ✅ Server-only imports only
export async function goodAction(formData) {
  return db.save(Object.fromEntries(formData));
}
```

### Full Anti-Patterns Reference

| Anti-Pattern                                               | Problem                                                          | Solution                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| `useEffect` for data fetching                              | Waterfall delays, manual state management                        | `use(promise)` or React Query                       |
| `useState` for every form field                            | Verbose, unnecessary rerenders                                   | `useActionState` with `formData`                    |
| Manual loading + error state for mutations                 | Boilerplate that React 19 eliminates                             | `useActionState`                                    |
| Prop-drilling form status                                  | Deep component trees need to know about parent form              | `useFormStatus()`                                   |
| Importing `'use client'` components into Server Components | Client code runs on server                                       | Mark client components with `'use client'` boundary |
| Database calls in Client Components                        | Security risk — credentials in browser                           | Server Components or Server Actions                 |
| Forgetting Suspense boundaries for `use()`                 | Uncaught promise rejection                                       | Every `use(promise)` needs a parent `<Suspense>`    |
| Server Actions for reads                                   | Actions are for mutations — reads don't need the server overhead | Server Components with async/await                  |
| Calling `useFormStatus` in the form component itself       | Returns `{ pending: false }` always — must be a child            | Extract submit button/inputs to child components    |
| Deeply nested Suspense with slow data                      | Inner slow query blocks outer fast content                       | Parallel Suspense boundaries, not nested            |

## React 19 Feature Comparison — Before and After

| Feature                  | React 18 Pattern                                | React 19 Pattern                     |
| ------------------------ | ----------------------------------------------- | ------------------------------------ |
| Mutation state           | `useState(false)` + `useState(null)` × 3        | `useActionState(fn, initial)`        |
| Form submission          | `onSubmit` + `preventDefault()` + async handler | `<form action={fn}>`                 |
| Form button disable      | Prop drilling `isPending` down                  | `useFormStatus()` in child           |
| Optimistic updates       | Manual state + rollback on error                | `useOptimistic(state, reducer)`      |
| Async data reading       | `useEffect` + `useState` + loading flag         | `use(promise)` + `<Suspense>`        |
| Conditional context      | Impossible — hooks can't be conditional         | `use(Context)` in `if` block         |
| Page title/meta          | `react-helmet` library                          | `<title>` / `<meta>` directly in JSX |
| Asset preloading         | Manual `<link>` injection                       | `preload()`, `preinit()` APIs        |
| Server data fetching     | `getServerSideProps` / `getStaticProps`         | `async` Server Component             |
| DB access from component | Never — always via API                          | ✅ Directly in Server Component      |
| Bundle size contribution | Every component ships JS                        | Server Components: zero client JS    |
| Ref forwarding           | `forwardRef()` wrapper required                 | `ref` is a plain prop                |
| Context provider syntax  | `<Context.Provider value={...}>`                | `<Context value={...}>`              |
| Memoization              | Manual `memo`, `useMemo`, `useCallback`         | React Compiler (automatic)           |

## The Mental Model of React 19

React 19 completes a shift that began in React 18: from a client-side rendering library to a full-stack component framework. The architectural center of gravity moved from the browser to the server-client boundary.

**Server Components** represent the biggest mental model change. The question is no longer "how do I fetch data and manage loading state?" but "which components should run on the server?" Components that only need to render data — property listings, agent profiles, article content — belong on the server. They produce HTML directly. They do not ship JavaScript. They can access databases. The browser never runs them.

**Actions** represent the completion of the unidirectional data flow model. Data flows down from server to components. Changes flow up through Actions — functions that describe what should change. React tracks the pending state, error state, and result automatically. The developer describes the action; React handles the coordination.

**The Compiler** represents React's bet on convention over configuration. Rather than asking developers to correctly identify which values need memoization (a hard problem), the compiler analyzes the code structure and inserts memoization correctly everywhere it matters. This moves performance optimization from a developer skill to a toolchain responsibility.

Together, these three changes mean that a React 19 application has less code in the browser (Server Components), less coordination code around mutations (Actions), and less optimization code (Compiler). The developer writes the meaningful part — the data access logic, the mutation logic, the UI structure — and the framework handles the machinery around it.
