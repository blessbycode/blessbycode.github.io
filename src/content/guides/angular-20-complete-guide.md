---
title: 'Angular 20 — From Beginning and Beyond '
published: 2026-02-10
draft: false
description: 'Everything you need to know about Angular 20: every new feature, every breaking change, every API compared against its predecessor.'
toc: true
tags: ['angular', 'typescript']
icons: ['angular-icon']
tech: 'angular'
---

## What Angular 20 Represents

Angular 20 is not an incremental release. It is the culmination of a two-year architectural overhaul that began with Signals in Angular 16, accelerated through Standalone Components in Angular 17, and now reaches completion with a framework that is leaner, faster, and fundamentally reactive by default.

The headline story of Angular 20 is **reactivity without boilerplate**. Zone.js is no longer required. The `async` pipe is optional. Change detection based on Observable subscriptions is giving way to fine-grained, signal-driven updates that update exactly what changed — nothing more.

This guide covers every dimension of Angular 20: setup, signals, control flow, routing, forms, HTTP, server-side rendering, testing, and the migration path from Angular 14–19.

## Version History and Feature Progression

Understanding how we got to Angular 20 makes the decisions clearer.

| Version        | Year     | Headline Feature                                                          |
| -------------- | -------- | ------------------------------------------------------------------------- |
| Angular 14     | 2022     | Standalone components (developer preview)                                 |
| Angular 15     | 2022     | Standalone APIs stable, directive composition                             |
| Angular 16     | 2023     | Signals (developer preview), required inputs                              |
| Angular 17     | 2023     | Built-in control flow (`@if`, `@for`), `@defer`, new application builder  |
| Angular 18     | 2024     | Zoneless change detection (experimental), Material 3                      |
| Angular 19     | 2024     | Incremental hydration, linked signals, resource API                       |
| **Angular 20** | **2025** | **Signals stable, zoneless stable, full reactivity, resource API stable** |

## Installation Prerequisites

```bash
# Node.js 22.x or higher required for Angular 20
node --version   # must be >= 22.0.0

# Install Angular CLI 20
npm install -g @angular/cli@20

# Verify installation
ng version
```

### Create a New Project

```bash
# Angular 20 recommended setup — fully zoneless, standalone
ng new my-app \
  --style=scss \
  --routing \
  --ssr=false

cd my-app
```

### The New `angular.json` Defaults in v20

Angular 20 sets new defaults that differ significantly from Angular 14:

| Setting              | Angular 14                                  | Angular 20                                              |
| -------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `standalone` default | `false`                                     | `true`                                                  |
| Build tool           | Webpack via `@angular-devkit/build-angular` | esbuild via `@angular/build`                            |
| SSR                  | Optional, manual setup                      | Generated with `--ssr` flag                             |
| Zone.js              | Required                                    | Optional (`provideExperimentalZonelessChangeDetection`) |
| Default module       | `AppModule` generated                       | No NgModule — `app.config.ts` only                      |
| Template syntax      | `*ngIf`, `*ngFor`                           | `@if`, `@for` (built-in)                                |

## Application Bootstrap

Angular 20 bootstraps without NgModule. The `app.config.ts` file replaces `app.module.ts` entirely.

```typescript
// src/app/app.config.ts — the new root configuration file

import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router — withComponentInputBinding passes route params as @Input()
    provideRouter(
      routes,
      withComponentInputBinding(), // NEW in Angular 16, standard in 20
      withViewTransitions(), // CSS View Transitions API
    ),

    // HTTP — withFetch uses the native Fetch API instead of XHR
    provideHttpClient(
      withFetch(), // NEW in Angular 17, standard in 20
      withInterceptors([]),
    ),

    // Animations — loaded lazily so they don't block initial render
    provideAnimationsAsync(),

    // Zoneless change detection — the Angular 20 default for new projects
    // This replaces Zone.js entirely — signals drive all updates
    provideZonelessChangeDetection(),
  ],
};
```

```typescript
// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch(console.error);
```

### Zoneless vs Zone.js — The Core Difference

| Aspect                   | Zone.js (Angular ≤19)                           | Zoneless (Angular 20+)                        |
| ------------------------ | ----------------------------------------------- | --------------------------------------------- |
| Change detection trigger | Zone intercepts every async event               | Signals notify the framework explicitly       |
| CPU overhead             | High — checks entire component tree             | Low — only re-renders changed components      |
| Async pipe               | Required to subscribe in templates              | Optional — signals used directly in templates |
| `detectChanges()`        | Sometimes needed manually                       | Never needed                                  |
| Setup                    | Automatic (included via `zone.js` in polyfills) | `provideZonelessChangeDetection()`            |
| `OnPush`                 | Optional optimization                           | Effectively always on                         |
| setTimeout/setInterval   | Automatically tracked                           | Must use signals or `markForCheck()`          |
| Debugging                | Zone intercepts all — easy to trace             | Signal graph — different mental model         |
| Bundle size impact       | +35kb for zone.js                               | 0kb — zone.js removed entirely                |

## Angular Signals — The Reactive Primitive

Signals are the most important addition in modern Angular. A **Signal** is a reactive wrapper around a value that notifies Angular when it changes.

```typescript
Signal<T> = { value: T } + change notification
```

Every component in Angular 20 is expected to be built with Signals. This is how Angular achieves zoneless change detection.

### Signal Types

```typescript
// src/app/signals-demo.component.ts

import {
  Component,
  signal, // writable signal — you can set/update it
  computed, // derived signal — recalculates when dependencies change
  effect, // side effect — runs whenever dependencies change
  input, // NEW Angular 17.1+ — signal-based @Input()
  output, // NEW Angular 17.3+ — signal-based @Output()
  model, // NEW Angular 17.2+ — two-way binding signal
  linkedSignal, // NEW Angular 19 — derived writable signal
  resource, // NEW Angular 19 (stable in 20) — async data loading
} from '@angular/core';

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  template: `
    <div class="counter">
      <p>Count: {{ count() }}</p>
      <p>Double: {{ double() }}</p>
      <p>Message: {{ message() }}</p>

      <button (click)="increment()">+1</button>
      <button (click)="reset()">Reset</button>
    </div>
  `,
})
export class SignalsDemoComponent {
  // signal() creates a writable signal with an initial value
  count = signal(0);

  // computed() creates a derived signal — recalculates only when count() changes
  double = computed(() => this.count() * 2);

  message = computed(() =>
    this.count() === 0
      ? 'Start counting!'
      : `You've counted ${this.count()} times`,
  );

  constructor() {
    // effect() runs whenever any signal it reads changes
    // Like a watcher — runs on every count change
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
      // Angular automatically tracks which signals are read here
    });
  }

  increment(): void {
    // set() replaces the value
    this.count.set(this.count() + 1);
  }

  reset(): void {
    this.count.set(0);
  }

  incrementByAmount(amount: number): void {
    // update() uses the current value to compute the next value
    this.count.update((current) => current + amount);
  }
}
```

### Signal Inputs — Replacing `@Input()`

Angular 20 uses signal-based inputs. Route parameters are also automatically converted to signals via `withComponentInputBinding()`.

```typescript
// BEFORE Angular 17 — decorator-based inputs
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({ selector: 'app-product-card' })
export class ProductCardComponent implements OnChanges {
  @Input({ required: true }) productId!: string;
  @Input() price: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId']) {
      // React to productId change
      this.loadProduct(changes['productId'].currentValue);
    }
  }
}
```

```typescript
// AFTER Angular 20 — signal-based inputs
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-product-card',
  standalone: true,
  template: `
    <div class="card">
      <h3>{{ productId() }}</h3>
      <p>Price: {{ formattedPrice() }}</p>

      <!-- Route param injected as signal automatically (withComponentInputBinding) -->
    </div>
  `,
})
export class ProductCardComponent {
  // input() creates a required signal input — no @Input decorator
  productId = input.required<string>();

