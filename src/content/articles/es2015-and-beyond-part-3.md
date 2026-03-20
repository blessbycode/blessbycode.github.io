---
title: 'ES2015 and Beyond - Part 3'
published: 2026-01-18
draft: false
description: 'Third installment of the 3-part series about ES2015 and Beyond.'
toc: true
series: 'ES2015 and next'
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

## ES2021 (ES12) — Ergonomic String and Array Improvements

## String.replaceAll

```javascript
const text = 'The cat sat on the mat with the cat';

// Old way: regex with /g flag
text.replace(/cat/g, 'dog'); // 'The dog sat on the mat with the dog'

// New way: replaceAll
text.replaceAll('cat', 'dog'); // 'The dog sat on the mat with the dog'

// Works with special regex characters in the search string too
// (replace required escaping; replaceAll treats the string literally)
'a+b+c'.replaceAll('+', '-'); // 'a-b-c' (no regex escaping needed)
```

## Numeric Separators

```javascript
// Make large numbers readable with underscores
const million = 1_000_000; // much clearer than 1000000
const billion = 1_000_000_000;
const hex = 0xff_ec_d1_12; // works in hex
const binary = 0b1010_0001_1000; // works in binary
const octal = 0o755_644; // works in octal
const pi = 3.141_592_653_589; // works in decimals

typeof 1_000_000; // 'number' — it's just regular number syntax
```

## Promise.any and AggregateError

```javascript
// Promise.any: resolves with FIRST fulfilled, rejects only if ALL reject
const servers = ['server1.com', 'server2.com', 'server3.com'];

// Try all three servers, use whichever responds first successfully
Promise.any(
  servers.map((server) =>
    fetch(`https://${server}/api/data`).then((r) => r.json()),
  ),
)
  .then((data) => console.log('Got data from fastest server:', data))
  .catch((error) => {
    // Only reaches here if ALL servers fail
    console.error(error instanceof AggregateError); // true
    console.error(error.errors); // array of all individual errors
  });
```

## ES2022 (ES13) — Classes Get Major Upgrades

## Class Fields and Private Methods

```javascript
class ShoppingCart {
  // Public class field (instance property set in constructor order)
  currency = 'USD';

  // Static class field
  static defaultTaxRate = 0.1;

  // Private instance field (# prefix — truly private in the language)
  #items = [];
  #discount = 0;

  // Private method
  #calculateSubtotal() {
    return this.#items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  addItem(item) {
    this.#items.push(item);
    return this; // chainable
  }

  applyDiscount(percent) {
    this.#discount = percent / 100;
    return this;
  }

  get total() {
    const subtotal = this.#calculateSubtotal();
    const afterDiscount = subtotal * (1 - this.#discount);
    const tax = afterDiscount * ShoppingCart.defaultTaxRate;
    return afterDiscount + tax;
  }

  // Static private method
  static #formatPrice(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  toString() {
    return `Total: ${ShoppingCart.#formatPrice(this.total)}`;
  }
}

const cart = new ShoppingCart();
cart
  .addItem({ name: 'Book', price: 25, quantity: 2 })
  .addItem({ name: 'Pen', price: 3, quantity: 5 })
  .applyDiscount(10);

