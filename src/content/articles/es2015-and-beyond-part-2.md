---
title: 'ES2015 and Beyond - Part 2'
published: 2026-01-16
draft: false
description: 'Second installment of the 3-part series about ES2015 and Beyond.'
toc: true
series: 'ES2015 and next'
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

## ES2016 (ES7) — Small but Important

## Array.prototype.includes

`includes` is cleaner than `indexOf !== -1` and correctly handles `NaN`.

```javascript
const fruits = ['apple', 'banana', 'cherry'];

// Old way: indexOf
fruits.indexOf('banana') !== -1; // true
fruits.indexOf('grape') !== -1; // false

// New way: includes
fruits.includes('banana'); // true
fruits.includes('grape'); // false

// KEY ADVANTAGE: handles NaN correctly
[1, 2, NaN].indexOf(NaN); // -1 — broken!
[1, 2, NaN].includes(NaN); // true ✅

// Second argument: start index
[1, 2, 3, 2, 1].includes(2, 3); // starts searching from index 3 → false
```

## Exponentiation Operator

```javascript
// Old way
Math.pow(2, 10); // 1024

// New way
2 ** 10; // 1024
3 ** 3; // 27
2 ** 32; // 4294967296

// Assignment shorthand
let base = 2;
base **= 8; // 256
```

## ES2017 (ES8) — async/await Changes Everything

## async and await

`async`/`await` makes asynchronous code look and behave like synchronous code — no more `.then()` chains.

```javascript
// ── Basic async/await ─────────────────────────────────────────────────
async function fetchUserProfile(userId) {
  try {
    // await pauses this function until the Promise resolves
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error; // re-throw so caller knows it failed
  }
}

// ── Parallel async operations ─────────────────────────────────────────
async function loadDashboard(userId) {
  // ❌ Sequential: slow — waits for each before starting next
  const user = await fetchUser(userId);
  const posts = await fetchPosts(userId);
  const stats = await fetchStats(userId);

  // ✅ Parallel: fast — all three start at the same time
  const [user, posts, stats] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchStats(userId),
  ]);

  return { user, posts, stats };
}

// ── async/await in loops ──────────────────────────────────────────────
// Process items sequentially:
async function processSequentially(items) {
  for (const item of items) {
    await processItem(item); // waits for each before proceeding
  }
}

// Process items in parallel:
async function processInParallel(items) {
  await Promise.all(items.map((item) => processItem(item)));
}
```

## Object.entries and Object.values

```javascript
const scores = { alice: 95, bob: 87, carol: 92 };

// Object.values: get all values as an array
Object.values(scores); // [95, 87, 92]
const average =
  Object.values(scores).reduce((a, b) => a + b) / Object.values(scores).length;

// Object.entries: get [key, value] pairs
Object.entries(scores); // [['alice', 95], ['bob', 87], ['carol', 92]]

// Iterate over an object's key-value pairs
for (const [name, score] of Object.entries(scores)) {
  console.log(`${name}: ${score}`);
}

// Convert object to Map
const scoreMap = new Map(Object.entries(scores));

// Transform object values
const doubled = Object.fromEntries(
  Object.entries(scores).map(([key, val]) => [key, val * 2]),
);
// { alice: 190, bob: 174, carol: 184 }
```

## String Padding

```javascript
// padStart: pad from the beginning
'5'.padStart(3, '0'); // '005'
'42'.padStart(5, '0'); // '00042'
'hello'.padStart(10); // '     hello' (default pads with spaces)

// padEnd: pad from the end
'hello'.padEnd(10); // 'hello     '
'3.14'.padEnd(10, '0'); // '3.14000000'

// Practical: format a list of items with aligned numbers
const items = ['apple', 'banana', 'cherry'];
items.forEach((item, i) => {
  console.log(`${String(i + 1).padStart(2, '0')}. ${item}`);
});
// '01. apple'
// '02. banana'
// '03. cherry'
```

## ES2018 — Async Iteration and Object Rest/Spread

## Object Rest and Spread (Finalized)