  // input() with default creates optional signal input
  price = input<number>(0);

  // computed() reacts to input changes automatically
  formattedPrice = computed(() =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(this.price()),
  );

  // No lifecycle hook needed — computed() reacts automatically
}
```

### Signal Inputs vs Decorator Inputs

| Feature          | `@Input()` (Angular ≤16)           | `input()` (Angular 20)       |
| ---------------- | ---------------------------------- | ---------------------------- |
| Type             | Decorator                          | Function returning Signal    |
| Reading value    | Direct property access `this.name` | Signal call `this.name()`    |
| Required inputs  | `@Input({ required: true })`       | `input.required<T>()`        |
| Change detection | Needs `ngOnChanges` or `OnPush`    | Computed signals — automatic |
| Template binding | `{{ name }}`                       | `{{ name() }}`               |
| Default value    | `@Input() name = 'default'`        | `input<string>('default')`   |
| Transform        | `@Input({ transform: fn })`        | `input({ transform: fn })`   |
| Zone-free        | No                                 | Yes                          |

### Signal Outputs — Replacing `@Output()`

```typescript
// BEFORE — EventEmitter-based output
import { Component, Output, EventEmitter } from '@angular/core';

@Component({ selector: 'app-search' })
export class SearchComponent {
  @Output() searched = new EventEmitter<string>();

  onSearch(query: string): void {
    this.searched.emit(query);
  }
}
```

```typescript
// AFTER Angular 20 — output()
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input
      type="text"
      #searchInput
      (keyup.enter)="onSearch(searchInput.value)"
      placeholder="Search products..."
    />
  `,
})
export class SearchComponent {
  // output() creates a typed event emitter
  searched = output<string>();

  onSearch(query: string): void {
    // emit() works exactly like EventEmitter.emit()
    this.searched.emit(query);
  }
}
```

### Two-Way Binding with `model()`

```typescript
// Angular 20 — model() creates a two-way binding signal
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-quantity-picker',
  standalone: true,
  template: `
    <div class="qty-picker">
      <button (click)="decrement()" [disabled]="value() <= 1">−</button>
      <span>{{ value() }}</span>
      <button (click)="increment()" [disabled]="value() >= max()">+</button>
    </div>
  `,
})
export class QuantityPickerComponent {
  // model() creates a signal that supports two-way binding
  // Parent binds with [(value)]="parentSignal"
  value = model<number>(1);
  max = input<number>(99);

  increment(): void {
    this.value.update((v) => v + 1);
  }

  decrement(): void {
    this.value.update((v) => v - 1);
  }
}

// Usage in parent:
// <app-quantity-picker [(value)]="cartQuantity" [max]="product.stock" />
```

### `linkedSignal()` — Writable Derived Signals (Angular 19+)

```typescript
// A signal that derives from another but can also be set independently
import { Component, signal, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-product-filter',
  standalone: true,
  template: `
    <select (change)="onCategoryChange($event)">
      @for (cat of categories(); track cat) {
        <option [value]="cat">{{ cat }}</option>
      }
    </select>

    <!-- Subcategory resets when category changes, but can also be set manually -->
    <select (change)="subcategory.set($any($event.target).value)">
      @for (sub of subcategories(); track sub) {
        <option [value]="sub">{{ sub }}</option>
      }
    </select>
  `,
})
export class ProductFilterComponent {
  categories = signal(['Clothing', 'Footwear', 'Accessories']);

  // selectedCategory is a writable signal
  selectedCategory = signal('Clothing');

  // subcategory DERIVES from selectedCategory (resets when category changes)
  // but can ALSO be written to independently (unlike computed())
  subcategory = linkedSignal(() => {
    // This runs whenever selectedCategory changes
    // Returns the default/reset value
    const cat = this.selectedCategory();
    return cat === 'Clothing'
      ? 'T-Shirts'
      : cat === 'Footwear'
        ? 'Sneakers'
        : 'Watches';
  });

  subcategories = signal(['T-Shirts', 'Jeans', 'Hoodies']);

  onCategoryChange(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
    // subcategory automatically resets via linkedSignal
  }
}
```

### `linkedSignal()` vs `computed()` vs `signal()`

| Feature                 | `signal()`        | `computed()`               | `linkedSignal()`                    |
| ----------------------- | ----------------- | -------------------------- | ----------------------------------- |
| Initial value           | Set manually      | Derived from other signals | Derived from other signals          |
| Writable                | ✅ Yes            | ❌ No                      | ✅ Yes                              |
| Reacts to deps          | ❌ No             | ✅ Yes                     | ✅ Yes                              |
| Resets when deps change | —                 | Always recomputes          | Resets to derived value             |
| Use case                | Independent state | Pure derivation            | State that resets on context change |

## The Resource API (Angular 20 Stable)

The `resource()` API was introduced in Angular 19 and became stable in Angular 20. It is the Signal-native way to load asynchronous data — replacing the pattern of dispatching NgRx effects or subscribing to Observables in components.

```typescript
// src/app/features/product-detail/product-detail.component.ts

import { Component, input, resource, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <!-- resource() gives us loading, error, and value signals automatically -->

    @if (productResource.isLoading()) {
      <div class="loading-skeleton">
        <div class="skeleton-image"></div>
        <div class="skeleton-text"></div>
      </div>
    }

    @if (productResource.error()) {
      <div class="error-state">
        <p>Failed to load product: {{ productResource.error() }}</p>
        <button (click)="productResource.reload()">Retry</button>
      </div>
    }

    @if (productResource.value(); as product) {
      <article class="product-detail">
        <h1>{{ product.name }}</h1>
        <p class="price">{{ product.price | currency: 'INR' }}</p>
        <p class="description">{{ product.description }}</p>

        @if (isLowStock()) {
          <p class="low-stock">Only {{ product.stock }} left!</p>
        }
      </article>
    }
  `,
})
export class ProductDetailComponent {
  // Route param as signal input (withComponentInputBinding)
  slug = input.required<string>();

  private http = inject(HttpClient);

  // resource() — loads async data, re-runs when slug() changes
  productResource = resource<Product, string>({
    // request() returns the parameters — resource re-runs when this changes
    request: () => this.slug(),

    // loader() performs the async operation
    loader: async ({ request: slug }) => {
      const products = await firstValueFrom(
        this.http.get<Product[]>(`http://localhost:3000/products?slug=${slug}`),
      );
      if (!products[0]) throw new Error('Product not found');
      return products[0];
    },
  });

  // Computed signals derived from resource value
  isLowStock = computed(() => {
    const product = this.productResource.value();
    return product ? product.stock > 0 && product.stock <= 5 : false;
  });
}

// Standalone inject() function — replaces constructor injection
function inject<T>(token: any): T {
  // Angular's inject() works outside constructors in Angular 20
  return (window as any).__ngContext__?.injector?.get(token);
}
```

### `resource()` API Reference

```typescript
import { resource, signal } from '@angular/core';

// Full resource() API
const userResource = resource<User, { id: string }>({
  // request(): returns the "request" parameters
  // Re-runs loader whenever request() returns a different value
  request: () => ({ id: this.userId() }),

  // loader(): performs the async operation
  // Receives { request, abortSignal } — use abortSignal to cancel fetch
  loader: async ({ request, abortSignal }) => {
    const response = await fetch(`/api/users/${request.id}`, {
      signal: abortSignal,
    });
    if (!response.ok) throw new Error('Failed to load user');
    return response.json() as Promise<User>;
  },
});

