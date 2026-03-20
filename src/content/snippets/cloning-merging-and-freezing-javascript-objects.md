---
title: 'Cloning, Merging, and Freezing JavaScript Objects'
published: 2026-01-12
draft: false
description: 'Copy and combine JavaScript objects safely using shallow and deep cloning, merging, and immutability helpers.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Copying and combining objects is extremely common. The tricky part is understanding when you’re copying **references** vs making a truly independent copy.

## Shallow Cloning with Spread and `Object.assign`

Shallow cloning copies top‑level properties, but nested objects are still shared by reference.

```javascript
const original = { a: 1, nested: { x: 10 } };

// Two ways to make a shallow copy
const clone1 = { ...original };
const clone2 = Object.assign({}, original);

clone1.a = 2; // changes only clone1.a
clone1.nested.x = 99; // changes nested object, shared with original

console.log(original.a); // 1   (primitive copied by value)
console.log(original.nested.x); // 99  (object shared by reference)
console.log(clone2.nested.x); // 99  (same nested object as original)
```

Shallow clones are great when you only need to copy one level deep, or when nested objects are intentionally shared.

## Deep Cloning

Deep cloning creates a fully independent copy, including nested objects.

For JSON‑safe data (no functions, Dates, Maps, etc.), you can use `JSON.parse(JSON.stringify(...))`:

```javascript
const user = {
  name: 'Ada',
  settings: {
    theme: 'dark',
    showToc: true,
  },
};

const deepClone = JSON.parse(JSON.stringify(user));

deepClone.settings.theme = 'light';

console.log(user.settings.theme); // "dark"
console.log(deepClone.settings.theme); // "light"
```

For more complex data, modern environments support `structuredClone`:

```javascript
const complex = {
  createdAt: new Date(),
  items: new Map([
    ['a', 1],
    ['b', 2],
  ]),
};

const copy = structuredClone(complex);

console.log(copy.createdAt instanceof Date); // true
console.log(copy.items instanceof Map); // true
```

## Merging Objects

Merging is combining properties from multiple objects into a new one, often used for configuration.

```javascript
const defaults = { theme: 'light', showToc: true, pageSize: 10 };
const userConfig = { theme: 'dark', pageSize: 20 };

// Later spreads override earlier ones
const effective = { ...defaults, ...userConfig };

console.log(effective);
// { theme: 'dark', showToc: true, pageSize: 20 }
```

For nested objects, merge nested levels explicitly to avoid losing properties.

```javascript
const defaultUser = {
  name: '',
  settings: {
    theme: 'light',
    layout: 'single-column',
  },
};

const incoming = {
  name: 'Ada',
  settings: {
    theme: 'dark',
  },
};

const mergedUser = {
  ...defaultUser,
  ...incoming,
  settings: {
    ...defaultUser.settings,
    ...incoming.settings,
  },
};

console.log(mergedUser.settings);
// { theme: 'dark', layout: 'single-column' }
```

## `Object.freeze` and `Object.seal`

`Object.freeze` makes an object **immutable** at the top level: you cannot add, remove, or change its properties.

```javascript
const config = { env: 'prod', debug: false };

Object.freeze(config);

config.debug = true; // ignored or throws in strict mode
config.newKey = 'x'; // ignored
delete config.env; // ignored

console.log(config); // { env: 'prod', debug: false }
```

Be aware that `freeze` is shallow: nested objects can still be mutated.

```javascript
const frozen = Object.freeze({ nested: { x: 1 } });

// Still allowed because nested object itself is not frozen
frozen.nested.x = 42;

console.log(frozen.nested.x); // 42
```

`Object.seal` is similar, but you can still change existing values:

```javascript
const sealed = { a: 1 };

Object.seal(sealed);

sealed.a = 2; // OK
sealed.b = 3; // ignored
delete sealed.a; // ignored

console.log(sealed); // { a: 2 }
```

## Deep Freezing Helper

To truly freeze an entire object graph, recursively freeze all nested objects.

```javascript
function deepFreeze(obj) {
  // Freeze properties before freezing self
  Object.getOwnPropertyNames(obj).forEach((name) => {
    const value = obj[name];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
}

const settings = deepFreeze({
  ui: { theme: 'dark', density: 'comfortable' },
  api: { url: 'https://api.example.com' },
});

// All these mutations will be ignored or throw in strict mode
settings.ui.theme = 'light';
settings.api.url = 'https://evil.com';

console.log(settings.ui.theme); // "dark"
console.log(settings.api.url); // "https://api.example.com"
```

Understanding shallow vs deep cloning, merging, and immutability is critical when working with stateful code (like React apps, Redux stores, or any shared application state).