console.log(cart.total); // number
console.log(cart.#items); // SyntaxError — truly private ✅

// Check if a private field exists
console.log(#items in cart); // true
```

## Array.at — Negative Indexing

```javascript
const fruits = ['apple', 'banana', 'cherry', 'date'];

// Old way to get the last element
fruits[fruits.length - 1]; // 'date' — verbose

// New way: .at() with negative indices
fruits.at(-1); // 'date'
fruits.at(-2); // 'cherry'
fruits.at(0); // 'apple' — positive indices still work
fruits.at(1); // 'banana'

// Works on strings and TypedArrays too
'hello'.at(-1); // 'o'
'hello'.at(-2); // 'l'
```

## Object.hasOwn — Reliable Property Check

```javascript
// Old way: hasOwnProperty — can be overridden, verbose, fails on null-prototype objects
obj.hasOwnProperty('key'); // fragile
Object.prototype.hasOwnProperty.call(obj, 'key'); // safe but verbose

// New way: Object.hasOwn — always safe
const user = { name: 'Alice', age: null };
Object.hasOwn(user, 'name'); // true
Object.hasOwn(user, 'age'); // true (the key exists, even though value is null)
Object.hasOwn(user, 'email'); // false

// Works with null-prototype objects (created with Object.create(null))
const bare = Object.create(null);
bare.key = 'value';
Object.hasOwn(bare, 'key'); // true ✅
bare.hasOwnProperty('key'); // TypeError — no prototype! ❌
```

## Error.cause — Structured Error Context

```javascript
// Chain errors to preserve context through layers
async function fetchUserOrders(userId) {
  try {
    const response = await fetch(`/api/users/${userId}/orders`);
    return await response.json();
  } catch (error) {
    // Wrap with context — original error is preserved in .cause
    throw new Error(`Failed to fetch orders for user ${userId}`, {
      cause: error,
    });
  }
}

try {
  await fetchUserOrders(42);
} catch (error) {
  console.error(error.message); // 'Failed to fetch orders for user 42'
  console.error(error.cause.message); // original network error
}
```

## Top-Level await

```javascript
// Before: could only use await inside async functions
// Now: await at the module's top level (no wrapping async function needed)

// config.js — module level await
const config = await fetch('/api/config').then((r) => r.json());
export default config;

// database.js
const db = await connectToDatabase();
export const query = db.query.bind(db);

// main.js
import config from './config.js'; // config is already resolved when this runs
```

:::note
Top-level await only works in ES modules (files with `type: "module"` or `.mjs` extension). It's also contagious — any module that imports a module using top-level await will itself be async. The entire import graph must finish before the dependent module runs.
:::

## ES2023 (ES14) — Array and Object Refinements

## Array findLast and findLastIndex

```javascript
const events = [
  { id: 1, type: 'login', date: '2025-01-01' },
  { id: 2, type: 'purchase', date: '2025-01-15' },
  { id: 3, type: 'login', date: '2025-02-01' },
  { id: 4, type: 'logout', date: '2025-02-02' },
];

// Find LAST occurrence without reversing the array
const lastLogin = events.findLast((e) => e.type === 'login');
// { id: 3, type: 'login', date: '2025-02-01' }

const lastLoginIndex = events.findLastIndex((e) => e.type === 'login');
// 2

// Equivalent but slower (creates a reversed copy)
const lastLoginOld = [...events].reverse().find((e) => e.type === 'login');
```

## Array toSorted, toReversed, toSpliced — Non-Mutating Array Methods

```javascript
const original = [3, 1, 4, 1, 5, 9, 2, 6];

// ❌ Old methods: MUTATE the array in place
const sorted = original.sort(); // original is now sorted — side effect!
const reversed = original.reverse(); // original is now reversed — side effect!

// ✅ New methods: return NEW arrays, original is UNCHANGED
const sorted = original.toSorted(); // new sorted array
const reversed = original.toReversed(); // new reversed array

console.log(original); // [3, 1, 4, 1, 5, 9, 2, 6] — untouched ✅

// toSorted with a comparator
const names = ['banana', 'apple', 'cherry'];
const sorted = names.toSorted((a, b) => a.localeCompare(b));
// ['apple', 'banana', 'cherry']

// toSpliced: returns new array with items added/removed at an index
const letters = ['a', 'b', 'c', 'd'];
const withX = letters.toSpliced(2, 0, 'x'); // ['a', 'b', 'x', 'c', 'd']
const withoutC = letters.toSpliced(2, 1); // ['a', 'b', 'd']
const replaced = letters.toSpliced(1, 2, 'z'); // ['a', 'z', 'd']

// with: return new array with one element changed
const arr = [1, 2, 3, 4, 5];
const modified = arr.with(2, 99); // [1, 2, 99, 4, 5]
const last = arr.with(-1, 10); // [1, 2, 3, 4, 10] — negative index works
console.log(arr); // [1, 2, 3, 4, 5] — original unchanged ✅
```

## Symbol.prototype.description

```javascript
const sym = Symbol('my description');
sym.description; // 'my description'
// (Before ES2019, you had to do String(sym).slice(7, -1) to get this)
```

## ES2024 (ES15) — Promise Improvements and RegExp Flags

## Promise.withResolvers

```javascript
// Before: resolver functions were trapped inside the Promise constructor
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res; // expose outside the constructor
  reject = rej;
});
// Clunky and error-prone

// After: everything is neatly packaged together
const { promise, resolve, reject } = Promise.withResolvers();

// Now resolve and reject are first-class — pass them anywhere
setTimeout(() => resolve('Done!'), 2000);
document
  .getElementById('cancel')
  .addEventListener('click', () => reject(new Error('Cancelled by user')));

await promise; // resolves after 2 seconds or rejects on cancel
```

## Object.groupBy and Map.groupBy

```javascript
const products = [
  { name: 'Laptop', category: 'Electronics', price: 999 },
  { name: 'Phone', category: 'Electronics', price: 599 },
  { name: 'Shirt', category: 'Clothing', price: 29 },
  { name: 'Pants', category: 'Clothing', price: 59 },
  { name: 'Desk', category: 'Furniture', price: 299 },
];