// Signals available on the resource:
userResource.value(); // User | undefined — the loaded data
userResource.isLoading(); // boolean — is a request in flight?
userResource.error(); // unknown — the last error, if any
userResource.status(); // 'idle' | 'loading' | 'loaded' | 'error' | 'refreshing'

// Methods on the resource:
userResource.reload(); // re-run the loader with the same request
userResource.set(user); // manually set the value (for optimistic updates)
userResource.update(fn); // update the value with a function (for optimistic updates)
```

### `rxResource()` — Resource with Observables

For teams migrating from Observable-based code, `rxResource()` accepts an Observable instead of a Promise:

```typescript
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

@Component({ ... })
export class ProductListComponent {
  private http = inject(HttpClient);

  category = input<string>('all');

  productsResource = rxResource({
    request: () => this.category(),

    // loader returns an Observable instead of a Promise
    loader: ({ request: category }) => {
      const params = category === 'all' ? '' : `?category=${category}`;
      return this.http.get<Product[]>(`/api/products${params}`);
    },
  });
}
```

### resource() vs Traditional Patterns

| Pattern                    | Code Complexity | Auto-cancellation | Loading State   | Error State     | Re-fetch on param change |
| -------------------------- | --------------- | ----------------- | --------------- | --------------- | ------------------------ |
| `subscribe()` in component | High            | Manual            | Manual          | Manual          | Manual                   |
| `async` pipe + Observable  | Medium          | Automatic         | Manual          | Manual          | Automatic                |
| NgRx Effects               | High            | Operator-based    | In store        | In store        | Via action dispatch      |
| `resource()`               | Low             | Automatic         | Built-in signal | Built-in signal | Automatic                |
| `rxResource()`             | Low             | Automatic         | Built-in signal | Built-in signal | Automatic                |

## Built-in Control Flow

Angular 17 introduced built-in control flow syntax. In Angular 20 it is the **only** supported approach for new code — `*ngIf`, `*ngFor`, and `*ngSwitch` are deprecated.

### `@if` — Replaces `*ngIf`

```typescript
// BEFORE — structural directive
@Component({
  template: `
    <div *ngIf="user; else noUser">
      Welcome, {{ user.name }}
    </div>
    <ng-template #noUser>
      <a routerLink="/login">Sign in</a>
    </ng-template>
  `
})

// AFTER Angular 20 — built-in @if
@Component({
  template: `
    @if (user()) {
      <div>Welcome, {{ user().name }}</div>
    } @else if (isLoading()) {
      <div class="spinner">Loading...</div>
    } @else {
      <a routerLink="/login">Sign in</a>
    }
  `
})
```

### `@for` — Replaces `*ngFor`

The new `@for` requires a `track` expression — this is now **mandatory**, not optional. Angular uses it for efficient DOM reconciliation.

```typescript
// BEFORE — *ngFor with optional trackBy
@Component({
  template: `
    <div *ngFor="let product of products; trackBy: trackById; let i = index">
      {{ i + 1 }}. {{ product.name }}
    </div>
    <div *ngIf="products.length === 0">No products</div>
  `
})
class OldComponent {
  trackById = (index: number, item: Product) => item.id;
}

// AFTER Angular 20 — @for with mandatory track and built-in @empty
@Component({
  template: `
    @for (product of products(); track product.id) {
      <div class="product-item">
        {{ $index + 1 }}. {{ product.name }}
        @if ($first) { <span class="badge">New!</span> }
        @if ($last) { <hr /> }
      </div>
    } @empty {
      <div class="empty-state">No products found</div>
    }
  `
})
```

### `@for` Template Variables

```typescript
@for (item of items(); track item.id) {
  // Built-in context variables — no more 'let i = index' syntax
  {{ $index }}    // 0-based index
  {{ $first }}    // true for the first item
  {{ $last }}     // true for the last item
  {{ $even }}     // true for even-indexed items
  {{ $odd }}      // true for odd-indexed items
  {{ $count }}    // total number of items in the collection
}
```

### `@switch` — Replaces `ngSwitch`

```typescript
// BEFORE — ngSwitch
@Component({
  template: `
    <div [ngSwitch]="order.status">
      <span *ngSwitchCase="'pending'">Awaiting confirmation</span>
      <span *ngSwitchCase="'shipped'">On the way</span>
      <span *ngSwitchCase="'delivered'">Delivered</span>
      <span *ngSwitchDefault>Unknown status</span>
    </div>
  `
})

// AFTER Angular 20 — @switch
@Component({
  template: `
    @switch (order().status) {
      @case ('pending') {
        <span class="status status--pending">Awaiting confirmation</span>
      }
      @case ('processing') {
        <span class="status status--processing">Being prepared</span>
      }
      @case ('shipped') {
        <span class="status status--shipped">On the way</span>
      }
      @case ('delivered') {
        <span class="status status--delivered">✓ Delivered</span>
      }
      @default {
        <span class="status">{{ order().status }}</span>
      }
    }
  `
})
```

### `@defer` — Lazy Loading Template Blocks

`@defer` is Angular 20's most powerful template feature. It lazy-loads a portion of the component tree — including the component class, its imports, and child components — until a trigger condition is met.

```typescript
@Component({
  selector: 'app-product-page',
  standalone: true,
  template: `
    <!-- Always renders immediately -->
    <app-product-hero [product]="product()" />

    <!-- Defers rendering until user scrolls to this section -->
    @defer (on viewport) {
      <app-product-reviews [productId]="product().id" />
    } @loading (minimum 300ms) {
      <div class="reviews-skeleton">Loading reviews...</div>
    } @error {
      <p>Reviews unavailable</p>
    } @placeholder {
      <!-- Shows before the defer trigger fires -->
      <div class="reviews-placeholder">Reviews will load as you scroll</div>
    }

    <!-- Defers until user hovers the related products section -->
    @defer (on hover(relatedSection)) {
      <app-related-products [categoryId]="product().category" />
    } @placeholder {
      <div #relatedSection class="related-placeholder">Related Products</div>
    }

    <!-- Defers for 2 seconds after page load (improves initial LCP) -->
    @defer (on timer(2000)) {
      <app-recently-viewed />
    }

    <!-- Defers based on a signal or expression -->
    @defer (when cartVisible()) {
      <app-mini-cart />
    }

    <!-- Prefetches the component on idle, renders when clicked -->
    @defer (on interaction(triggerEl); prefetch on idle) {
      <app-size-guide />
    } @placeholder {
      <button #triggerEl>View Size Guide</button>
    }
  `,
})
export class ProductPageComponent {
  product = input.required<Product>();
  cartVisible = signal(false);
}
```

### `@defer` Trigger Reference

| Trigger             | When it fires                                                       |
| ------------------- | ------------------------------------------------------------------- |
| `on idle`           | When the browser is idle (requestIdleCallback)                      |
| `on viewport`       | When the placeholder enters the viewport                            |
| `on interaction`    | When user clicks or focuses the placeholder or a referenced element |
| `on hover`          | When user hovers the placeholder or a referenced element            |
| `on immediate`      | Immediately after rendering — like no defer but still lazy loads JS |
| `on timer(n)`       | After `n` milliseconds                                              |
| `when expr`         | When a boolean expression becomes true                              |
| `prefetch on idle`  | Pre-downloads the JS chunk during idle time                         |
| `prefetch on hover` | Pre-downloads when user hovers — fast perceived load                |

### Control Flow Comparison

| Feature        | Old Syntax                       | Angular 20 Syntax                 | Key Difference                              |
| -------------- | -------------------------------- | --------------------------------- | ------------------------------------------- |
| Conditional    | `*ngIf="x"`                      | `@if (x)`                         | Else/else-if without `ng-template`          |
| List rendering | `*ngFor="let x of items"`        | `@for (x of items(); track x.id)` | `track` is required, `$index` etc. built-in |
| Empty state    | Separate `*ngIf="!items.length"` | `@empty` block on `@for`          | Co-located with the list                    |
| Switch         | `[ngSwitch]` + `*ngSwitchCase`   | `@switch` / `@case`               | Single block, no attribute directives       |
| Lazy loading   | `*ngIf` with lazy module         | `@defer`                          | Full chunk splitting, multiple triggers     |

## Standalone Components

In Angular 20, **every component is standalone by default**. NgModules are not generated for new projects and are not needed.

```typescript
// Angular 20 — standalone is the default, you don't even need to write it
// But it's good practice to be explicit in shared libraries