```javascript
// ── Object rest in destructuring ──────────────────────────────────────
const { a, b, ...remaining } = { a: 1, b: 2, c: 3, d: 4 };
console.log(remaining); // { c: 3, d: 4 }

// Practical: remove a property non-destructively
const { password, ...safeUser } = {
  name: 'Alice',
  email: 'a@b.com',
  password: 'secret',
};
console.log(safeUser); // { name: 'Alice', email: 'a@b.com' }

// ── Object spread ─────────────────────────────────────────────────────
const defaults = { theme: 'light', lang: 'en', timezone: 'UTC' };
const overrides = { theme: 'dark', lang: 'fr' };
const merged = { ...defaults, ...overrides }; // { theme: 'dark', lang: 'fr', timezone: 'UTC' }
```

## Promise.finally

```javascript
// Always runs after a Promise settles — success or failure
// Perfect for cleanup: hiding loading states, releasing resources
fetch('/api/data')
  .then((res) => res.json())
  .then((data) => render(data))
  .catch((error) => showError(error))
  .finally(() => {
    hideLoadingSpinner(); // runs regardless of success or failure
  });
```

## Regex Named Capture Groups

```javascript
// Old: positional groups — confusing to maintain
const dateOld = /(\d{4})-(\d{2})-(\d{2})/;
const matchOld = '2025-03-15'.match(dateOld);
const year = matchOld[1]; // what is index 1 again?

// New: named capture groups — self-documenting
const date = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = '2025-03-15'.match(date);
const { year, month, day } = match.groups;
// year: '2025', month: '03', day: '15'

// Named backreferences
const repeat = /(?<word>\w+) \k<word>/; // matches "the the" but not "the cat"
'the the'.match(repeat); // ✅ matches
'the cat'.match(repeat); // ❌ no match
```

## ES2019 (ES10) — Quality of Life Improvements

## Array.flat and Array.flatMap

```javascript
// ── flat: flatten nested arrays ───────────────────────────────────────
const nested = [1, [2, 3], [4, [5, 6]]];
nested.flat(); // [1, 2, 3, 4, [5, 6]] — one level deep by default
nested.flat(2); // [1, 2, 3, 4, 5, 6] — two levels deep
nested.flat(Infinity); // fully flatten any depth

// ── flatMap: map then flat one level ──────────────────────────────────
// More efficient than .map().flat() — single pass
const sentences = ['Hello World', 'Foo Bar Baz'];
const words = sentences.flatMap((sentence) => sentence.split(' '));
// ['Hello', 'World', 'Foo', 'Bar', 'Baz']

// Practical: expand items from a list
const orders = [
  { items: ['shirt', 'pants'] },
  { items: ['shoes'] },
  { items: ['hat', 'scarf', 'gloves'] },
];
const allItems = orders.flatMap((order) => order.items);
// ['shirt', 'pants', 'shoes', 'hat', 'scarf', 'gloves']

// flatMap can also filter — return empty array to skip
const numbers = [1, 2, 3, 4, 5, 6];
const doubledEvens = numbers.flatMap((n) => (n % 2 === 0 ? [n * 2] : []));
// [4, 8, 12]
```

## Object.fromEntries

```javascript
// The inverse of Object.entries()
const entries = [
  ['name', 'Alice'],
  ['age', 30],
  ['city', 'London'],
];
const obj = Object.fromEntries(entries);
// { name: 'Alice', age: 30, city: 'London' }

// Transform an object's values
const prices = { apple: 1.5, banana: 0.5, cherry: 3.0 };
const discounted = Object.fromEntries(
  Object.entries(prices).map(([fruit, price]) => [fruit, price * 0.9]),
);

// Convert Map to object
const map = new Map([
  ['key1', 'val1'],
  ['key2', 'val2'],
]);
const fromMap = Object.fromEntries(map);
```

## String.trimStart and trimEnd

```javascript
const padded = '   hello world   ';
padded.trimStart(); // 'hello world   ' — remove leading whitespace only
padded.trimEnd(); // '   hello world' — remove trailing whitespace only
padded.trim(); // 'hello world' — both (existed before ES2019)

// Aliases for consistency (were previously trimLeft/trimRight which still work)
```

## Optional Catch Binding

```javascript
// Before ES2019: had to write catch(error) even if you didn't use it
try {
  JSON.parse(maybeJson);
} catch (error) {
  // error is unused
  return false;
}

// ES2019: omit the binding when you don't need it
try {
  JSON.parse(maybeJson);
} catch {
  return false; // no (error) needed
}
```

## ES2020 (ES11) — Nullish Coalescing, Optional Chaining, and More