// Group by a property
const byCategory = Object.groupBy(products, (product) => product.category);
/*
{
  Electronics: [{ name: 'Laptop', ... }, { name: 'Phone', ... }],
  Clothing: [{ name: 'Shirt', ... }, { name: 'Pants', ... }],
  Furniture: [{ name: 'Desk', ... }]
}
*/

// Group by computed value
const byPriceRange = Object.groupBy(products, ({ price }) =>
  price < 100 ? 'budget' : price < 500 ? 'mid-range' : 'premium',
);

// Map.groupBy: same but produces a Map (keys can be non-strings)
const byLength = Map.groupBy([1, 2, 3, 4, 5, 6], (n) =>
  n % 2 === 0 ? 'even' : 'odd',
);
byLength.get('even'); // [2, 4, 6]
byLength.get('odd'); // [1, 3, 5]
```

## RegExp /v flag (Unicode Sets)

```javascript
// /u flag: basic unicode support
// /v flag (ES2024): improved unicode — set operations, string properties

// Set intersection: matches a character that is in BOTH sets
/[\p{Script=Greek}&&\p{Letter}]/v.test('α'); // true

// Set difference: matches a character in the first set but NOT the second
/[\p{Letter}--\p{ASCII}]/v.test('é'); // true (é is a letter but not ASCII)

// The v flag is a superset of u — use v for all new regex with unicode
```

## ES2025 (ES16) — The Latest Features

## Iterator Methods — Lazy Sequence Processing

ES2025 adds built-in methods to iterators, enabling lazy (on-demand) processing without creating intermediate arrays.

```javascript
// Iterator.from() — wrap any iterable
const iter = Iterator.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// .map(), .filter(), .take(), .drop() are LAZY — no intermediate arrays
const result = iter
  .filter((n) => n % 2 === 0) // doesn't compute all evens yet
  .map((n) => n ** 2) // doesn't compute squares yet
  .take(3) // only process what we need
  .toArray(); // NOW compute — only processes 2, 4, 6

// [4, 16, 36] — only evaluated what was needed

// Works with generators, Sets, Maps, etc.
const wordLengths = Iterator.from(
  new Set(['hello', 'world', 'foo', 'bar', 'baz']),
)
  .filter((word) => word.length > 3)
  .map((word) => word.length)
  .toArray();
// [5, 5] — only 'hello' and 'world' have length > 3

// .reduce(), .some(), .every(), .find(), .forEach() are also available
const sum = Iterator.from([1, 2, 3, 4, 5]).reduce((a, b) => a + b, 0); // 15
```

## Import Attributes (Formerly Import Assertions)

```javascript
// Import JSON files directly
import config from './config.json' with { type: 'json' };

// Import CSS modules
import styles from './component.css' with { type: 'css' };

// Import WebAssembly
import wasmModule from './math.wasm' with { type: 'webassembly' };

// Dynamic import with attributes
const data = await import('./large-dataset.json', { with: { type: 'json' } });
```

## RegExp Escape Utility — String.raw Companion

```javascript
// Safely escape a string for use in a RegExp
// Handles all special regex characters automatically
const searchTerm = 'hello.world+test';
const escaped = RegExp.escape(searchTerm);
// 'hello\\.world\\+test'