@Component({
  selector: 'app-product-card',
  // standalone: true is now the default — you may omit it
  imports: [
    // Import directly — no NgModule needed
    RouterLink,
    CurrencyPipe,
    DatePipe,
    // Other standalone components
    ProductRatingComponent,
    WishlistButtonComponent,
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  product = input.required<Product>();
  addedToCart = output<Product>();
}
```

### Importing Shared Utilities

```typescript
// Angular 20 — import utilities directly, no shared module
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  imports: [
    // Forms
    ReactiveFormsModule,

    // Router
    RouterLink,
    RouterLinkActive,

    // Common pipes — import only what you need
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    AsyncPipe,     // still needed when mixing Observables with templates
  ],
})
```

### NgModule vs Standalone Architecture

| Aspect                | NgModule Architecture                                          | Standalone Architecture                                      |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Component declaration | `declarations: [MyComponent]` in NgModule                      | Component is self-contained                                  |
| Imports scope         | NgModule's `imports` apply to all components in it             | Each component declares its own `imports`                    |
| Lazy loading          | `loadChildren: () => import('./module')`                       | `loadComponent: () => import('./component')`                 |
| Shared code           | `SharedModule` with re-exports                                 | Direct import of each piece                                  |
| Providers             | `providers` in NgModule                                        | `providers` in route or `providedIn: 'root'`                 |
| Testing               | `TestBed.configureTestingModule({ imports: [FeatureModule] })` | `TestBed.configureTestingModule({ imports: [MyComponent] })` |
| Boilerplate           | High                                                           | Low                                                          |

### Route Configuration

```typescript
// src/app/app.routes.ts

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // Lazy load standalone component — not a module
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'ShopForge — Home', // NEW: title in route config
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(
        (m) => m.CatalogComponent,
      ),
    title: 'All Products',
    // Resolve data before component activates — signal-aware in Angular 20
    resolve: {
      initialProducts: () => inject(ProductService).getAll(),
    },
  },
  {
    path: 'products/:slug',
    loadComponent: () =>
      import('./features/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
    // withComponentInputBinding() makes :slug available as @Input() / input()
    title: (route) => route.paramMap.get('slug') ?? 'Product',
  },
  {
    path: 'account',
    canActivate: [authGuard],
    children: [
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders.component'),
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/wishlist/wishlist.component'),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component'),
    title: 'Page Not Found',
  },
];
```

### Route Params as Signal Inputs

With `withComponentInputBinding()`, route parameters, query params, and resolved data automatically flow as `@Input()` / `input()`:

```typescript
// src/app/features/product-detail/product-detail.component.ts

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  template: `<h1>Product: {{ slug() }}</h1>`,
})
export class ProductDetailComponent {
  // :slug from the route URL automatically bound here
  slug = input.required<string>();

  // ?tab=reviews query parameter automatically bound here
  tab = input<string>('overview');

  // Resolved data from resolve: { initialProducts: ... } automatically bound here
  initialProducts = input<Product[]>([]);
}
```

### Functional Route Guards (Angular 20)

```typescript
// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Angular 20 guards are plain functions — no class, no inject decorator
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// Functional resolver
export const productResolver = (route: ActivatedRouteSnapshot) => {
  const productService = inject(ProductService);
  return productService.getBySlug(route.paramMap.get('slug')!);
};
```

### View Transitions (Angular 20)

```typescript
// Smooth page transitions using the CSS View Transitions API
provideRouter(
  routes,
  withViewTransitions({
    // Optional: skip transitions for certain navigations
    skipInitialTransition: true,
    // onViewTransitionCreated: hook to add custom animation logic
  }),
);
```

```scss
// styles.scss — animate the transition
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Angular applies view-transition-name automatically
:root {
  --transition-duration: 250ms;
}

::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-new(root) {
  animation: fade-in var(--transition-duration) ease-out;
}
```

### Reactive Forms — Signal Integration

```typescript
// src/app/features/auth/login/login.component.ts