## Optional Chaining ?.

One of the most beloved features in years. Stop writing defensive `&&` chains.

```javascript
const user = {
  name: 'Alice',
  address: {
    city: 'London',
    // no postcode
  },
  getFullName: () => 'Alice Smith',
};

// ── Old way: defensive checks ─────────────────────────────────────────
const postcode = user && user.address && user.address.postcode;
const city = user && user.address && user.address.city;

// ── New way: optional chaining ────────────────────────────────────────
const postcode = user?.address?.postcode; // undefined (no error!)
const city = user?.address?.city; // 'London'
const zip = user?.address?.location?.zip; // undefined (no error even with 3 levels)

// ── With method calls ─────────────────────────────────────────────────
const fullName = user?.getFullName?.(); // 'Alice Smith'
const missing = user?.nonExistentMethod?.(); // undefined (no error!)

// ── With arrays ───────────────────────────────────────────────────────
const tags = null;
const firstTag = tags?.[0]; // undefined (no error!)

// ── Combined with nullish coalescing ──────────────────────────────────
const city = user?.address?.city ?? 'Unknown city'; // 'London'
const country = user?.address?.country ?? 'Unknown country'; // 'Unknown country'
```

## Nullish Coalescing ??

Returns the right side only when the left side is `null` or `undefined` (not falsy!).

```javascript
// ── The problem with || for defaults ──────────────────────────────────
const config = { timeout: 0, retries: 0, debug: false, name: '' };

// || treats 0, false, '' as falsy — uses wrong default
const timeout = config.timeout || 5000; // 5000 — WRONG! 0 is a valid timeout
const debug = config.debug || true; // true — WRONG! false was intentional
const name = config.name || 'App'; // 'App' — WRONG! '' was intentional

// ?? only triggers on null/undefined
const timeout = config.timeout ?? 5000; // 0 ✅
const debug = config.debug ?? true; // false ✅
const name = config.name ?? 'App'; // '' ✅

// null and undefined DO trigger ??
null ?? 'default'; // 'default'
undefined ?? 'default'; // 'default'
0 ?? 'default'; // 0
'' ?? 'default'; // ''
false ?? 'default'; // false
```

:::warning
Do not use `||` for default values in modern code — use `??` instead. Using `||` with numeric values that can legitimately be `0`, boolean values that can be `false`, or strings that can be `''` is a common source of subtle bugs. `??` is specifically designed for null/undefined defaults.
:::

## Nullish Assignment ??=

```javascript
let config = { timeout: null, retries: 0 };

// Only assign if the left side is null or undefined
config.timeout ??= 3000; // 3000 — was null
config.retries ??= 5; // 0 — retries is 0, not null/undefined, so unchanged

// Logical OR assignment ||=
let value = 0;
value ||= 42; // 42 — 0 is falsy, so assigns

// Logical AND assignment &&=
let status = true;
status &&= 'active'; // 'active' — true is truthy, so assigns

let empty = '';
empty &&= 'content'; // '' — empty string is falsy, so does NOT assign
```

## BigInt — Arbitrary Precision Integers

```javascript
// Regular numbers lose precision beyond 2^53 - 1
Number.MAX_SAFE_INTEGER; // 9007199254740991
9007199254740991 + 1; // 9007199254740992
9007199254740991 + 2; // 9007199254740992 — wrong! ❌

// BigInt handles any size exactly
const big = 9007199254740991n; // 'n' suffix makes it BigInt
big + 1n; // 9007199254740992n ✅
big + 2n; // 9007199254740993n ✅

// Practical: cryptography, unique IDs from databases, financial systems
const MAX_UINT64 = 18446744073709551615n;
typeof 42n; // 'bigint'

// Cannot mix BigInt and Number directly
42n + 1; // TypeError — must convert explicitly
42n + BigInt(1); // 43n ✅
Number(42n); // 42 (may lose precision for large values)
```

## globalThis — Universal Global Reference

```javascript
// Before globalThis: different globals in different environments
// Browser: window
// Node.js: global
// Web Workers: self

// The old dance:
const theGlobal =
  typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
      ? global
      : typeof self !== 'undefined'
        ? self
        : undefined;

// Now: globalThis works everywhere
globalThis.setTimeout; // ✅ works in browser, Node.js, workers — everywhere
globalThis.fetch; // ✅ works in all modern environments
```