// Use in dynamic regex construction safely
const regex = new RegExp(RegExp.escape(userInput), 'gi');
const highlighted = text.replace(regex, (match) => `<mark>${match}</mark>`);
```

## A Feature By Version Reference

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ES VERSION → KEY FEATURES                                │
│                                                                             │
│  ES2015  let/const, arrow functions, classes, modules, template literals,  │
│          destructuring, default params, rest/spread, Promises, Symbols,    │
│          Map/Set/WeakMap/WeakSet, generators, iterators, Proxy/Reflect,    │
│          for...of, computed keys, shorthand methods                        │
│                                                                             │
│  ES2016  Array.includes, exponentiation (**)                               │
│                                                                             │
│  ES2017  async/await, Object.entries/values, String.padStart/padEnd,       │
│          Object.getOwnPropertyDescriptors, Atomics, SharedArrayBuffer      │
│                                                                             │
│  ES2018  Object rest/spread, Promise.finally, async iteration,             │
│          for await...of, async generators, RegExp named groups,            │
│          RegExp lookbehind assertions                                       │
│                                                                             │
│  ES2019  Array.flat/flatMap, Object.fromEntries, String.trimStart/End,     │
│          Optional catch binding, Symbol.description, Function.toString     │
│                                                                             │
│  ES2020  Optional chaining (?.), nullish coalescing (??),                  │
│          BigInt, globalThis, Promise.allSettled, dynamic import(),         │
│          String.matchAll, module namespace exports                         │
│                                                                             │
│  ES2021  String.replaceAll, Numeric separators, Promise.any,               │
│          AggregateError, Logical assignment (&&=, ||=, ??=),               │
│          WeakRef, FinalizationRegistry                                     │
│                                                                             │
│  ES2022  Class fields & private methods (#), Array.at, Object.hasOwn,     │
│          Error.cause, top-level await, Object.at, String.at,               │
│          RegExp match indices (/d flag)                                    │
│                                                                             │
│  ES2023  Array.findLast/findLastIndex, toSorted/toReversed/toSpliced,      │
│          Array.with, Symbol as WeakMap/WeakSet key, Hashbang grammar      │
│                                                                             │
│  ES2024  Promise.withResolvers, Object.groupBy, Map.groupBy,               │
│          RegExp /v flag (Unicode Sets), ArrayBuffer.resize,                │
│          ArrayBuffer.transfer, String.isWellFormed, String.toWellFormed   │
│                                                                             │
│  ES2025  Iterator methods (map/filter/take/drop), Import attributes,       │
│          RegExp.escape, Set methods (union/intersection/difference),       │
│          Float16Array, Error.isError                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Set Methods — New Built-In Set Operations (ES2025)

```javascript
const frontend = new Set(['HTML', 'CSS', 'JavaScript', 'TypeScript']);
const backend = new Set(['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust']);

// union: all elements from both sets
frontend.union(backend);
// Set { 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust' }

// intersection: elements present in BOTH sets
frontend.intersection(backend);
// Set { 'JavaScript', 'TypeScript' }

// difference: elements in A but NOT in B
frontend.difference(backend);
// Set { 'HTML', 'CSS' }

// symmetricDifference: elements in EITHER set but NOT in both
frontend.symmetricDifference(backend);
// Set { 'HTML', 'CSS', 'Python', 'Go', 'Rust' }

// isSubsetOf, isSupersetOf, isDisjointFrom
const scripting = new Set(['JavaScript', 'TypeScript']);
scripting.isSubsetOf(frontend); // true — both are in frontend
frontend.isSupersetOf(scripting); // true
scripting.isDisjointFrom(new Set(['HTML', 'CSS'])); // true — no common elements
```

:::tip
The Set methods (`union`, `intersection`, `difference`, etc.) work with any iterable as the argument — not just other Sets. You can pass an array, a Map's keys, a generator, or any other iterable directly. They always return a new Set.
:::

## Practical Patterns Using Modern Features

```javascript
// ── Pipeline-style data transformation ─────────────────────────────────
const pipeline = (value, ...fns) => fns.reduce((acc, fn) => fn(acc), value);

const processUsers = users =>
  pipeline(
    users,
    users => users.filter(u => u.isActive),
    users => users.map(u => ({ ...u, fullName: `${u.firstName} ${u.lastName}` })),
    users => users.toSorted((a, b) => a.fullName.localeCompare(b.fullName)),
  );

// ── Immutable state updates with spread ────────────────────────────────
const updateNested = (state, path, value) => {
  const [key, ...rest] = path;
  if (rest.length === 0) {
    return { ...state, [key]: value };
  }
  return { ...state, [key]: updateNested(state[key], rest, value) };
};

// ── Optional chaining + nullish coalescing combo ───────────────────────
const getDisplayName = (user) =>
  user?.profile?.displayName ??
  user?.name?.full ??
  `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
  'Anonymous';

// ── Async error handling with Result type pattern ─────────────────────
const tryCatch = async (promise) => {
  try {
    return [null, await promise];
  } catch (error) {
    return [error, null];
  }
};

const [error, user] = await tryCatch(fetchUser(id));
if (error) {
  console.error('Failed:', error.message);
} else {
  console.log('Got user:', user.name);
}

// ── Group and aggregate with Object.groupBy ────────────────────────────
const salesReport = (transactions) => {
  const grouped = Object.groupBy(transactions, t => t.category);

  return Object.fromEntries(
    Object.entries(grouped).map(([category, items]) => [
      category,
      {
        count: items.length,
        total: items.reduce((sum, t) => sum + t.amount, 0),
        average: items.reduce((sum, t) => sum + t.amount, 0) / items.length,
      },
    ])
  );
};
```

:::note
JavaScript's evolution from ES2015 to ES2025 represents one of the fastest and most developer-positive transformations in any programming language's history. The language that once required extensive workarounds for basic patterns now ships with elegant, powerful, and composable primitives. Understanding each feature — where it came from, what problem it solves, and when to reach for it — is what separates developers who write modern JavaScript from those who write old JavaScript in a modern context.
:::