import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="field" [class.invalid]="emailTouched && emailInvalid">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          autocomplete="email"
        />

        @if (emailTouched) {
          @if (form.get('email')?.hasError('required')) {
            <span class="error">Email is required.</span>
          } @else if (form.get('email')?.hasError('email')) {
            <span class="error">Please enter a valid email.</span>
          }
        }
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
        />

        @if (form.get('password')?.touched && form.get('password')?.invalid) {
          <span class="error">Password must be at least 8 characters.</span>
        }
      </div>

      <!-- Form-level error -->
      @if (authError()) {
        <div class="form-error">{{ authError() }}</div>
      }

      <button type="submit" [disabled]="form.invalid || isSubmitting()">
        @if (isSubmitting()) {
          Signing in...
        } @else {
          Sign In
        }
      </button>
    </form>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isSubmitting = signal(false);
  authError = signal<string | null>(null);

  get emailTouched() {
    return this.form.get('email')?.touched;
  }
  get emailInvalid() {
    return this.form.get('email')?.invalid;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.authError.set(null);

    try {
      const { email, password } = this.form.value;
      await this.auth.login(email!, password!);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.authError.set(err.message ?? 'Login failed. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
```

### `toSignal()` — Bridging Observables and Signals

Many Angular libraries (including NgRx) return Observables. `toSignal()` converts them to signals for use in templates without `async` pipe:

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { selectCartItemCount } from './store/cart/cart.selectors';

@Component({
  template: `
    <!-- Read as signal — no async pipe -->
    <span class="badge">{{ cartCount() }}</span>
  `,
})
export class HeaderComponent {
  private store = inject(Store);

  // toSignal() converts Observable → Signal
  // The Angular way to use NgRx selectors in Angular 20 templates
  cartCount = toSignal(this.store.select(selectCartItemCount), {
    initialValue: 0, // value before the Observable emits
  });
}
```

### `toObservable()` — Signals Back to Observables

```typescript
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({})
export class SearchComponent {
  searchQuery = signal('');

  // Convert signal to Observable for debounce/switchMap behavior
  private searchQuery$ = toObservable(this.searchQuery);

  searchResults = toSignal(
    this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) =>
        query.length > 2 ? this.productService.search(query) : of([]),
      ),
    ),
    { initialValue: [] },
  );
}
```

## HTTP and the `withFetch()` API

Angular 20 uses the native Fetch API for HTTP by default (via `withFetch()`). This enables HTTP/2 multiplexing, streaming responses, and works natively in service workers.

```typescript
// src/app/app.config.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()), // Enable the Fetch API backend
  ],
}).catch((err) => console.error(err));
```

```typescript
// src/app/core/services/product.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient); // inject() without constructor in Angular 20

  private baseUrl = 'http://localhost:3000';

  getAll(params?: {
    category?: string;
    query?: string;
  }): Observable<Product[]> {
    let httpParams = new HttpParams();
    if (params?.category)
      httpParams = httpParams.set('category', params.category);
    if (params?.query) httpParams = httpParams.set('name_like', params.query);

    return this.http.get<Product[]>(`${this.baseUrl}/products`, {
      params: httpParams,
    });
  }

  getBySlug(slug: string): Observable<Product | null> {
    return this.http
      .get<Product[]>(`${this.baseUrl}/products?slug=${slug}`)
      .pipe(map((products) => products[0] ?? null));
  }
}
```

### Functional HTTP Interceptors

```typescript
// src/app/core/interceptors/auth.interceptor.ts
// Angular 20: interceptors are functions, not classes

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    return next(
      req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      }),
    );
  }

  return next(req);
};
```

```typescript
// src/app/core/interceptors/error.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        inject(Router).navigate(['/login']);
      }
      return throwError(() => new Error(error.error?.message ?? error.message));
    }),
  );
};
```

### Class vs Functional Interceptors

| Aspect       | Class Interceptor (≤Angular 14)                    | Functional Interceptor (Angular 20)        |
| ------------ | -------------------------------------------------- | ------------------------------------------ |
| Definition   | `@Injectable() class X implements HttpInterceptor` | Plain function `(req, next) => Observable` |
| Registration | `HTTP_INTERCEPTORS` multi-provider                 | `withInterceptors([fn])`                   |
| `inject()`   | Constructor only                                   | Works at call site                         |
| Testing      | Needs TestBed + Injectable                         | Can test as a plain function               |
| Ordering     | Order of providers array                           | Order of `withInterceptors` array          |

## Change Detection in Angular 20

Change detection is how Angular decides when to re-render a component. Angular 20 introduces a new model that makes most of this invisible.

### The Three Change Detection Modes

```text
Angular 14 and earlier:
  Default     → Check entire component tree on every event
  OnPush      → Check only when @Input changes or async pipe emits

Angular 20:
  Zoneless    → Check only when a Signal changes (fine-grained)
  OnPush      → Still supported for hybrid migration
  Signals     → Recommended: components auto-update when signals change
```

### Default Change Detection (Angular ≤16)

```typescript
// Angular 14 — Default CD: checks everything on every event
// This component re-renders whenever ANY event happens in the app

@Component({
  selector: 'app-product-price',
  template: `<span>{{ formatPrice(price) }}</span>`,
})
export class ProductPriceComponent {
  @Input() price: number = 0;

  formatPrice(price: number): string {
    return `₹${price.toLocaleString('en-IN')}`;
  }
  // formatPrice() is called on EVERY change detection cycle
  // Even when another component's button is clicked
}
```

### OnPush Change Detection (Angular ≤19 optimization)

```typescript
// Angular 17-19 — OnPush: only checks when @Input changes
// Better performance but still requires careful management

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-product-price',
  changeDetection: ChangeDetectionStrategy.OnPush, // explicit opt-in
  template: `<span>{{ price | currency: 'INR' }}</span>`,
})
export class ProductPriceComponent {
  @Input() price: number = 0;
  // Now only re-renders when price input changes (new reference)
}
```

### Signals Change Detection (Angular 20 — recommended)

```typescript
// Angular 20 — Signal-driven: only the specific component that reads
// a changed signal re-renders. Fine-grained, automatic.

import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-product-price',
  standalone: true,
  // With zoneless, OnPush is effectively always on
  // You can still add it explicitly for clarity
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ formattedPrice() }}</span>`,
})
export class ProductPriceComponent {
  // Signal input — component re-renders only when price() changes
  price = input<number>(0);

  formattedPrice = computed(() =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(this.price()),
  );
  // computed() is memoized — only recalculates when price() changes
  // formattedPrice() is NOT recalculated on unrelated changes elsewhere
}
```

### Change Detection Strategy Comparison

| Mode               | Re-renders when                      | Performance   | Setup                                        |
| ------------------ | ------------------------------------ | ------------- | -------------------------------------------- |
| Default (Zone.js)  | Any browser event                    | Poor at scale | Automatic                                    |
| OnPush (Zone.js)   | `@Input` changes, `async` pipe emits | Good          | Manual `ChangeDetectionStrategy.OnPush`      |
| Signals (Zoneless) | Specific signal changes              | Excellent     | `provideZonelessChangeDetection()` + Signals |

## `inject()` Function — Replacing Constructor Injection

Angular 20 promotes the `inject()` function over constructor injection. It works anywhere in the injection context: component class fields, standalone functions, guards, resolvers, and effects.

```typescript
// BEFORE — constructor injection
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
  ) {}
}

// AFTER Angular 20 — inject() in class fields
@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  // No constructor needed at all
}
```

```typescript
// inject() works in standalone functions and guards
export const authGuard: CanActivateFn = () => {
  // inject() works here because guards run in injection context
  const auth = inject(AuthService);
  return auth.isAuthenticated();
};

// inject() in route resolvers
export const productResolver: ResolveFn<Product> = (route) => {
  const service = inject(ProductService);
  return service.getBySlug(route.paramMap.get('slug')!);
};
```

### Environment Injectors — Programmatic DI

```typescript
// Angular 20 — create scoped injectors programmatically
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';

const scopedInjector = createEnvironmentInjector(
  [
    { provide: ProductService, useClass: CachedProductService },
    { provide: API_URL, useValue: 'https://api.example.com' },
  ],
  parentInjector,
);
```

### Injection Token Best Practices

```typescript
// src/app/core/tokens/api-config.token.ts

import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

// Type-safe injection token
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  // Can provide a factory default
  providedIn: 'root',
  factory: () => ({
    baseUrl: 'http://localhost:3000',
    timeout: 10000,
    retryAttempts: 3,
  }),
});

// Usage
@Injectable({ providedIn: 'root' })
export class ProductService {
  private config = inject(API_CONFIG);

  getAll() {
    return this.http.get(`${this.config.baseUrl}/products`);
  }
}
```

## Server-Side Rendering (Angular Universal / SSR)

Angular 20 includes SSR as a first-class feature generated with `--ssr`. The hydration system is significantly improved.

### Setting Up SSR

```bash
# Create project with SSR from the start
ng new my-app --ssr

# Or add SSR to an existing project
ng add @angular/ssr
```

### Hydration — Full, Partial, and Incremental

Angular 20 supports three hydration modes:

```typescript
// src/app/app.config.ts

import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    // Full hydration — hydrates the entire app
    provideClientHydration(),

    // Event replay — captures and replays user events that happened
    // before hydration completed (prevents lost clicks)
    provideClientHydration(withEventReplay()),

    // Incremental hydration (Angular 19+) — hydrates only the parts the user needs
    // Combined with @defer, this gives maximum performance
    provideClientHydration(
      withIncrementalHydration(), // hydrate @defer blocks on demand
      withEventReplay(), // don't lose any clicks
      withHttpTransferCacheOptions({
        // reuse SSR HTTP responses — no double fetches
        includePostRequests: false,
      }),
    ),
  ],
};
```

### `@defer` with Incremental Hydration

This combination is the highest-performance Angular 20 pattern:

```typescript
@Component({
  template: `
    <!-- The server renders a placeholder -->
    <!-- The client hydrates only when the user scrolls to it -->
    <!-- JS for the component is only loaded when needed -->
    @defer (hydrate on viewport) {
      <app-product-reviews [productId]="product().id" />
    } @placeholder {
      <div class="reviews-placeholder" aria-hidden="true">
        <!-- Static placeholder visible on SSR and before hydration -->
        <h2>Customer Reviews</h2>
        <p>Loading reviews...</p>
      </div>
    }
  `
})
```

### `isPlatformBrowser()` — Server-Safe Code

```typescript
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({})
export class AnalyticsComponent {
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Only run browser-specific code on the client
    if (isPlatformBrowser(this.platformId)) {
      // Safe to use localStorage, window, document
      const userId = localStorage.getItem('user_id');
      this.trackPageView(userId);
    }
  }
}
```

### Directive Composition API

Angular 15+ allows components to apply multiple directives through `hostDirectives`:

```typescript
// src/app/shared/directives/tooltip.directive.ts

import { Directive, input, HostListener, signal } from '@angular/core';

@Directive({
  selector: '[tooltip]',
  standalone: true,
})
export class TooltipDirective {
  tooltip = input.required<string>();
  tooltipVisible = signal(false);

  @HostListener('mouseenter')
  show() {
    this.tooltipVisible.set(true);
  }

  @HostListener('mouseleave')
  hide() {
    this.tooltipVisible.set(false);
  }
}
```

```typescript
// src/app/shared/directives/click-analytics.directive.ts

import { Directive, input, HostListener, inject } from '@angular/core';
import { AnalyticsService } from '../services/analytics.service';

@Directive({
  selector: '[trackClick]',
  standalone: true,
})
export class ClickAnalyticsDirective {
  trackClick = input.required<string>(); // event name

  private analytics = inject(AnalyticsService);

  @HostListener('click')
  onClick() {
    this.analytics.track(this.trackClick());
  }
}
```

```typescript
// Compose multiple directives into one component
@Component({
  selector: 'app-product-button',
  standalone: true,

  // Apply both directives to this component's host element
  hostDirectives: [
    {
      directive: TooltipDirective,
      inputs: ['tooltip'], // expose tooltip input on the component
    },
    {
      directive: ClickAnalyticsDirective,
      inputs: ['trackClick'], // expose trackClick input on the component
    },
  ],
  template: `<button class="product-btn"><ng-content /></button>`,
})
export class ProductButtonComponent {}

// Usage — one element, two directives, no clutter
// <app-product-button tooltip="Add to Cart" trackClick="add_to_cart_clicked">
//   Add to Cart
// </app-product-button>
```

## Angular Pipes

Pipes are unchanged in Angular 20 but are now standalone by default and can use `inject()`.

```typescript
// src/app/shared/pipes/price.pipe.ts

import { Pipe, PipeTransform, inject, LOCALE_ID } from '@angular/core';

@Pipe({
  name: 'shopPrice',
  standalone: true,
  pure: true, // pure = only recalculates when input changes (default)
})
export class ShopPricePipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(
    value: number,
    currency: string = 'INR',
    display: 'symbol' | 'code' = 'symbol',
  ): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency,
      currencyDisplay: display,
    }).format(value / 100); // convert paise to rupees
  }
}

// Usage
// {{ product.price | shopPrice }}          → ₹1,299
// {{ product.price | shopPrice:'USD' }}    → $12.99
```

### Component Testing with Signals

```typescript
// src/app/features/catalog/catalog.component.spec.ts

import { TestBed } from '@angular/core/testing';
import { CatalogComponent } from './catalog.component';
import { ProductService } from '../../core/services/product.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('CatalogComponent', () => {
  let component: CatalogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogComponent], // import the standalone component directly
      providers: [
        provideRouter([]), // router needed for RouterLink
        provideHttpClientTesting(), // mock HTTP for tests
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading skeleton when loading', () => {
    // Signals are directly testable
    // If component uses a loading signal internally:
    // (component as any).loading.set(true);
    // fixture.detectChanges();
    // expect(fixture.nativeElement.querySelector('.skeleton')).toBeTruthy();
  });
});
```

### Testing Signals Directly

```typescript
// Signals are synchronous and easily testable without TestBed

import { signal, computed, effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';

describe('Signal logic', () => {
  it('should compute derived values correctly', () => {
    TestBed.runInInjectionContext(() => {
      const count = signal(5);
      const double = computed(() => count() * 2);

      expect(double()).toBe(10);

      count.set(10);
      expect(double()).toBe(20);
    });
  });

  it('should run effects when signals change', () => {
    TestBed.runInInjectionContext(() => {
      const name = signal('Alice');
      const calls: string[] = [];

      effect(() => {
        calls.push(name());
      });

      TestBed.flushEffects(); // flush effects synchronously
      expect(calls).toEqual(['Alice']);

      name.set('Bob');
      TestBed.flushEffects();
      expect(calls).toEqual(['Alice', 'Bob']);
    });
  });
});
```

## Complete Component Example

A full, production-ready catalog component combining every Angular 20 feature.

```typescript
// src/app/features/catalog/catalog.component.ts

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { CatalogActions } from '../../store/catalog/catalog.actions';
import { CartActions } from '../../store/cart/cart.actions';
import { WishlistActions } from '../../store/wishlist/wishlist.actions';
import {
  selectCatalogViewModel,
  selectIsInWishlist,
} from '../../store/selectors.barrel';
import { NotificationsStore } from '../../store/notifications/notifications.signal-store';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="catalog-hero">
      <h1 class="catalog-title">The Collection</h1>
      <p class="catalog-subtitle">{{ vm().total }} products</p>
    </div>

    <div class="catalog-layout">
      <!-- Sidebar Filters -->
      <aside class="catalog-sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar-header">
          <h2>Filters</h2>
          @if (vm().hasFilters) {
            <button (click)="clearFilters()">Clear all</button>
          }
        </div>

        <!-- Search -->
        <div class="filter-section">
          <label>Search</label>
          <input
            type="text"
            [value]="vm().filters.query"
            (input)="onSearch($event)"
            placeholder="Search products..."
          />
        </div>

        <!-- Category Filters -->
        <div class="filter-section">
          <label>Category</label>
          @for (cat of vm().categories; track cat) {
            <label class="radio-label">
              <input
                type="radio"
                name="category"
                [value]="cat"
                [checked]="vm().filters.category === cat"
                (change)="setCategory(cat)"
              />
              {{ cat }}
            </label>
          } @empty {
            <p>No categories available</p>
          }
        </div>

        <!-- In Stock Toggle -->
        <label class="toggle-label">
          <input
            type="checkbox"
            [checked]="vm().filters.inStockOnly"
            (change)="toggleInStock()"
          />
          In stock only
        </label>
      </aside>

      <!-- Product Grid -->
      <section class="catalog-content">
        <!-- Toolbar -->
        <div class="toolbar">
          <select [value]="vm().filters.sortBy" (change)="onSort($event)">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button class="filter-toggle" (click)="sidebarOpen.update(v => !v)">
            Filters
          </button>
        </div>

        <!-- Loading State — skeleton grid -->
        @if (vm().loading) {
          <div class="product-grid">
            @for (i of skeletons; track i) {
              <div class="product-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
              </div>
            }
          </div>
        }

        <!-- Error State -->
        @if (vm().error && !vm().loading) {
          <div class="error-state">
            <p>{{ vm().error }}</p>
            <button (click)="reload()">Try Again</button>
          </div>
        }

        <!-- Product List -->
        @if (!vm().loading && !vm().error) {
          @if (vm().isEmpty) {
            <div class="empty-state">
              <h3>No products found</h3>
              <button (click)="clearFilters()">Clear Filters</button>
            </div>
          } @else {
            <div class="product-grid">
              @for (product of vm().products; track product.id) {
                <article class="product-card">
                  <a [routerLink]="['/products', product.slug]">
                    <div class="product-card__image-wrap">
                      <img
                        [src]="product.imageUrls[0]"
                        [alt]="product.name"
                        loading="lazy"
                      />

                      <!-- Discount badge -->
                      @if (product.compareAtPrice) {
                        <span class="badge">
                          −{{
                            calcDiscount(product.price, product.compareAtPrice)
                          }}%
                        </span>
                      }

                      <!-- Sold out overlay -->
                      @if (product.stock === 0) {
                        <div class="sold-out">Sold Out</div>
                      }
                    </div>
                  </a>

                  <!-- Wishlist button -->
                  <button
                    class="wishlist-btn"
                    [class.active]="isWishlisted(product.id)"
                    (click)="toggleWishlist(product)"
                  >
                    ♡
                  </button>

                  <div class="product-card__info">
                    <p class="category">{{ product.category }}</p>
                    <h3>
                      <a [routerLink]="['/products', product.slug]">{{
                        product.name
                      }}</a>
                    </h3>

                    <!-- Stock status -->
                    @switch (true) {
                      @case (product.stock === 0) {
                        <span class="stock-badge out">Sold Out</span>
                      }
                      @case (product.stock <= 5) {
                        <span class="stock-badge low"
                          >Only {{ product.stock }} left</span
                        >
                      }
                      @default {
                        <span class="stock-badge in">In Stock</span>
                      }
                    }

                    <div class="price">
                      <span class="current">
                        {{
                          product.price / 100
                            | currency: 'INR' : 'symbol' : '1.0-0'
                        }}
                      </span>
                      @if (product.compareAtPrice) {
                        <span class="compare">
                          {{
                            product.compareAtPrice / 100
                              | currency: 'INR' : 'symbol' : '1.0-0'
                          }}
                        </span>
                      }
                    </div>
                  </div>

                  <button
                    class="add-to-cart"
                    [disabled]="product.stock === 0"
                    (click)="addToCart(product)"
                  >
                    @if (product.stock === 0) {
                      Sold Out
                    } @else {
                      Add to Cart
                    }
                  </button>
                </article>
              }
            </div>

            <!-- Pagination -->
            @if (vm().totalPages > 1) {
              <nav class="pagination">
                <button
                  [disabled]="vm().pagination.page === 1"
                  (click)="setPage(vm().pagination.page - 1)"
                >
                  ←
                </button>

                @for (
                  page of getPages(vm().pagination.page, vm().totalPages);
                  track page
                ) {
                  @if (page === -1) {
                    <span>…</span>
                  } @else {
                    <button
                      [class.active]="page === vm().pagination.page"
                      (click)="setPage(page)"
                    >
                      {{ page }}
                    </button>
                  }
                }

                <button
                  [disabled]="vm().pagination.page === vm().totalPages"
                  (click)="setPage(vm().pagination.page + 1)"
                >
                  →
                </button>
              </nav>
            }
          }
        }

        <!-- @defer: Load reviews section lazily when scrolled into view -->
        @defer (on viewport; prefetch on idle) {
          <section class="catalog-featured-review">
            <app-featured-review />
          </section>
        } @placeholder {
          <div class="featured-review-placeholder"></div>
        }
      </section>
    </div>
  `,
})
export class CatalogComponent implements OnInit {
  private store = inject(Store);
  private notifications = inject(NotificationsStore);

  // NgRx store.selectSignal() — returns a Signal directly
  vm = this.store.selectSignal(selectCatalogViewModel);

  // Local UI state
  sidebarOpen = signal(false);
  skeletons = Array.from({ length: 12 }, (_, i) => i);

  ngOnInit(): void {
    this.store.dispatch(CatalogActions.loadProducts({}));
  }

  reload(): void {
    this.store.dispatch(CatalogActions.loadProducts({}));
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.store.dispatch(CatalogActions.setSearchQuery({ query }));
  }

  setCategory(category: string | null): void {
    this.store.dispatch(CatalogActions.setCategoryFilter({ category }));
  }

  toggleInStock(): void {
    this.store.dispatch(CatalogActions.toggleInStockOnly());
  }

  onSort(event: Event): void {
    const sortBy = (event.target as HTMLSelectElement).value as any;
    this.store.dispatch(CatalogActions.setSort({ sortBy }));
  }

  clearFilters(): void {
    this.store.dispatch(CatalogActions.clearFilters());
  }

  setPage(page: number): void {
    this.store.dispatch(CatalogActions.setPage({ page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isWishlisted(productId: string): boolean {
    return this.store.selectSignal(selectIsInWishlist(productId))();
  }

  toggleWishlist(product: Product): void {
    if (this.isWishlisted(product.id)) {
      this.store.dispatch(
        WishlistActions.removeFromWishlist({ productId: product.id }),
      );
    } else {
      this.store.dispatch(WishlistActions.addToWishlist({ product }));
      this.notifications.success(
        'Wishlist',
        `${product.name} saved to wishlist.`,
      );
    }
  }

  addToCart(product: Product): void {
    this.store.dispatch(
      CartActions.addItem({
        item: {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrls[0],
          maxStock: product.stock,
        },
      }),
    );
    this.notifications.success('Cart', `${product.name} added to your cart.`);
  }

  calcDiscount(price: number, compareAt: number): number {
    return Math.round(((compareAt - price) / compareAt) * 100);
  }

  getPages(current: number, total: number): number[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }
}
```

## Migration Guide: Automated Migration

Angular provides schematics for most migrations:

```bash
# Update Angular to version 20
ng update @angular/core@20 @angular/cli@20

# Run the schematics that migrate structural directives to control flow
ng generate @angular/core:control-flow-migration

# Migrate to standalone components
ng generate @angular/core:standalone

# Migrate to signal inputs/outputs
ng generate @angular/core:signal-input-migration
ng generate @angular/core:output-migration
```

### Migration: `*ngIf` to `@if`

```typescript
// BEFORE
@Component({
  imports: [NgIf, AsyncPipe],
  template: `
    <div *ngIf="product$ | async as product; else loading">
      {{ product.name }}
    </div>
    <ng-template #loading>Loading...</ng-template>
  `
})

// AFTER
@Component({
  template: `
    @if (product(); as product) {
      <div>{{ product.name }}</div>
    } @else {
      <div>Loading...</div>
    }
  `
})
```

### Migration: `*ngFor` to `@for`

```typescript
// BEFORE
@Component({
  imports: [NgFor],
  template: `
    <div *ngFor="let item of items; trackBy: trackById; let i = index; let last = last">
      {{ i }}: {{ item.name }}
      <hr *ngIf="last" />
    </div>
  `
})
class OldComponent {
  trackById = (i: number, item: { id: string }) => item.id;
}

// AFTER
@Component({
  template: `
    @for (item of items(); track item.id) {
      <div>{{ $index }}: {{ item.name }}</div>
      @if ($last) { <hr /> }
    } @empty {
      <p>No items</p>
    }
  `
})
```

### Migration: `@Input()` / `@Output()` to `input()` / `output()`

```typescript
// BEFORE
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({ selector: 'app-product' })
class OldProduct implements OnChanges {
  @Input({ required: true }) productId!: string;
  @Input() showDetails: boolean = false;
  @Output() addedToCart = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId']) {
      this.loadProduct(this.productId);
    }
  }
}

// AFTER
import { Component, input, output, effect } from '@angular/core';

@Component({ selector: 'app-product', standalone: true })
class NewProduct {
  productId = input.required<string>();
  showDetails = input<boolean>(false);
  addedToCart = output<string>();

  constructor() {
    // effect() automatically reruns when productId() changes
    effect(() => {
      this.loadProduct(this.productId());
    });
  }
}
```

### Migration: NgModule to Standalone

```typescript
// BEFORE — NgModule based feature
@NgModule({
  declarations: [ProductListComponent, ProductCardComponent],
  imports: [CommonModule, RouterModule, HttpClientModule, SharedModule],
  exports: [ProductListComponent],
})
export class ProductsModule {}

// After running `ng generate @angular/core:standalone`
// Each component becomes standalone — no module needed

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe, AsyncPipe, ProductCardComponent],
  // All dependencies explicit in each component's imports
})
export class ProductListComponent {}
```

### Migration Complexity Guide

| Migration                      | Complexity | Automated? | Risk                                   |
| ------------------------------ | ---------- | ---------- | -------------------------------------- |
| `*ngIf` → `@if`                | Low        | ✅ Full    | None — semantic equivalent             |
| `*ngFor` → `@for`              | Low        | ✅ Full    | Must add `track` expression            |
| `*ngSwitch` → `@switch`        | Low        | ✅ Full    | None                                   |
| NgModule → Standalone          | Medium     | ✅ Partial | Test each component after              |
| `@Input()` → `input()`         | Medium     | ✅ Partial | Lifecycle hook refactoring             |
| `@Output()` → `output()`       | Low        | ✅ Full    | None                                   |
| Zone.js → Zoneless             | High       | ❌ Manual  | Requires all async code to use signals |
| Observable templates → Signals | High       | ❌ Manual  | Architectural shift                    |
| NgRx v14 → v19                 | Medium     | ✅ Partial | Test store thoroughly                  |

### Bundle Optimization

```typescript
// angular.json — Angular 20 build optimizations
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular/build:application",   // NEW: uses esbuild (not webpack)
          "options": {
            "optimization": {
              "scripts": true,
              "styles": {
                "minify": true,
                "inlineCritical": true    // inline critical CSS
              },
              "fonts": true
            },
            "outputHashing": "all",
            "extractLicenses": false,
            "budgets": [
              {
                "type": "initial",
                "maximumWarning": "500kB",
                "maximumError": "1MB"
              },
              {
                "type": "anyComponentStyle",
                "maximumWarning": "4kB",
                "maximumError": "8kB"
              }
            ]
          }
        }
      }
    }
  }
}
```

### Build Performance: Angular 14 vs Angular 20

| Metric                | Angular 14 (Webpack) | Angular 20 (esbuild)  | Improvement  |
| --------------------- | -------------------- | --------------------- | ------------ |
| Cold build            | ~45s (medium app)    | ~8s                   | ~5× faster   |
| Incremental rebuild   | ~3–8s                | ~100–300ms            | ~20× faster  |
| Bundle size (initial) | ~350kb               | ~180kb                | ~50% smaller |
| Zone.js overhead      | +35kb                | 0kb (zoneless)        | Eliminated   |
| Test execution        | ~60s                 | ~20s (Vitest support) | ~3× faster   |

### Core Web Vitals Impact

Angular 20 features directly improve Core Web Vitals:

| Feature                | CWV Impact                                                   |
| ---------------------- | ------------------------------------------------------------ |
| `@defer (on viewport)` | Improves **LCP** — critical path has less JS                 |
| Incremental hydration  | Improves **TBT** / **FID** — less JS to parse on load        |
| `withEventReplay()`    | Improves **CLS** — no layout shifts from missed interactions |
| `withFetch()`          | Improves **TTFB** — HTTP/2 multiplexing                      |
| `inlineCritical` CSS   | Improves **FCP** — no render-blocking stylesheets            |
| Signal-based CD        | Improves **TBT** — less CPU work per frame                   |

## Angular DevTools

Angular DevTools is the official browser extension for debugging Angular 20 applications.

```
Install from Chrome Web Store: "Angular DevTools"
https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh
```

**Key panels in Angular 20:**

The **Component Tree** panel now shows signal values alongside component inputs and outputs. You can see the current value of every signal, when it last updated, and which components depend on it.

The **Profiler** panel records change detection cycles. In Angular 20 with zoneless, you should see far fewer CD cycles than in Zone.js-based apps — only components whose signals changed should show up.

The **Injector Tree** panel visualises the dependency injection hierarchy — useful for diagnosing `NullInjectorError` issues.

### New APIs in Angular 20

| API                                | Package                      | Purpose                                     |
| ---------------------------------- | ---------------------------- | ------------------------------------------- |
| `input()`                          | `@angular/core`              | Signal-based component input                |
| `output()`                         | `@angular/core`              | Signal-based component output               |
| `model()`                          | `@angular/core`              | Two-way binding signal                      |
| `linkedSignal()`                   | `@angular/core`              | Writable derived signal                     |
| `resource()`                       | `@angular/core`              | Async data loading with signals             |
| `rxResource()`                     | `@angular/core/rxjs-interop` | resource() with Observable loader           |
| `toSignal()`                       | `@angular/core/rxjs-interop` | Observable → Signal                         |
| `toObservable()`                   | `@angular/core/rxjs-interop` | Signal → Observable                         |
| `provideZonelessChangeDetection()` | `@angular/core`              | Opt into zoneless CD                        |
| `withComponentInputBinding()`      | `@angular/router`            | Route params as inputs                      |
| `withViewTransitions()`            | `@angular/router`            | CSS View Transitions                        |
| `withIncrementalHydration()`       | `@angular/platform-browser`  | Hydrate `@defer` blocks on demand           |
| `withEventReplay()`                | `@angular/platform-browser`  | Replay events during hydration              |
| `withFetch()`                      | `@angular/common/http`       | Use Fetch API for HTTP                      |
| `inject()`                         | `@angular/core`              | Functional DI anywhere in injection context |
| `@defer`                           | Template syntax              | Lazy-load template blocks                   |
| `@if` / `@for` / `@switch`         | Template syntax              | Built-in control flow                       |

### Deprecated and Removed in Angular 20

| Feature                           | Status                       | Replacement                        |
| --------------------------------- | ---------------------------- | ---------------------------------- |
| `*ngIf`                           | Deprecated                   | `@if`                              |
| `*ngFor`                          | Deprecated                   | `@for`                             |
| `ngSwitch` / `*ngSwitchCase`      | Deprecated                   | `@switch` / `@case`                |
| `NgIf` / `NgFor` directives       | Deprecated                   | Built-in control flow              |
| `NgModule` for new projects       | Not recommended              | Standalone components              |
| Constructor injection (class)     | Not recommended              | `inject()` field injection         |
| `@Input()` decorator              | Not recommended for new code | `input()`                          |
| `@Output()` + `EventEmitter`      | Not recommended for new code | `output()`                         |
| Zone.js                           | Optional                     | `provideZonelessChangeDetection()` |
| `APP_INITIALIZER` (in some cases) | Still works                  | `effect()` with `resource()`       |

## The Angular 20 Mental Model

Angular 20 is best understood as three layers working together:

**Layer 1 — Reactivity**: Signals propagate change notifications. Every piece of state that changes the UI is a signal. Computed signals derive from other signals. Effects run side effects.

**Layer 2 — Structure**: Standalone components with explicit imports. Route-level lazy loading. `@defer` for sub-component lazy loading. No NgModules.

**Layer 3 — Performance**: Zoneless change detection updates only what changed. esbuild produces small, fast bundles. Incremental hydration delivers SSR pages with minimal client-side JS.

When all three layers work together, you get applications that are fast to build, fast to run, and straightforward to understand — a significant evolution from the NgModule, Zone.js, and `async`-pipe-heavy Angular of 2020.
